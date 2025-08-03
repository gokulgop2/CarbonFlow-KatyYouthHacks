import React, { useState, useEffect } from 'react';
import { FiX, FiSettings, FiBell, FiMoon, FiSun, FiGlobe, FiLayout, FiMail, FiSave } from 'react-icons/fi';
import { authAPI } from '../utils/auth';

function PreferencesModal({ isOpen, onClose, user }) {
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      matches: true,
      reports: true,
      marketing: false
    },
    theme: 'dark',
    language: 'en',
    dashboard_layout: 'default',
    email_frequency: 'daily'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchPreferences();
    }
  }, [isOpen, user]);

  const fetchPreferences = async () => {
    try {
      const token = authAPI.getToken();
      const response = await fetch(`https://carbonflow-production.up.railway.app/api/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const handleNotificationChange = (type, value) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value
      }
    }));
    setError('');
    setSuccess('');
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = authAPI.getToken();
      const response = await fetch(`https://carbonflow-production.up.railway.app/api/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update preferences');
      }

      setSuccess('Preferences updated successfully!');
      
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content preferences-modal">
        <div className="modal-header">
          <h2>
            <FiSettings />
            Preferences
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="preferences-form">
          <div className="preferences-sections">
            
            {/* Notifications Section */}
            <div className="preference-section">
              <h3>
                <FiBell />
                Notifications
              </h3>
              <div className="preference-items">
                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.email}
                      onChange={(e) => handleNotificationChange('email', e.target.checked)}
                    />
                    <span>Email notifications</span>
                  </label>
                  <p>Receive notifications via email</p>
                </div>

                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.push}
                      onChange={(e) => handleNotificationChange('push', e.target.checked)}
                    />
                    <span>Push notifications</span>
                  </label>
                  <p>Receive browser push notifications</p>
                </div>

                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.matches}
                      onChange={(e) => handleNotificationChange('matches', e.target.checked)}
                    />
                    <span>Match alerts</span>
                  </label>
                  <p>Get notified when new matches are found</p>
                </div>

                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.reports}
                      onChange={(e) => handleNotificationChange('reports', e.target.checked)}
                    />
                    <span>Report notifications</span>
                  </label>
                  <p>Weekly and monthly reports</p>
                </div>

                <div className="preference-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.notifications.marketing}
                      onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                    />
                    <span>Marketing emails</span>
                  </label>
                  <p>Product updates and promotional content</p>
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div className="preference-section">
              <h3>
                <FiMoon />
                Appearance
              </h3>
              <div className="preference-items">
                <div className="preference-item">
                  <label>Theme</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={preferences.theme === 'dark'}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      />
                      <FiMoon />
                      <span>Dark</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={preferences.theme === 'light'}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                      />
                      <FiSun />
                      <span>Light</span>
                    </label>
                  </div>
                </div>

                <div className="preference-item">
                  <label>
                    <FiLayout />
                    Dashboard Layout
                  </label>
                  <select
                    value={preferences.dashboard_layout}
                    onChange={(e) => handlePreferenceChange('dashboard_layout', e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="expanded">Expanded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language & Region */}
            <div className="preference-section">
              <h3>
                <FiGlobe />
                Language & Region
              </h3>
              <div className="preference-items">
                <div className="preference-item">
                  <label>Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email Frequency */}
            <div className="preference-section">
              <h3>
                <FiMail />
                Email Frequency
              </h3>
              <div className="preference-items">
                <div className="preference-item">
                  <label>How often would you like to receive summary emails?</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="email_frequency"
                        value="daily"
                        checked={preferences.email_frequency === 'daily'}
                        onChange={(e) => handlePreferenceChange('email_frequency', e.target.value)}
                      />
                      <span>Daily</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="email_frequency"
                        value="weekly"
                        checked={preferences.email_frequency === 'weekly'}
                        onChange={(e) => handlePreferenceChange('email_frequency', e.target.value)}
                      />
                      <span>Weekly</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="email_frequency"
                        value="monthly"
                        checked={preferences.email_frequency === 'monthly'}
                        onChange={(e) => handlePreferenceChange('email_frequency', e.target.value)}
                      />
                      <span>Monthly</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="email_frequency"
                        value="never"
                        checked={preferences.email_frequency === 'never'}
                        onChange={(e) => handlePreferenceChange('email_frequency', e.target.value)}
                      />
                      <span>Never</span>
                    </label>
                  </div>
                </div>
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
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PreferencesModal; 