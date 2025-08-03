// frontend/src/pages/ConsumerDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import Sidebar from '../components/Sidebar';
import ConsumerList from '../components/ConsumerList'; // New import

import { getImpactReport, getConsumerMatches } from '../api'; // Removed getMatches, getAnalyzedMatches, getConsumers
import { cacheReport, getCachedReport, hasReportForPair, hasAnalysisForProducer } from '../utils/reportCache'; // Removed cacheAnalysisReport, getCachedAnalysisReport
import './ConsumerDashboard.css';

function ConsumerDashboardPage() {
  const [producerMatchesForConsumer, setProducerMatchesForConsumer] = useState(null); // Renamed state
  const [selectedConsumer, setSelectedConsumer] = useState(null); // Represents the consumer selected from ConsumerList
  const [isLoading, setIsLoading] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);
  const [impactReport, setImpactReport] = useState(null);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const savedWatchlist = localStorage.getItem('carbonWatchlist');
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
    document.body.classList.add('dashboard-page');
    return () => {
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  const handleSelectConsumerAndFetchMatches = async (consumer) => { // New function name
    setSelectedConsumer(consumer); // Set the selected consumer
    if (!consumer || !consumer.id) return;
    
    setIsLoading(true);
    setProducerMatchesForConsumer(null); // Clear previous matches
    setMapFocus(null);
    setImpactReport(null);
    
    try {
      const matches = await getConsumerMatches(consumer.id);
      if (matches.length === 0) {
        alert(`No potential producer matches found for ${consumer.name}.`);
        setIsLoading(false);
        return;
      }
      setProducerMatchesForConsumer({ ranked_matches: matches }); // Wrap in ranked_matches for compatibility
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMatch = (match) => {
    setMapFocus({ center: [match.location.lat, match.location.lon], zoom: 12 });
  };

  const handleGenerateReport = async (match) => {
    if (!selectedConsumer || !match) return; // Changed from selectedProducer
    
    const cachedReport = getCachedReport(selectedConsumer, match); // Changed from selectedProducer
    if (cachedReport) {
      setImpactReport(cachedReport);
      return;
    }
    
    setIsLoading(true);
    try {
      const reportData = await getImpactReport(selectedConsumer, match); // Changed from selectedProducer
      cacheReport(selectedConsumer, match, reportData); // Changed from selectedProducer
      setImpactReport(reportData);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="consumer-dashboard">
        <Sidebar 
          consumer={selectedConsumer} // Changed prop name to consumer
          report={producerMatchesForConsumer} // Changed prop name
          onSelectMatch={handleSelectMatch}
          onGenerateReport={handleGenerateReport}
          onAddToWatchlist={() => {}} // Watchlist functionality for consumers
          hasReportForPair={hasReportForPair}
          hasAnalysisForProducer={hasAnalysisForProducer} 
          isLoading={isLoading}
        />
        <div className="main-content">
          <header className="dashboard-header">
            <h1>Consumer Dashboard</h1>
            <p>Welcome, {selectedConsumer ? selectedConsumer.name : 'Guest'}!</p>
          </header>
          <div className="dashboard-widgets">
            {/* Placeholder for widgets */}
            <div className="widget">
              <h2>My Carbon Demand</h2> {/* Updated widget title */}
              <p>View your current CO₂ demand and offset goals.</p> {/* Updated widget description */}
            </div>
            <div className="widget">
              <h2>My Matches</h2> {/* Updated widget title */}
              <p>Explore potential CO₂ producers that meet your criteria.</p> {/* Updated widget description */}
            </div>
            <div className="widget">
              <h2>Settings</h2>
              <p>Manage your preferences.</p>
            </div>
          </div>
          <div className="dashboard-map-container">
            <MapView 
              selectedConsumer={selectedConsumer} // Changed prop name to selectedConsumer
              matches={producerMatchesForConsumer ? producerMatchesForConsumer.ranked_matches : []} // Changed prop name
              mapFocus={mapFocus}
            />
          </div>
        </div>
        <div className="consumer-list-section"> {/* New section for ConsumerList */}
          <ConsumerList onSelectConsumer={handleSelectConsumerAndFetchMatches} />
        </div>
      </div>
    
  );
}

export default ConsumerDashboardPage;
