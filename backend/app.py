# backend/app.py - Enhanced with Authentication

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import uuid
import os
from math import radians, sin, cos, sqrt, atan2
import openai
import requests
from geopy.geocoders import Nominatim
from dotenv import load_dotenv
from auth import (
    create_user, find_user_by_email, check_password, 
    generate_token, token_required, update_user_profile, get_user_preferences, update_user_preferences, get_user_sustainability_goals, update_user_sustainability_goals
)
from vector_engine import VectorEngine
from matching_engine import AdvancedMatcher
import logging

# Load environment variables
load_dotenv()

# --- Azure OpenAI Configuration ---
client = None

# Check for required environment variables
AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT')
AZURE_OPENAI_API_KEY = os.getenv('AZURE_OPENAI_API_KEY')
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4')

if AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY:
    try:
        client = openai.AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_API_KEY,
            api_version="2024-03-01-preview"
        )
        print("✅ Azure OpenAI client initialized successfully")
    except Exception as e:
        print(f"⚠️  Azure OpenAI client failed to initialize: {e}")
        print("🚀 App will continue without AI features")
        client = None
else:
    print("⚠️ Azure OpenAI credentials not found in environment variables")
    print("🔑 Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables")
    print("🚀 App will continue without AI features")
    client = None

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
if not JWT_SECRET_KEY:
    print("⚠️ WARNING: JWT_SECRET_KEY environment variable not set!")
    print("🔑 This is required for secure authentication")
    print("🚨 Using a temporary key - NOT SECURE FOR PRODUCTION!")
    JWT_SECRET_KEY = 'temp-key-not-secure'

app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

# --- Initialize Vector Engine and Matching System ---
print("🚀 Initializing vector-based matching system...")
vector_engine = VectorEngine()
matcher = AdvancedMatcher(vector_engine)

# Initialize vectors on startup
try:
    vector_engine.rebuild_all_vectors()
    print("✅ Vector matching system initialized successfully")
except Exception as e:
    print(f"⚠️  Vector system initialization failed: {e}")
    print("🚀 App will continue with basic matching")

# --- Helper Functions ---
def load_db():
    db_file = os.getenv('DATABASE_FILE', 'database.json')
    try:
        with open(db_file, 'r') as f: 
            return json.load(f)
    except FileNotFoundError:
        logging.error(f"Database file {db_file} not found")
        # Create empty database structure
        return {"users": [], "producers": [], "consumers": []}
    except json.JSONDecodeError:
        logging.error(f"Invalid JSON in database file {db_file}")
        return {"users": [], "producers": [], "consumers": []}

def save_db(db):
    db_file = os.getenv('DATABASE_FILE', 'database.json')
    try:
        with open(db_file, 'w') as f: 
            json.dump(db, f, indent=2)
    except Exception as e:
        logging.error(f"Failed to save database: {e}")
        raise
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(radians, [lat1, lon1, lat2, lon2])
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c
    return distance

# --- API Endpoints ---
# --- Authentication Endpoints ---
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        role = data.get('role', 'user')  # Default to 'user' if not provided
        
        if not email or not password or not name:
            return jsonify({'message': 'Email, password, and name are required'}), 400
        
        # Check if user already exists
        if find_user_by_email(email):
            return jsonify({'message': 'User already exists'}), 409
        
        # Create new user
        user = create_user(email, password, name, role)
        if not user:
            return jsonify({'message': 'Failed to create user'}), 500
        
        # Generate token
        token = generate_token(user['id'], user['email'])
        
        return jsonify({
            'message': 'User created successfully', 
            'user': user,
            'token': token
        }), 201
    
    except Exception as e:
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user
        user = find_user_by_email(email)
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check password
        if not check_password(password, user['password']):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate token
        token = generate_token(user['id'], user['email'])
        
        # Return user without password
        user_data = user.copy()
        del user_data['password']
        
        return jsonify({
            'message': 'Login successful',
            'user': user_data,
            'token': token
        }), 200
    
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile():
    try:
        user = find_user_by_email(request.current_user['email'])
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Return user without password
        user_data = user.copy()
        del user_data['password']
        
        return jsonify({'user': user_data}), 200
    
    except Exception as e:
        return jsonify({'message': 'Failed to get profile', 'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile():
    try:
        data = request.get_json()
        
        # Validate required fields
        allowed_fields = ['name', 'bio', 'company', 'phone', 'location', 'website', 'linkedin']
        profile_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        user = update_user_profile(request.current_user['email'], profile_data)
        if not user:
            return jsonify({'message': 'Failed to update profile'}), 500
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user
        }), 200
    
    except Exception as e:
        return jsonify({'message': 'Failed to update profile', 'error': str(e)}), 500

@app.route('/api/preferences', methods=['GET'])
@token_required
def get_preferences():
    try:
        preferences = get_user_preferences(request.current_user['email'])
        return jsonify({'preferences': preferences}), 200
    
    except Exception as e:
        return jsonify({'message': 'Failed to get preferences', 'error': str(e)}), 500

@app.route('/api/preferences', methods=['PUT'])
@token_required
def update_preferences():
    try:
        data = request.get_json()
        
        # Validate preferences structure
        allowed_fields = ['notifications', 'theme', 'language', 'dashboard_layout', 'email_frequency']
        preferences_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        preferences = update_user_preferences(request.current_user['email'], preferences_data)
        if preferences is None:
            return jsonify({'message': 'Failed to update preferences'}), 500
        
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': preferences
        }), 200
    
    except Exception as e:
        return jsonify({'message': 'Failed to update preferences', 'error': str(e)}), 500

@app.route('/api/sustainability-goals', methods=['GET'])
@token_required
def get_sustainability_goals():
    try:
        goals = get_user_sustainability_goals(request.current_user['email'])
        return jsonify({'goals': goals}), 200
    
    except Exception as e:
        return jsonify({'message': 'Failed to get sustainability goals', 'error': str(e)}), 500

@app.route('/api/sustainability-goals', methods=['PUT'])
@token_required
def update_sustainability_goals():
    try:
        data = request.get_json()
        
        # Validate goals structure
        allowed_fields = ['carbon_reduction_target', 'target_date', 'current_progress', 'milestones', 'tracking_method']
        goals_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        goals = update_user_sustainability_goals(request.current_user['email'], goals_data)
        if goals is None:
            return jsonify({'message': 'Failed to update sustainability goals'}), 500
        
        return jsonify({
            'message': 'Sustainability goals updated successfully',
            'goals': goals
        }), 200
    
    except Exception as e:
        return jsonify({'message': 'Failed to update sustainability goals', 'error': str(e)}), 500

@app.route('/')
def index(): return "CarbonCapture API is running!"

@app.route('/api/geocode', methods=['POST'])
def geocode_address():
    data = request.get_json(); address = data.get('address')
    if not address: return jsonify({"error": "Address is required"}), 400
    try:
        geolocator = Nominatim(user_agent="carbon_marketplace_hackathon"); location = geolocator.geocode(address)
        if location: return jsonify({"lat": location.latitude, "lon": location.longitude})
        else: return jsonify({"error": "Could not find coordinates for the address."}), 404
    except Exception as e: print(f"Geocoding error: {e}"); return jsonify({"error": "Geocoding service failed."}), 500

@app.route('/api/producers', methods=['GET'])
def get_all_producers():
    db = load_db(); return jsonify(db['producers'])

@app.route('/api/producers', methods=['POST'])
def add_producer():
    data = request.get_json(); db = load_db()
    new_producer = {"id": f"prod_{uuid.uuid4()}", "name": data['name'], "location": data['location'], "co2_supply_tonnes_per_week": data['co2_supply_tonnes_per_week']}
    db['producers'].append(new_producer); save_db(db)
    
    # Update vectors when new producer is added
    try:
        vector_engine.update_producer_vectors(db['producers'])
        print(f"✅ Updated vectors after adding producer {new_producer['name']}")
    except Exception as e:
        print(f"⚠️  Failed to update vectors: {e}")
    
    return jsonify({"message": "Producer added successfully", "producer": new_producer}), 201

@app.route('/api/consumers', methods=['POST'])
def add_consumer():
    data = request.get_json(); db = load_db()
    new_consumer = {"id": f"cons_{uuid.uuid4()}", "name": data['name'], "industry": data['industry'], "location": data['location'], "co2_demand_tonnes_per_week": data['co2_demand_tonnes_per_week']}
    db['consumers'].append(new_consumer); save_db(db)
    
    # Update vectors when new consumer is added
    try:
        vector_engine.update_consumer_vectors(db['consumers'])
        print(f"✅ Updated vectors after adding consumer {new_consumer['name']}")
    except Exception as e:
        print(f"⚠️  Failed to update vectors: {e}")
    
    return jsonify({"message": "Consumer added successfully", "consumer": new_consumer}), 201

@app.route('/api/matches', methods=['GET'])
def get_matches():
    """Get matches for a producer using vector-based ranking"""
    producer_id = request.args.get('producer_id')
    if not producer_id:
        return jsonify({"error": "producer_id parameter is required"}), 400
    
    try:
        # Use vector-based matching
        matches = matcher.get_ranked_matches(producer_id, limit=20)
        
        if not matches:
            return jsonify({"error": "No matches found for this producer"}), 404
        
        print(f"🎯 Found {len(matches)} vector-based matches for producer {producer_id}")
        return jsonify(matches)
    
    except Exception as e:
        print(f"❌ Error in vector matching: {e}")
        
        # Fallback to basic matching if vector system fails
        try:
            db = load_db()
            producer = next((p for p in db['producers'] if p['id'] == producer_id), None)
            if not producer:
                return jsonify({"error": "Producer not found"}), 404
            
            producer_loc = producer['location']
            matches = []
            
            for consumer in db['consumers']:
                consumer_loc = consumer['location']
                distance = haversine(producer_loc['lat'], producer_loc['lon'], consumer_loc['lat'], consumer_loc['lon'])
                
                if consumer['co2_demand_tonnes_per_week'] <= producer['co2_supply_tonnes_per_week']:
                    match_data = consumer.copy()
                    match_data['distance_km'] = round(distance, 2)
                    match_data['match_score'] = 0.5  # Default score for fallback
                    match_data['vector_similarity'] = 0.0  # No vector similarity in fallback
                    matches.append(match_data)
            
            sorted_matches = sorted(matches, key=lambda x: x['distance_km'])
            print(f"⚠️  Used fallback matching, found {len(sorted_matches)} matches")
            return jsonify(sorted_matches)
        
        except Exception as fallback_error:
            print(f"❌ Fallback matching also failed: {fallback_error}")
            return jsonify({"error": "Matching service temporarily unavailable"}), 500

@app.route('/api/consumers/<consumer_id>/matches', methods=['GET'])
def get_consumer_matches(consumer_id):
    """Get matches for a consumer using vector-based ranking"""
    if not consumer_id:
        return jsonify({"error": "consumer_id parameter is required"}), 400
    
    try:
        # Use vector-based matching
        matches = matcher.get_ranked_matches_for_consumer(consumer_id, limit=20)
        
        if not matches:
            return jsonify({"error": "No matches found for this consumer"}), 404
        
        print(f"🎯 Found {len(matches)} vector-based matches for consumer {consumer_id}")
        return jsonify(matches)
    
    except Exception as e:
        print(f"❌ Error in vector matching: {e}")
        return jsonify({"error": "Matching service temporarily unavailable"}), 500

# --- AI Analysis Endpoint (New, More Reliable Strategy) ---
@app.route('/api/analyze-matches', methods=['POST'])
def analyze_matches():
    """Enhanced AI analysis using vector-based matching scores"""
    data = request.get_json()
    producer = data.get('producer')
    matches = data.get('matches')
    if not producer or not matches:
        return jsonify({"error": "Producer and matches data are required"}), 400

    analyzed_matches = []
    
    # Check if OpenAI client is available
    if client is None:
        print("🔄 OpenAI client not available, providing enhanced fallback analysis")
        for i, match in enumerate(matches):
            # Enhanced fallback using vector scores
            match_score = match.get('match_score', 0.5)
            vector_similarity = match.get('vector_similarity', 0.0)
            
            # Generate match explanation using our matching engine
            try:
                explanation = matcher.get_match_explanation(producer, match)
            except:
                explanation = "Partnership analysis based on distance and capacity compatibility"
            
            match['analysis'] = {
                "rank": match.get('rank', i + 1),
                "justification": f"Partnership between {producer['name']} and {match['name']} shows {('strong' if match_score > 0.7 else 'good' if match_score > 0.5 else 'moderate')} compatibility (Score: {match_score:.2f}). {explanation}",
                "strategic_considerations": [
                    f"Overall match score: {match_score:.2f} (vector similarity: {vector_similarity:.2f})",
                    f"Supply-demand fit: {match['co2_demand_tonnes_per_week']}t demand vs {producer['co2_supply_tonnes_per_week']}t supply",
                    f"Distance: {match['distance_km']} km for logistics planning"
                ]
            }
            analyzed_matches.append(match)
        
        final_report = {
            "overall_summary": f"Found {len(analyzed_matches)} potential partners for {producer['name']}, ranked by AI-powered vector similarity. Enhanced matching algorithm considers industry compatibility, capacity fit, and logistics optimization.",
            "ranked_matches": analyzed_matches
        }
        return jsonify(final_report)

    # Enhanced AI analysis loop using vector-based matching scores
    for i, match in enumerate(matches):
        try:
            # Get enhanced matching data
            match_score = match.get('match_score', 0.5)
            vector_similarity = match.get('vector_similarity', 0.0)
            capacity_fit = match.get('capacity_fit', 0.5)
            distance_score = match.get('distance_score', 0.5)
            quality_match = match.get('quality_match', 0.5)
            
            # Enhanced prompt with vector scoring data
            prompt_content = f"""
            You are a sustainability business analyst using advanced AI matching algorithms. Analyze this partnership opportunity:

            Producer:
            - Name: "{producer['name']}"
            - Weekly CO2 Supply: {producer['co2_supply_tonnes_per_week']} tonnes
            - Industry: {producer.get('industry_type', 'Unknown')}

            Consumer:
            - Name: "{match['name']}"
            - Industry: "{match['industry']}"
            - Weekly CO2 Demand: {match['co2_demand_tonnes_per_week']} tonnes
            - Distance: {match['distance_km']} km

            AI MATCHING SCORES:
            - Overall Match Score: {match_score:.2f}/1.0 (algorithmic compatibility)
            - Vector Similarity: {vector_similarity:.2f}/1.0 (business profile match)
            - Capacity Compatibility: {capacity_fit:.2f}/1.0 (supply-demand fit)
            - Distance Optimization: {distance_score:.2f}/1.0 (logistics efficiency)
            - Quality Alignment: {quality_match:.2f}/1.0 (CO2 purity match)

            Your response must be a single, valid JSON object with two keys: "justification" and "strategic_considerations".
            - "justification": A concise paragraph explaining the partnership potential, referencing the AI scores.
            - "strategic_considerations": An array of 2-3 short bullet-point style strings highlighting key decision factors based on the scoring.
            """
            response = client.chat.completions.create(
                model=AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": "You are an expert analyst providing data in a strict JSON format."},
                    {"role": "user", "content": prompt_content}
                ],
                temperature=0.5,
                max_tokens=500
            )
            analysis_text = response.choices[0].message.content
            if not analysis_text: raise Exception("AI returned empty content")
            
            analysis_json = json.loads(analysis_text)
            
            # Add the analysis and rank to the match object
            match['analysis'] = {
                "rank": i + 1,
                "justification": analysis_json.get("justification", "N/A"),
                "strategic_considerations": analysis_json.get("strategic_considerations", [])
            }
        except Exception as e:
            # If a single AI call fails, we still add the match with a fallback message
            print(f"AI call failed for match {match['name']}: {e}")
            match['analysis'] = {
                "rank": i + 1,
                "justification": f"Partnership between {producer['name']} and {match['name']} shows potential. Distance: {match['distance_km']} km. Detailed AI analysis temporarily unavailable.",
                "strategic_considerations": [
                    f"Supply-demand fit: {match['co2_demand_tonnes_per_week']}t demand vs {producer['co2_supply_tonnes_per_week']}t supply",
                    f"Logistics consideration: {match['distance_km']} km delivery distance"
                ]
            }
        
        analyzed_matches.append(match)

    final_report = {
        "overall_summary": f"Found {len(analyzed_matches)} potential partners for {producer['name']}, sorted by distance. Each has been analyzed for strategic fit.",
        "ranked_matches": analyzed_matches
    }

    return jsonify(final_report)

@app.route('/api/rebuild-vectors', methods=['POST'])
def rebuild_vectors():
    """Rebuild all vectors from current database data"""
    try:
        vector_engine.rebuild_all_vectors()
        stats = vector_engine.get_vector_stats()
        return jsonify({
            "message": "Vectors rebuilt successfully",
            "stats": stats
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to rebuild vectors: {str(e)}"}), 500

@app.route('/api/matching-stats', methods=['GET'])
def get_matching_stats():
    """Get statistics about the matching system"""
    try:
        stats = matcher.get_matching_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get matching stats: {str(e)}"}), 500

@app.route('/api/impact-model', methods=['POST'])
def impact_model():
    data = request.get_json(); producer = data.get('producer'); consumer = data.get('consumer')
    if not producer or not consumer: return jsonify({"error": "Producer and consumer data are required"}), 400
    try:
        carbon_credit_price_per_tonne = 25.00; industrial_co2_price_per_tonne = 75.00; weeks_per_year = 52
        estimated_delivery_emissions_per_100km = 0.05
        tonnes_per_week = min(producer['co2_supply_tonnes_per_week'], consumer['co2_demand_tonnes_per_week'])
        tonnes_per_year = tonnes_per_week * weeks_per_year
        annual_revenue_for_producer = tonnes_per_year * carbon_credit_price_per_tonne
        annual_savings_for_consumer = tonnes_per_year * industrial_co2_price_per_tonne
        estimated_delivery_emissions = (consumer['distance_km'] / 100) * estimated_delivery_emissions_per_100km * weeks_per_year
        net_co2_sequestered = tonnes_per_year - estimated_delivery_emissions
        return jsonify({
            "producer_name": producer['name'], "consumer_name": consumer['name'], "annual_tonnage": round(tonnes_per_year, 2),
            "financials": {"producer_annual_revenue": round(annual_revenue_for_producer, 2), "consumer_annual_savings": round(annual_savings_for_consumer, 2), "carbon_credit_value": round(annual_revenue_for_producer, 2)},
            "environmental": {"co2_diverted": round(tonnes_per_year, 2), "estimated_logistics_emissions": round(estimated_delivery_emissions, 2), "net_co2_impact": round(net_co2_sequestered, 2)}
        })
    except Exception as e:
        print(f"An error occurred in impact-model: {e}")
        return jsonify({"error": "Failed to calculate impact model."}), 500

# --- Run the App ---
if __name__ == '__main__':
    # Get port from environment variable (for Railway deployment)
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print(f"🚀 Starting Flask app on port {port} with debug={debug}")
    app.run(debug=debug, host='0.0.0.0', port=port)