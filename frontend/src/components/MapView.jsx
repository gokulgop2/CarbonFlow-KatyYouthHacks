// frontend/src/components/MapView.jsx

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// --- HELPER COMPONENT #1: To change the map's view ---
function ChangeView({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.flyTo(focus.center, focus.zoom);
    }
  }, [focus, map]);
  return null;
}

// --- HELPER COMPONENT #2: To add the search bar ---
const SearchField = ({ onLocationSelect }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
    });

    map.addControl(searchControl);

    map.on('geosearch/showlocation', (result) => {
      onLocationSelect(result.location);
    });

    return () => map.removeControl(searchControl);
  }, [map, onLocationSelect]);

  return null;
};

// --- Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icon for consumer
const consumerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


// --- Main MapView Component ---
function MapView({ selectedConsumer, matches = [], onLocationSelect, mapFocus }) { // Changed prop name
  const mapCenter = [39.8283, -98.5795];
  const zoomLevel = 4;
  const focusZoomLevel = 9;

  const consumerFocus = selectedConsumer ? { center: [selectedConsumer.location.lat, selectedConsumer.location.lon], zoom: focusZoomLevel } : null; // Changed to consumerFocus
  const currentFocus = mapFocus || consumerFocus; // Changed to consumerFocus

  return (
    <div className="dashboard-map"> 
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{ height: '100%', width: '100%' }}
        worldCopyJump={true}
      >
        <ChangeView focus={currentFocus} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* onLocationSelect is now optional */}
        {onLocationSelect && <SearchField onLocationSelect={onLocationSelect} />}

        {/* Conditionally render markers only if they exist */}
        {selectedConsumer && (
          <Marker position={[selectedConsumer.location.lat, selectedConsumer.location.lon]} icon={consumerIcon}> {/* Changed to selectedConsumer and added custom icon */}
            <Popup><strong>CONSUMER: {selectedConsumer.name}</strong></Popup> {/* Updated popup text */}
          </Marker>
        )}

        {matches.map((match) => (
          <Marker key={match.id} position={[match.location.lat, match.location.lon]}>
            <Popup>
              <strong><span className="rank-badge">{match.analysis.rank}</span> Producer: {match.name}</strong> {/* Updated popup text */}
              <div className="popup-analysis">
                <p><em>{match.analysis.justification}</em></p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView;