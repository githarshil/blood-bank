import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function Dashboard() {
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/inventory');
      
      if (response.data && response.data.success) {
        // Group and sum up the quantities by blood group
        const totals = {};
        BLOOD_GROUPS.forEach(g => {
          totals[g] = 0;
        });

        const items = response.data.data || [];
        items.forEach(item => {
          const type = item.BloodType;
          if (BLOOD_GROUPS.includes(type)) {
            totals[type] += parseFloat(item.QuantityAvailable || 0);
          }
        });

        setInventory(totals);
      } else {
        throw new Error('Failed to retrieve inventory data');
      }
    } catch (err) {
      console.error(err);
      let message = err.message || 'Something went wrong while connecting to the API server.';
      if (err.code === 'ERR_NETWORK') {
        message =
          'Network Error — open /api/health and /api/inventory in the browser. If health shows dbConnected:false, add DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME=railway on Vercel and redeploy.';
      } else if (err.code === 'ECONNABORTED') {
        message = 'Request timed out — API or database may be slow to wake up. Try again.';
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Card color picker logic based on requirements
  const getCardStyle = (units) => {
    if (units > 10) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        badge: 'bg-emerald-200 text-emerald-950',
        status: 'Safe Stock',
        indicator: 'bg-emerald-500'
      };
    } else if (units >= 4 && units <= 9.99) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        badge: 'bg-amber-200 text-amber-950',
        status: 'Low Stock',
        indicator: 'bg-amber-500'
      };
    } else {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
        badge: 'bg-rose-200 text-rose-950',
        status: 'Critical Stock',
        indicator: 'bg-rose-500'
      };
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Real-time blood stock levels in the main cold storage repository.</p>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {BLOOD_GROUPS.map((g, idx) => (
            <div key={idx} className="h-44 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between animate-pulse">
              <div className="flex justify-between items-center">
                <div className="w-12 h-6 bg-slate-200 rounded"></div>
                <div className="w-20 h-5 bg-slate-200 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-8 bg-slate-200 rounded"></div>
                <div className="w-28 h-4 bg-slate-200 rounded"></div>
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
            onClick={fetchInventory} 
            className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-xl hover:bg-red-800 transition-colors shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Stock Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {BLOOD_GROUPS.map((group) => {
            const units = inventory[group] || 0;
            const style = getCardStyle(units);

            return (
              <div 
                key={group} 
                className={`group border rounded-2xl p-6 flex flex-col justify-between h-44 shadow-sm transition-all duration-300 hover:shadow-md ${style.bg}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-3xl font-extrabold tracking-tight">{group}</span>
                  <span className={`text-xs px-2.5 py-1 font-semibold rounded-full ${style.badge}`}>
                    {style.status}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {units.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold opacity-80">Units</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs opacity-75">
                    <span className={`w-2 h-2 rounded-full ${style.indicator}`}></span>
                    <span>1 Unit = 450ml Bag</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Color Legend */}
      {!loading && !error && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Inventory Threshold Legend</h3>
          <p className="text-xs text-slate-500 mt-1">Status colors represent critical levels mapped to blood reserves.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="flex items-start gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Safe Stock (&gt; 10 Units)</h4>
                <p className="text-xs text-emerald-700 mt-0.5">Sufficient volume of blood units; adequate for standard requests.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-amber-500 flex-shrink-0"></span>
              <div>
                <h4 className="text-xs font-bold text-amber-950">Low Stock (4 - 9 Units)</h4>
                <p className="text-xs text-amber-700 mt-0.5">Diminished stock. Keep track of incoming donations for this type.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-rose-500 flex-shrink-0"></span>
              <div>
                <h4 className="text-xs font-bold text-rose-950">Critical Stock (&lt; 4 Units)</h4>
                <p className="text-xs text-rose-700 mt-0.5">Dangerously low volume. Triggers system-wide alerts immediately.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
