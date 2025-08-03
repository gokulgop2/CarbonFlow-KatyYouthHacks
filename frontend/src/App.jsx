// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import Layouts and Pages
import MainLayout from './components/MainLayout';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import RegisterProducerPage from './pages/RegisterProducerPage';
import RegisterConsumerPage from './pages/RegisterConsumerPage';
import ComparisonPage from './pages/ComparisonPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ConsumerDashboardPage from './pages/ConsumerDashboardPage';
import DebugInfo from './components/DebugInfo';

// Add a simple fallback component for 404s
const NotFound = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    padding: '20px'
  }}>
    <h1 style={{ color: '#ef4444', marginBottom: '20px' }}>404 - Page Not Found</h1>
    <p style={{ marginBottom: '30px', textAlign: 'center' }}>
      The page you're looking for doesn't exist.
    </p>
    <button
      onClick={() => window.location.href = '/'}
      style={{
        padding: '10px 20px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Go to Home
    </button>
  </div>
);

function App() {
  // Show debug info in development or when there's a debug flag
  const showDebug = process.env.NODE_ENV === 'development' || 
                   new URLSearchParams(window.location.search).has('debug');

  console.log('🚀 App component rendering');
  console.log('🌍 Current URL:', window.location.href);
  console.log('🔧 Debug mode:', showDebug);

  return (
    <>
      <DebugInfo show={showDebug} />
      <Routes>
        {/* Route 1: The Landing Page at the root URL "/" */}
        <Route path="/" element={<LandingPage />} />

        {/* Route 2: The registration pages, which are standalone */}
        <Route path="/register-producer" element={<RegisterProducerPage />} />
        <Route path="/register-consumer" element={<RegisterConsumerPage />} />
        
        {/* Route 3: All other pages will share the MainLayout (which has the header) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/consumer-dashboard" element={<ConsumerDashboardPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Fallback route for 404s */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;