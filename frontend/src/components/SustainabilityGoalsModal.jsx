import React, { useState, useEffect } from 'react';
import { FiX, FiTarget, FiCalendar, FiTrendingUp, FiPlus, FiTrash2, FiSave, FiActivity } from 'react-icons/fi';
import { FaLeaf } from 'react-icons/fa';
import { authAPI } from '../utils/auth';

function SustainabilityGoalsModal({ isOpen, onClose, user }) {
  const [goals, setGoals] = useState({
    carbon_reduction_target: 0,
    target_date: '',
    current_progress: 0,
    milestones: [],
    tracking_method: 'manual'
  });
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    target_value: 0,
    deadline: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchGoals();
    }
  }, [isOpen, user]);

  const fetchGoals = async () => {
    try {
      const token = authAPI.getToken();
      const response = await fetch(`https://carbonflow-production.up.railway.app/api/sustainability-goals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const handleGoalChange = (field, value) => {
    setGoals(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleAddMilestone = () => {
    if (newMilestone.title && newMilestone.target_value > 0) {
      setGoals(prev => ({
        ...prev,
        milestones: [...prev.milestones, {
          ...newMilestone,
          id: Date.now(),
          completed: false,
          created_at: new Date().toISOString()
        }]
      }));
      setNewMilestone({
        title: '',
        target_value: 0,
        deadline: '',
        description: ''
      });
    }
  };

  const handleRemoveMilestone = (id) => {
    setGoals(prev => ({
      ...prev,
      milestones: prev.milestones.filter(milestone => milestone.id !== id)
    }));
  };

  const handleToggleMilestone = (id) => {
    setGoals(prev => ({
      ...prev,
      milestones: prev.milestones.map(milestone =>
        milestone.id === id 
          ? { ...milestone, completed: !milestone.completed }
          : milestone
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = authAPI.getToken();
      const response = await fetch(`https://carbonflow-production.up.railway.app/api/sustainability-goals`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goals)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update sustainability goals');
      }

      setSuccess('Sustainability goals updated successfully!');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = () => {
    if (goals.carbon_reduction_target === 0) return 0;
    return Math.min((goals.current_progress / goals.carbon_reduction_target) * 100, 100);
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress < 25) return '#ef4444';
    if (progress < 50) return '#f97316';
    if (progress < 75) return '#eab308';
    return '#10b981';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content sustainability-goals-modal">
        <div className="modal-header">
          <h2>
            <FaLeaf />
            Sustainability Goals
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goals-form">
          <div className="goals-sections">
            
            {/* Main Goal Section */}
            <div className="goal-section">
              <h3>
                <FiTarget />
                Carbon Reduction Target
              </h3>
              <div className="goal-inputs">
                <div className="input-group">
                  <label>Annual Reduction Target (tonnes CO₂)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={goals.carbon_reduction_target}
                    onChange={(e) => handleGoalChange('carbon_reduction_target', parseFloat(e.target.value) || 0)}
                    placeholder="Enter target amount"
                  />
                </div>

                <div className="input-group">
                  <label>
                    <FiCalendar />
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goals.target_date}
                    onChange={(e) => handleGoalChange('target_date', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>
                    <FiTrendingUp />
                    Current Progress (tonnes CO₂)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={goals.current_progress}
                    onChange={(e) => handleGoalChange('current_progress', parseFloat(e.target.value) || 0)}
                    placeholder="Enter current progress"
                  />
                </div>

                <div className="input-group">
                  <label>
                    <FiActivity />
                    Tracking Method
                  </label>
                  <select
                    value={goals.tracking_method}
                    onChange={(e) => handleGoalChange('tracking_method', e.target.value)}
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="automated">Automated Tracking</option>
                    <option value="monthly_review">Monthly Review</option>
                    <option value="quarterly_review">Quarterly Review</option>
                  </select>
                </div>
              </div>

              {/* Progress Visualization */}
              {goals.carbon_reduction_target > 0 && (
                <div className="progress-section">
                  <h4>Progress Overview</h4>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${calculateProgress()}%`,
                        backgroundColor: getProgressColor()
                      }}
                    />
                  </div>
                  <div className="progress-stats">
                    <span>{goals.current_progress.toFixed(1)} / {goals.carbon_reduction_target.toFixed(1)} tonnes CO₂</span>
                    <span>{calculateProgress().toFixed(1)}% Complete</span>
                  </div>
                </div>
              )}
            </div>

            {/* Milestones Section */}
            <div className="goal-section">
              <h3>
                <FiTarget />
                Milestones
              </h3>
              
              {/* Add New Milestone */}
              <div className="add-milestone">
                <h4>Add New Milestone</h4>
                <div className="milestone-inputs">
                  <input
                    type="text"
                    placeholder="Milestone title"
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Target value (tonnes CO₂)"
                    min="0"
                    step="0.1"
                    value={newMilestone.target_value}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                  />
                  <input
                    type="date"
                    placeholder="Deadline"
                    value={newMilestone.deadline}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                    rows="2"
                  />
                  <button type="button" onClick={handleAddMilestone} className="btn-add-milestone">
                    <FiPlus />
                    Add Milestone
                  </button>
                </div>
              </div>

              {/* Existing Milestones */}
              <div className="milestones-list">
                {goals.milestones.map((milestone) => (
                  <div key={milestone.id} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
                    <div className="milestone-header">
                      <label>
                        <input
                          type="checkbox"
                          checked={milestone.completed}
                          onChange={() => handleToggleMilestone(milestone.id)}
                        />
                        <span className="milestone-title">{milestone.title}</span>
                      </label>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMilestone(milestone.id)}
                        className="btn-remove"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="milestone-details">
                      <span className="milestone-value">{milestone.target_value} tonnes CO₂</span>
                      {milestone.deadline && (
                        <span className="milestone-deadline">Due: {new Date(milestone.deadline).toLocaleDateString()}</span>
                      )}
                    </div>
                    {milestone.description && (
                      <p className="milestone-description">{milestone.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <FiSave />
                  Save Goals
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SustainabilityGoalsModal; 