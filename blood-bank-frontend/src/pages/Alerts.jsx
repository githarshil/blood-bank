import React, { useState, useEffect } from 'react';
import api from '../api/axios';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAlerts = async () => {
    setIsRefreshing(true);
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/alerts');
      if (response.data && response.data.success) {
        setAlerts(response.data.data || []);
      } else {
        throw new Error('Failed to retrieve system alerts');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while loading system alerts.');
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const formatAlertDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAlertCardStyle = (row) => {
    const type = String(row.alert_type || row.AlertType || '').toUpperCase();
    const msg = String(row.message || row.Message || '').toLowerCase();
    
    // Check type or message keyword for classification
    if (type.includes('EXPIRE') || msg.includes('expir')) {
      return {
        cardBg: 'bg-orange-50 border-orange-200 text-orange-950',
        badgeBg: 'bg-orange-200 text-orange-950',
        iconColor: 'text-orange-600',
        title: 'Expired Inventory Warning',
        icon: '⚠️'
      };
    } else {
      // Default to Critical Low Stock
      return {
        cardBg: 'bg-rose-50 border-rose-200 text-rose-950',
        badgeBg: 'bg-rose-200 text-rose-950',
        iconColor: 'text-rose-600',
        title: 'Critical Stock Level',
        icon: '🚨'
      };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="bb-page-title">Alerts</h1>
          <p className="bb-page-subtitle">Live indicators of under-threshold supply and expired batches.</p>
        </div>
        <button 
          onClick={fetchAlerts}
          disabled={isRefreshing}
          className="px-4 py-2.5 rounded-xl border border-app-border bg-white text-text-muted hover:text-text-primary text-sm font-semibold hover:bg-app-hover transition-colors duration-150 flex items-center gap-2 disabled:opacity-60 active:scale-[0.98] shadow-sm"
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-500 ease-out ${isRefreshing ? 'animate-spin text-accent' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {isRefreshing ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bb-card p-6 flex gap-4 animate-pulse">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-slate-150 rounded w-1/4"></div>
                <div className="h-4 bg-slate-150 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Fallback */}
      {error && !loading && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-950">Connection Failure</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button 
            onClick={fetchAlerts} 
            className="px-4 py-2 bg-accent text-white text-sm font-bold rounded-xl hover:bg-[#b91c1c] active:scale-95 transition-all shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && alerts.length === 0 && (
        <div className="bb-card p-12 text-center flex flex-col items-center justify-center space-y-4 animate-smooth-fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl transition-smooth hover:scale-110 shadow-sm">
            ✓
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">System Fully Stable</h3>
            <p className="text-sm text-text-muted mt-1">There are currently no supply shortages or expired inventory alerts.</p>
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      {!loading && !error && alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((row, idx) => {
            const id = row.AlertID || idx;
            const bloodGroup = row.blood_group || row.BloodType;
            const message = row.message || row.Message;
            const timestamp = row.timestamp || row.AlertDate || row.created_at;
            const type = String(row.alert_type || row.AlertType || '').toUpperCase();
            const msg = String(message || '').toLowerCase();
            const isExpiry = type.includes('EXPIRE') || msg.includes('expir');

            return (
              <div 
                key={id}
                style={{
                  animation: `smooth-slide-left 0.5s ease-out ${idx * 50}ms both`
                }}
                className={[
                  'border rounded-xl p-5 flex items-start gap-4 cursor-default shadow-sm transition-all hover:scale-[1.01]',
                  isExpiry
                    ? 'border-l-[3px] border-l-status-amber bg-[#fffbeb] border-amber-100'
                    : 'border-l-[3px] border-l-status-red bg-[#fff5f5] border-red-100',
                ].join(' ')}
              >
                <div className="text-[20px] mt-0.5 flex-shrink-0">
                  {isExpiry ? '⚠️' : '🚨'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <h4 className={`font-bold text-[14px] tracking-tight ${isExpiry ? 'text-amber-800' : 'text-red-800'}`}>
                        {isExpiry ? 'Expiry Alert' : 'Critical Alert'}
                      </h4>
                      {bloodGroup && (
                        <span className="text-xs px-2.5 py-0.5 font-bold rounded-full border border-app-border bg-white text-text-primary shadow-sm">
                          Group {bloodGroup}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-text-muted">
                      {formatAlertDate(timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-[14px] mt-2 leading-relaxed text-text-primary font-medium">
                    {message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Alerts;
