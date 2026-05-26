import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function Dashboard() {
  const [inventory, setInventory] = useState({});
  const [donorCounts, setDonorCounts] = useState({});
  const [donorCount, setDonorCount] = useState(0);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingHint, setLoadingHint] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInventory = async () => {
    const hintTimer = setTimeout(() => {
      setLoadingHint('Connecting to local MySQL database...');
    }, 4000);

    setIsRefreshing(true);
    try {
      setLoading(true);
      setLoadingHint('');
      setError(null);

      // Perform parallel fetches in a Promise.all block for extremely responsive load times
      const [invRes, donorsRes, requestsRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/donors'),
        api.get('/api/requests')
      ]);
      
      if (invRes.data && invRes.data.success) {
        // Group and sum up the quantities by blood group
        const totals = {};
        BLOOD_GROUPS.forEach(g => {
          totals[g] = 0;
        });

        const items = invRes.data.data || [];
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

      if (donorsRes.data && donorsRes.data.success) {
        const counts = {};
        BLOOD_GROUPS.forEach(g => {
          counts[g] = 0;
        });
        const list = donorsRes.data.data || [];
        list.forEach(donor => {
          const group = donor.blood_group || donor.BloodType;
          if (BLOOD_GROUPS.includes(group)) {
            counts[group]++;
          }
        });
        setDonorCounts(counts);
        setDonorCount(list.length);
      }

      if (requestsRes.data && requestsRes.data.success) {
        const list = requestsRes.data.data || [];
        const pending = list.filter(r => String(r.status).toLowerCase() === 'pending').length;
        setActiveRequestsCount(pending);
      }
    } catch (err) {
      console.error(err);
      let message = err.message || 'Something went wrong while connecting to the API server.';
      if (err.code === 'ERR_NETWORK') {
        message =
          'Network Error — Make sure your backend server is running at http://localhost:3001 and your local MySQL server is started.';
      } else if (err.code === 'ECONNABORTED') {
        message = 'Request timed out — API or database may be slow to wake up. Try again.';
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      }
      setError(message);
    } finally {
      clearTimeout(hintTimer);
      setLoading(false);
      setLoadingHint('');
      setTimeout(() => setIsRefreshing(false), 600);
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
      {/* Page Header with circular refresh button matching other pages */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Real-time blood stock levels in the main cold storage repository.</p>
        </div>
        <button 
          onClick={fetchInventory}
          disabled={isRefreshing || loading}
          className="group p-2 hover:bg-slate-150 active:bg-slate-200/70 border border-slate-100 hover:border-slate-200/80 rounded-xl text-slate-500 hover:text-red-755 transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
          title="Refresh Dashboard"
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-500 ease-out group-hover:rotate-180 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* Top KPI Summary Row showing the total registered donor count */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-smooth-slide-up">
          {/* Total Blood Stock */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">🩸</div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Total Blood Stock</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {Object.values(inventory).reduce((a, b) => a + b, 0).toFixed(2)} Units
              </span>
            </div>
          </div>

          {/* Registered Donors Count */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">👥</div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Registered Donors</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {donorCount}
              </span>
            </div>
          </div>

          {/* Active Blood Requests */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">📋</div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Active Requests</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {activeRequestsCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {loadingHint && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              {loadingHint}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {BLOOD_GROUPS.map((g, idx) => (
              <div key={idx} className="h-48 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-6 bg-slate-200 rounded"></div>
                  <div className="w-20 h-5 bg-slate-200 rounded-full"></div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Main Stock & Active Donors Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {BLOOD_GROUPS.map((group, idx) => {
            const units = inventory[group] || 0;
            const style = getCardStyle(units);
            const donorsForGroup = donorCounts[group] || 0;

            return (
              <div 
                key={group}
                style={{
                  animation: `smooth-slide-up 0.5s ease-out ${idx * 50}ms both`
                }}
                className={`group border rounded-2xl p-6 flex flex-col justify-between h-48 shadow-sm hover:shadow-lg transition-smooth hover:scale-105 cursor-default ${style.bg}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-3xl font-extrabold tracking-tight">{group}</span>
                  <span className={`text-xs px-2.5 py-1 font-semibold rounded-full transition-smooth ${style.badge}`}>
                    {style.status}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4">
                  {/* Blood stock units */}
                  <div className="flex justify-between items-baseline border-b border-slate-200/40 pb-2">
                    <span className="text-xs font-bold opacity-75 uppercase tracking-wide">Stock</span>
                    <span className="text-2xl font-black tracking-tight">
                      {units.toFixed(2)} <span className="text-xs font-semibold opacity-85">Units</span>
                    </span>
                  </div>

                  {/* Registered donor count for this blood group */}
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-bold opacity-75 uppercase tracking-wide">Donors</span>
                    <span className="text-xl font-bold tracking-tight">
                      {donorsForGroup} <span className="text-xs font-semibold opacity-85">Registered</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Color Legend */}
      {!loading && !error && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-smooth-fade-in">
          <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Inventory Threshold Legend</h3>
          <p className="text-xs text-slate-500 mt-1">Status colors represent critical levels mapped to blood reserves.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="flex items-start gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl transition-smooth hover:shadow-md hover:border-emerald-200">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-emerald-500 flex-shrink-0 transition-smooth group-hover:scale-125"></span>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Safe Stock (&gt; 10 Units)</h4>
                <p className="text-xs text-emerald-700 mt-0.5">Sufficient volume of blood units; adequate for standard requests.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl transition-smooth hover:shadow-md hover:border-amber-200">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-amber-500 flex-shrink-0 transition-smooth group-hover:scale-125"></span>
              <div>
                <h4 className="text-xs font-bold text-amber-950">Low Stock (4 - 9 Units)</h4>
                <p className="text-xs text-amber-700 mt-0.5">Diminished stock. Keep track of incoming donations for this type.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl transition-smooth hover:shadow-md hover:border-rose-200">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-rose-500 flex-shrink-0 transition-smooth group-hover:scale-125"></span>
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
