import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaBuilding, // Changed from FaIndustry
  FaMapMarkerAlt, 
  FaSearch, 
  FaFilter, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaLeaf,
  FaSpinner
} from 'react-icons/fa';
import { FiArrowRight, FiX } from 'react-icons/fi';
import { getConsumers } from '../api'; // Changed from getProducers

const ConsumerList = ({ onSelectConsumer }) => { // Changed prop name
  const [consumers, setConsumers] = useState([]); // Changed from producers
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedDemandRange, setSelectedDemandRange] = useState(''); // Changed from selectedCapacityRange
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConsumer, setSelectedConsumer] = useState(null); // Changed from selectedProducer

  useEffect(() => {
    fetchConsumers(); // Changed function name
  }, []);

  const fetchConsumers = async () => { // Changed function name
    try {
      setLoading(true);
      const data = await getConsumers(); // Changed API call
      setConsumers(data); // Changed state update
    } catch (error) {
      console.error('Error fetching consumers:', error); // Changed log message
    } finally {
      setLoading(false);
    }
  };

  // Get unique industries for filter
  const industries = useMemo(() => {
    const uniqueIndustries = [...new Set(consumers.map(c => c.industry_type || c.industry).filter(Boolean))]; // Changed from producers
    return uniqueIndustries.sort();
  }, [consumers]); // Changed dependency

  // Demand ranges for filtering (analogous to capacity ranges)
  const demandRanges = [ // Changed from capacityRanges
    { label: 'Small (< 500 tonnes/year)', min: 0, max: 499 },
    { label: 'Medium (500 - 5,000 tonnes/year)', min: 500, max: 4999 },
    { label: 'Large (> 5,000 tonnes/year)', min: 5000, max: Infinity }
  ];

  // Filter and sort consumers
  const filteredAndSortedConsumers = useMemo(() => { // Changed from filteredAndSortedProducers
    let filtered = consumers.filter(consumer => { // Changed from producers
      const matchesSearch = 
        (consumer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (consumer.industry_type || consumer.industry || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = !selectedIndustry || (consumer.industry_type || consumer.industry) === selectedIndustry;
      
      const matchesDemand = !selectedDemandRange || (() => { // Changed from matchesCapacity
        const range = demandRanges.find(r => r.label === selectedDemandRange); // Changed from capacityRanges
        const demand = consumer.co2_demand_tonnes_per_year || consumer.demand || 0; // Changed from co2_output_tonnes_per_year || capacity
        return demand >= range.min && demand <= range.max;
      })();

      return matchesSearch && matchesIndustry && matchesDemand;
    });

    // Sort consumers
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'demand': // Changed from capacity
          aValue = a.co2_demand_tonnes_per_year || a.demand || 0; // Changed from co2_output_tonnes_per_year || capacity
          bValue = b.co2_demand_tonnes_per_year || b.demand || 0; // Changed from co2_output_tonnes_per_year || capacity
          break;
        case 'location':
          aValue = `${a.location?.lat || 0},${a.location?.lon || 0}`;
          bValue = `${b.location?.lat || 0},${b.location?.lon || 0}`;
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [consumers, searchTerm, selectedIndustry, selectedDemandRange, sortBy, sortOrder]); // Changed dependencies

  const getIndustryIcon = (industry) => {
    const industryType = (industry || '').toLowerCase();
    switch (industryType) {
      case 'food & beverage':
        return <FaLeaf />; // Example icon for food & beverage
      case 'agriculture':
        return <FaLeaf />; // Example icon for agriculture
      case 'manufacturing':
        return <FaBuilding />; // Example icon for manufacturing
      default:
        return <FaBuilding />; // Default icon
    }
  };

  const formatDemand = (demand) => { // Changed from formatCapacity
    if (demand >= 1000000) {
      return `${(demand / 1000000).toFixed(1)}M`;
    } else if (demand >= 1000) {
      return `${(demand / 1000).toFixed(1)}K`;
    }
    return demand.toString();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('');
    setSelectedDemandRange(''); // Changed from setSelectedCapacityRange
    setSortBy('name');
    setSortOrder('asc');
  };

  const handleConsumerSelect = async (consumer) => { // Changed from handleProducerSelect
    setSelectedConsumer(consumer); // Changed from setSelectedProducer
    try {
      await onSelectConsumer(consumer); // Changed prop call
    } finally {
      // Clear the selected consumer after analysis is complete (whether cached or fresh)
      setSelectedConsumer(null); // Changed from setSelectedProducer
    }
  };

  const SkeletonCard = () => (
    <div className="consumer-card skeleton"> {/* Changed class name */}
      <div className="consumer-header"> {/* Changed class name */}
        <div className="skeleton-icon"></div>
        <div className="consumer-info"> {/* Changed class name */}
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-subtitle"></div>
        </div>
      </div>
      <div className="consumer-stats"> {/* Changed class name */}
        <div className="stat-item">
          <div className="skeleton-line skeleton-stat"></div>
          <div className="skeleton-line skeleton-label"></div>
        </div>
        <div className="stat-item">
          <div className="skeleton-line skeleton-stat"></div>
          <div className="skeleton-line skeleton-label"></div>
        </div>
      </div>
      <div className="skeleton-button"></div>
    </div>
  );

  return (
    <div className="consumer-list-container"> {/* Changed class name */}
      <div className="consumer-list-header"> {/* Changed class name */}
        <div className="header-content">
          <h2>CO₂ Consumers</h2> {/* Changed title */}
          <p>Discover verified consumers with CO₂ demand</p> {/* Changed description */}
        </div>
        
        {/* Search and Filters */}
        <div className="search-filter-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search consumers, locations, or industries..." // Changed placeholder
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search"
              >
                <FiX />
              </button>
            )}
          </div>
          
          <div className="filter-controls">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
            >
              <FaFilter />
              Filters
            </button>
            
            <div className="sort-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Sort by Name</option>
                <option value="demand">Sort by Demand</option> {/* Changed from capacity */}
                <option value="location">Sort by Location</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-order-btn"
              >
                {sortOrder === 'asc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Industry Type</label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Industries</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Demand Range</label> {/* Changed from Capacity Range */}
                <select
                  value={selectedDemandRange} // Changed from selectedCapacityRange
                  onChange={(e) => setSelectedDemandRange(e.target.value)} // Changed from setSelectedCapacityRange
                  className="filter-select"
                >
                  <option value="">All Demands</option> {/* Changed from All Capacities */}
                  {demandRanges.map(range => ( // Changed from capacityRanges
                    <option key={range.label} value={range.label}>{range.label}</option>
                  ))}
                </select>
              </div>
              
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="results-summary">
          <span className="results-count">
            {loading ? 'Loading...' : `${filteredAndSortedConsumers.length} consumer${filteredAndSortedConsumers.length !== 1 ? 's' : ''} found`} {/* Changed text */}
          </span>
          {(searchTerm || selectedIndustry || selectedDemandRange) && ( // Changed dependency
            <button onClick={clearFilters} className="clear-all-link">
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Consumer Cards */}
      <div className="consumer-cards"> {/* Changed class name */}
        {loading ? (
          // Skeleton loading state
          Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : filteredAndSortedConsumers.length === 0 ? (
          <div className="empty-state">
            <FaLeaf className="empty-icon" />
            <h3>No consumers found</h3> {/* Changed text */}
            <p>Try adjusting your search criteria or filters</p>
            <button onClick={clearFilters} className="reset-btn">
              Reset Filters
            </button>
          </div>
        ) : (
          filteredAndSortedConsumers.map(consumer => ( // Changed from producer
            <div 
              key={consumer.id} 
              className={`consumer-card ${selectedConsumer?.id === consumer.id ? 'selected' : ''}`} // Changed class name and state
            >
              <div className="consumer-header"> {/* Changed class name */}
                <div className="consumer-icon"> {/* Changed class name */}
                  {getIndustryIcon(consumer.industry_type || consumer.industry)}
                </div>
                <div className="consumer-info"> {/* Changed class name */}
                  <h3 className="consumer-name">{consumer.name || 'Unknown Consumer'}</h3> {/* Changed text */}
                  <div className="consumer-location"> {/* Changed class name */}
                    <FaMapMarkerAlt />
                    <span>{consumer.location?.lat?.toFixed(4) || '0.0000'}, {consumer.location?.lon?.toFixed(4) || '0.0000'}</span>
                  </div>
                  <div className="consumer-industry"> {/* Changed class name */}
                    {consumer.industry_type || consumer.industry || 'Unknown Industry'}
                  </div>
                </div>
              </div>
              
              <div className="consumer-stats"> {/* Changed class name */}
                <div className="stat-item">
                  <div className="stat-value">
                    {formatDemand(consumer.co2_demand_tonnes_per_year || consumer.demand || 0)} {/* Changed from formatCapacity */}
                  </div>
                  <div className="stat-label">tonnes/year</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{consumer.co2_purity_required || 'N/A'}%</div> {/* Changed from co2_purity */}
                  <div className="stat-label">purity required</div> {/* Changed label */}
                </div>
              </div>
              
              <div className="consumer-details"> {/* Changed class name */}
                <div className="detail-item">
                  <strong>Preferred Transportation:</strong> {consumer.preferred_transportation_methods ? consumer.preferred_transportation_methods.join(', ') : 'Not specified'} {/* Changed label and field */}
                </div>
                {consumer.additional_info && (
                  <div className="detail-item">
                    <strong>Additional Info:</strong> {consumer.additional_info}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => handleConsumerSelect(consumer)} // Changed function call
                className="find-matches-btn"
                disabled={selectedConsumer?.id === consumer.id} // Changed state
              >
                {selectedConsumer?.id === consumer.id ? ( // Changed state
                  <>
                    <FaSpinner className="spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Find Matches
                    <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsumerList;
