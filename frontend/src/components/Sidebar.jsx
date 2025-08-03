// frontend/src/components/Sidebar.jsx

import React from 'react';
import { FaSpinner } from 'react-icons/fa';

function Sidebar({ consumer, report, onSelectMatch, onGenerateReport, onAddToWatchlist, hasReportForPair, hasAnalysisForProducer, isLoading }) {
  if (!consumer) {
    return (
      <div className="sidebar-container">
        <div className="sidebar-header"><h2>Opportunity Report</h2></div>
        <div className="sidebar-content"><p>Select a consumer to generate a ranked analysis of potential producer partners.</p></div>
      </div>
    );
  }

  if (!report || isLoading) {
    return (
      <div className="sidebar-container">
        <div className="sidebar-header"><h2>Opportunity Report for {consumer.name}</h2></div>
        <div className="sidebar-content">
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Analysis in progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h2>Opportunity Report for {consumer.name}</h2>
      </div>
      <div className="sidebar-content">
        <div className="executive-summary">
          <h3>Executive Summary</h3>
          <p>{report.overall_summary}</p>
        </div>
        <h3>Ranked Opportunities</h3>
        {report.ranked_matches.map((match) => {
          const hasCachedReport = hasReportForPair && hasReportForPair(consumer, match); // Changed producer to consumer
          
          return (
            <div key={match.id} className="match-card">
              <h3>
                <span className="rank-badge">{match.analysis.rank}</span> 
                {match.name}

              </h3>
              <p><strong>Distance:</strong> {match.distance_km} km</p>
              
              {/* Enhanced Vector-Based Match Scores */}
              {match.match_score && (
                <div className="vector-scores">
                  <div className="score-header">
                    <h4>AI Match Score: <span className="score-value">{(match.match_score * 100).toFixed(1)}%</span></h4>
                  </div>
                  <div className="score-breakdown">
                    {match.vector_similarity && (
                      <div className="score-item">
                        <span className="score-label">Business Compatibility:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${match.vector_similarity * 100}%` }}
                          />
                        </div>
                        <span className="score-percent">{(match.vector_similarity * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {match.capacity_fit && (
                      <div className="score-item">
                        <span className="score-label">Capacity Match:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${match.capacity_fit * 100}%` }}
                          />
                        </div>
                        <span className="score-percent">{(match.capacity_fit * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {match.quality_match && (
                      <div className="score-item">
                        <span className="score-label">Quality Alignment:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${match.quality_match * 100}%` }}
                          />
                        </div>
                        <span className="score-percent">{(match.quality_match * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Analysis Section */}
              <div className="analysis-section">
                <h4>AI Analysis</h4>
                <p>{match.analysis.justification}</p>
                <h4>Strategic Considerations</h4>
                <ul>
                  {match.analysis.strategic_considerations.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
              
              <div className="card-buttons">
                <button onClick={() => onSelectMatch(match)}>Focus on Map</button>
                <button className="report-btn" onClick={() => onGenerateReport(match)}>
                  View Impact Report
                </button>
              </div>
              <button className="watchlist-btn" onClick={() => onAddToWatchlist(match)}>
                + Save Producer to Watchlist
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;