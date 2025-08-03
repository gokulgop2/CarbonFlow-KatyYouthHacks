import bcrypt
import jwt
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app

def load_users():
    """Load users from database.json"""
    try:
        with open('database.json', 'r') as f:
            data = json.load(f)
            return data.get('users', [])
    except FileNotFoundError:
        return []

def save_users(users):
    """Save users to database.json"""
    try:
        with open('database.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = {"producers": [], "consumers": []}
    
    data['users'] = users
    with open('database.json', 'w') as f:
        json.dump(data, f, indent=2)

def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    """Check if password matches the hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, email):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = verify_token(token)
            if not payload:
                return jsonify({'message': 'Token is invalid or expired'}), 401
            
            request.current_user = payload
        except Exception as e:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    return decorated

def find_user_by_email(email):
    """Find user by email"""
    users = load_users()
    return next((user for user in users if user['email'] == email), None)

def create_user(email, password, name, role='user'):
    """Create a new user"""
    users = load_users()
    
    # Check if user already exists
    if find_user_by_email(email):
        return None
    
    user_id = f"user_{len(users) + 1}"
    new_user = {
        'id': user_id,
        'email': email,
        'password': hash_password(password),
        'name': name,
        'role': role,
        'created_at': datetime.utcnow().isoformat(),
        'profile': {
            'bio': '',
            'company': '',
            'phone': '',
            'location': '',
            'website': '',
            'linkedin': ''
        },
        'preferences': {
            'notifications': {
                'email': True,
                'push': True,
                'matches': True,
                'reports': True,
                'marketing': False
            },
            'theme': 'dark',
            'language': 'en',
            'dashboard_layout': 'default',
            'email_frequency': 'daily'
        },
        'sustainability_goals': {
            'carbon_reduction_target': 0,
            'target_date': '',
            'current_progress': 0,
            'milestones': [],
            'tracking_method': 'manual'
        }
    }
    
    users.append(new_user)
    save_users(users)
    
    # Return user without password
    user_data = new_user.copy()
    del user_data['password']
    return user_data

def update_user_profile(email, profile_data):
    """Update user profile information"""
    users = load_users()
    user = find_user_by_email(email)
    
    if not user:
        return None
    
    # Update user profile
    for i, u in enumerate(users):
        if u['email'] == email:
            # Initialize profile if it doesn't exist
            if 'profile' not in users[i]:
                users[i]['profile'] = {}
            
            # Update profile fields
            users[i]['profile'].update(profile_data)
            
            # Update name if provided
            if 'name' in profile_data:
                users[i]['name'] = profile_data['name']
            
            break
    
    save_users(users)
    
    # Return updated user without password
    updated_user = find_user_by_email(email)
    if not updated_user:
        return None
    user_data = updated_user.copy()
    del user_data['password']
    return user_data

def get_user_preferences(email):
    """Get user preferences"""
    user = find_user_by_email(email)
    if not user:
        return None
    
    # Return default preferences if not set
    default_preferences = {
        'notifications': {
            'email': True,
            'push': True,
            'matches': True,
            'reports': True,
            'marketing': False
        },
        'theme': 'dark',
        'language': 'en',
        'dashboard_layout': 'default',
        'email_frequency': 'daily'
    }
    
    return user.get('preferences', default_preferences)

def update_user_preferences(email, preferences_data):
    """Update user preferences"""
    users = load_users()
    user = find_user_by_email(email)
    
    if not user:
        return None
    
    # Update user preferences
    for i, u in enumerate(users):
        if u['email'] == email:
            # Initialize preferences if it doesn't exist
            if 'preferences' not in users[i]:
                users[i]['preferences'] = {}
            
            # Update preferences fields
            users[i]['preferences'].update(preferences_data)
            break
    
    save_users(users)
    
    # Return updated preferences
    updated_user = find_user_by_email(email)
    if not updated_user:
        return None
    return updated_user.get('preferences', {})

def get_user_sustainability_goals(email):
    """Get user sustainability goals"""
    user = find_user_by_email(email)
    if not user:
        return None
    
    # Return default goals if not set
    default_goals = {
        'carbon_reduction_target': 0,
        'target_date': '',
        'current_progress': 0,
        'milestones': [],
        'tracking_method': 'manual'
    }
    
    return user.get('sustainability_goals', default_goals)

def update_user_sustainability_goals(email, goals_data):
    """Update user sustainability goals"""
    users = load_users()
    user = find_user_by_email(email)
    
    if not user:
        return None
    
    # Update user sustainability goals
    for i, u in enumerate(users):
        if u['email'] == email:
            # Initialize goals if it doesn't exist
            if 'sustainability_goals' not in users[i]:
                users[i]['sustainability_goals'] = {}
            
            # Update goals fields
            users[i]['sustainability_goals'].update(goals_data)
            break
    
    save_users(users)
    
    # Return updated goals
    updated_user = find_user_by_email(email)
    if not updated_user:
        return None
    return updated_user.get('sustainability_goals', {}) 