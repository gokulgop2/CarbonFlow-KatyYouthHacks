// frontend/src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import Sidebar from '../components/Sidebar';
import ProducerList from '../components/ProducerList';
import ImpactModal from '../components/ImpactModal';
import WelcomeModal from '../components/WelcomeModal';
import { getMatches, getAnalyzedMatches, getImpactReport } from '../api';
import { cacheReport, getCachedReport, hasReportForPair, cacheAnalysisReport, getCachedAnalysisReport, hasAnalysisForProducer } from '../utils/reportCache';

function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false); // Set to false to avoid showing it every time during dev
  const [analysisReport, setAnalysisReport] = useState(null);
  const [selectedProducer, setSelectedProducer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);
  const [impactReport, setImpactReport] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    console.log('🚀 HomePage useEffect running');
    const savedWatchlist = localStorage.getItem('carbonWatchlist');
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
    
    const hasVisited = sessionStorage.getItem('hasVisitedCarbonMarketplace');
    if (!hasVisited) {
      setShowWelcome(true);
    }

    // Add dashboard-page class to body for viewport locking
    document.body.classList.add('dashboard-page');
    
    // Restore last analyzed producer
    restoreLastSession();
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  // Restore the last analyzed producer and their analysis
  const restoreLastSession = async () => {
    try {
      const lastProducerData = localStorage.getItem('carbonflow_last_producer');
      if (lastProducerData) {
        const lastProducer = JSON.parse(lastProducerData);
        console.log('🔄 Restoring last session for:', lastProducer.name);
        
        // Check if we have cached analysis for this producer
        const cachedAnalysis = getCachedAnalysisReport(lastProducer);
        if (cachedAnalysis) {
          console.log('✅ Found cached analysis, restoring session');
          setSelectedProducer(lastProducer);
          
          // Add a slight delay to show the loading animation
          setTimeout(() => {
            setAnalysisReport(cachedAnalysis);
          }, 800);
        } else {
          console.log('⚠️ No cached analysis found, clearing last producer');
          localStorage.removeItem('carbonflow_last_producer');
        }
      }
    } catch (error) {
      console.error('Failed to restore last session:', error);
      localStorage.removeItem('carbonflow_last_producer');
    } finally {
      setIsRestoringSession(false);
    }
  };

  // Check for cached reports when producer or analysis changes
  useEffect(() => {
    if (selectedProducer && analysisReport) {
      console.log(`🔍 Checking for cached reports for producer: ${selectedProducer.name}`);
      
      // Check if any of the matches have cached reports
      const matchesWithCache = analysisReport.ranked_matches?.filter(match => 
        hasReportForPair(selectedProducer, match)
      );
      
      if (matchesWithCache?.length > 0) {
        console.log(`📋 Found ${matchesWithCache.length} cached reports for current matches`);
      }
    }
  }, [selectedProducer, analysisReport]);

  const handleAddToWatchlist = (matchToAdd) => {
    let updatedWatchlist = [];
    if (!watchlist.some(item => item.id === matchToAdd.id)) {
      updatedWatchlist = [...watchlist, matchToAdd];
      alert(`${matchToAdd.name} has been added to your watchlist!`);
    } else {
      alert(`${matchToAdd.name} is already in your watchlist.`);
      updatedWatchlist = watchlist;
    }
    setWatchlist(updatedWatchlist);
    localStorage.setItem('carbonWatchlist', JSON.stringify(updatedWatchlist));
    window.dispatchEvent(new Event('watchlistUpdated'));
  };
  
  // Enhanced handler with analysis caching
  const handleFindMatches = async (producer) => {
    if (!producer || !producer.id) return;
    
    setSelectedProducer(producer);
    setMapFocus(null);
    setImpactReport(null);
    
    // Check if we have a cached analysis for this producer
    const cachedAnalysis = getCachedAnalysisReport(producer);
    if (cachedAnalysis) {
      console.log(`🚀 Loading cached analysis for ${producer.name}`);
      
      // Save this producer as the last analyzed one
      localStorage.setItem('carbonflow_last_producer', JSON.stringify(producer));
      
      setAnalysisReport(cachedAnalysis);
      return;
    }
    
    // If no cached analysis, generate a new one
    setIsLoading(true);
    setAnalysisReport(null);
    try {
      const initialMatches = await getMatches(producer.id);
      if (initialMatches.length === 0) {
        alert(`No potential matches found for ${producer.name}.`);
        setIsLoading(false);
        return;
      }
      const report = await getAnalyzedMatches(producer, initialMatches);
      
      // Cache the new analysis
      cacheAnalysisReport(producer, report);
      
      // Save this producer as the last analyzed one
      localStorage.setItem('carbonflow_last_producer', JSON.stringify(producer));
      
      setAnalysisReport(report);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMatch = (match) => {
    setMapFocus({ center: [match.location.lat, match.location.lon], zoom: 12 });
    
    // Check if there's a cached report for this producer-consumer pair
    if (selectedProducer && hasReportForPair(selectedProducer, match)) {
      console.log(`📋 Cached report available for ${selectedProducer.name} + ${match.name}`);
    }
  };

  const handleGenerateReport = async (match) => {
    if (!selectedProducer || !match) return;
    
    // First check if we have a cached report
    const cachedReport = getCachedReport(selectedProducer, match);
    if (cachedReport) {
      console.log(`🚀 Loading cached report for ${selectedProducer.name} + ${match.name}`);
      setImpactReport(cachedReport);
      return;
    }
    
    // If no cached report, generate a new one
    setIsLoading(true);
    try {
      const reportData = await getImpactReport(selectedProducer, match);
      
      // Cache the new report
      cacheReport(selectedProducer, match, reportData);
      
      setImpactReport(reportData);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestContinue = () => {
    sessionStorage.setItem('hasVisitedCarbonMarketplace', 'true');
    setShowWelcome(false);
  };

  // Optional: Clear session function (can be called from UI if needed)
  const clearSession = () => {
    localStorage.removeItem('carbonflow_last_producer');
    setSelectedProducer(null);
    setAnalysisReport(null);
    setMapFocus(null);
    setImpactReport(null);
  };

  console.log('🔥 HomePage rendering - component should appear');

  return (
    <>
      {showWelcome && <WelcomeModal onGuestContinue={handleGuestContinue} />}
      {isLoading && <div className="loading-overlay">Analyzing...</div>}
      {isRestoringSession && <div className="loading-overlay">Restoring session...</div>}
      <ImpactModal report={impactReport} onClose={() => setImpactReport(null)} />
      
      <main className="dashboard-layout-3-col">
        <div className="dashboard-forms">
          <ProducerList onFindMatches={handleFindMatches} />
        </div>
        <div className="dashboard-sidebar">
          <Sidebar 
            producer={selectedProducer} 
            report={analysisReport} 
            onSelectMatch={handleSelectMatch}
            onGenerateReport={handleGenerateReport}
            onAddToWatchlist={handleAddToWatchlist}
            hasReportForPair={hasReportForPair}
            hasAnalysisForProducer={hasAnalysisForProducer}
            isLoading={isLoading || isRestoringSession}
          />
        </div>
        <div className="dashboard-map">
          <MapView 
            selectedProducer={selectedProducer} 
            matches={analysisReport ? analysisReport.ranked_matches : []}
            mapFocus={mapFocus}
          />
        </div>
      </main>
    </>
  );
}

export default HomePage;