import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { checkApiHealth } from '../api';

const DebugInfo = ({ show = false }) => {
  const location = useLocation();
  const [apiStatus, setApiStatus] = useState('checking');
  const [debugInfo, setDebugInfo] = useState({
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    pathname: location.pathname,
    hasLocalStorage: !!window.localStorage,
    hasSessionStorage: !!window.sessionStorage,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const checkApi = async () => {
      try {
        const isHealthy = await checkApiHealth();
        setApiStatus(isHealthy ? 'healthy' : 'unhealthy');
      } catch (error) {
        setApiStatus('error');
      }
    };

    checkApi();
    
    // Log app loading status
    console.log('🚀 App loaded successfully');
    console.log('📍 Current route:', location.pathname);
    console.log('🌐 API Status:', apiStatus);
    console.log('🔍 Debug Info:', debugInfo);
  }, [location.pathname]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '15px',
      color: '#fff',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>Debug Info</h3>
      <div style={{ marginBottom: '8px' }}>
        <strong>Route:</strong> {location.pathname}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>API Status:</strong> 
        <span style={{ 
          color: apiStatus === 'healthy' ? '#10b981' : 
                 apiStatus === 'unhealthy' ? '#f59e0b' : '#ef4444',
          marginLeft: '5px'
        }}>
          {apiStatus}
        </span>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Online:</strong> {debugInfo.isOnline ? '✅' : '❌'}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Storage:</strong> {debugInfo.hasLocalStorage ? '✅' : '❌'}
      </div>
      <div style={{ fontSize: '10px', color: '#666' }}>
        {debugInfo.timestamp}
      </div>
    </div>
  );
};

export default DebugInfo; 