import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const MONTHS = [
  { value: 1, name: 'January' },
  { value: 2, name: 'February' },
  { value: 3, name: 'March' },
  { value: 4, name: 'April' },
  { value: 5, name: 'May' },
  { value: 6, name: 'June' },
  { value: 7, name: 'July' },
  { value: 8, name: 'August' },
  { value: 9, name: 'September' },
  { value: 10, name: 'October' },
  { value: 11, name: 'November' },
  { value: 12, name: 'December' }
];

function Reports() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Filters State
  const [filter, setFilter] = useState({
    month: currentMonth,
    year: currentYear
  });

  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Auto-fetch report on initial page mount for instant data presentation
  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : ''
    }));
  };

  const generateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const response = await api.get('/api/reports/monthly', {
        params: {
          month: filter.month,
          year: filter.year
        }
      });

      if (response.data && response.data.success) {
        setReportData(response.data.detailedReport || []);
        setSummaryData(response.data.summary || null);
      } else {
        throw new Error('Failed to retrieve monthly report stats');
      }
    } catch (err) {
      console.error(err);
      const apiError = err.response?.data?.error || err.response?.data?.details;
      const isTimeout = err.code === 'ECONNABORTED';
      setError(
        isTimeout
          ? 'Request timed out. Make sure the backend server is running on port 3001.'
          : apiError || err.message || 'Error occurred while loading report statistics.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="bb-page-title">Reports</h1>
        <p className="bb-page-subtitle">Generate aggregated monthly audit summaries of all blood donations collected.</p>
      </div>

      {/* Top Section: Monthly Parameters Selection Card */}
      <div className="bb-card p-6 relative overflow-hidden">
        {/* Subtle sliding refresh indicator line along the top of the card */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[rgba(220,38,38,0.18)] overflow-hidden">
            <div className="h-full bg-accent rounded-full animate-pulse w-full" />
          </div>
        )}

        <form onSubmit={generateReport} className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 w-full">
            <label htmlFor="month" className="bb-label">Select Month</label>
            <select
              id="month"
              name="month"
              value={filter.month}
              onChange={handleInputChange}
              className="bb-input font-medium"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label htmlFor="year" className="bb-label">Select Year</label>
            <input
              type="number"
              id="year"
              name="year"
              min="2000"
              max="2100"
              required
              value={filter.year}
              onChange={handleInputChange}
              className="bb-input font-medium bb-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bb-button-primary group w-full md:w-auto px-6 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap h-[42px]"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 transition-transform duration-500 ease-out group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>Generate Report</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* KPI Cards Skeletons (Shown only on initial load when there is no data yet) */}
      {loading && !summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-smooth-slide-up">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bb-card p-6 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards — shown after a successful report request */}
      {!error && searched && summaryData && (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 animate-smooth-slide-up transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bb-card p-6 flex items-center gap-4 cursor-default">
            <div className="w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">🩸</div>
            <div>
              <span className="block text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Total Blood Collected</span>
              <span className="text-2xl font-black text-text-primary mt-1 block">
                {parseFloat(summaryData.totalBloodCollected || 0).toFixed(2)} L
              </span>
            </div>
          </div>

          <div className="bb-card p-6 flex items-center gap-4 cursor-default">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">👥</div>
            <div>
              <span className="block text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Unique Donors</span>
              <span className="text-2xl font-black text-text-primary mt-1 block">
                {summaryData.uniqueDonors || 0}
              </span>
            </div>
          </div>

          <div className="bb-card p-6 flex items-center gap-4 cursor-default">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-650 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">✓</div>
            <div>
              <span className="block text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Test Pass Rate</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {summaryData.testPassRate || '100%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className={`bb-card overflow-hidden transition-opacity duration-300 ${loading && reportData.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="px-6 py-5 border-b border-app-border bg-slate-50/75 flex justify-between items-center">
          <h2 className="text-sm font-bold text-text-primary">
            Monthly Donation Summary — {MONTHS.find(m => m.value === filter.month)?.name} {filter.year}
          </h2>
          {loading && reportData.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 animate-pulse border border-red-100">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              Refreshing...
            </span>
          )}
        </div>

        {/* Initial Loading Skeletons */}
        {loading && reportData.length === 0 && (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-150 rounded w-1/4 mb-6" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6 items-center py-3 border-b border-slate-50">
                <div className="h-5 bg-slate-100 rounded flex-1" />
                <div className="h-5 bg-slate-100 rounded flex-1" />
                <div className="h-5 bg-slate-200 rounded flex-1" />
              </div>
            ))}
          </div>
        )}

        {/* Error Block */}
        {error && !loading && (
          <div className="p-8 text-center animate-smooth-fade-in">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && searched && reportData.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 animate-smooth-slide-up">
            <div className="w-12 h-12 bg-slate-50 border border-app-border text-text-muted rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2m6-12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">No Donations Logged</h3>
              <p className="text-xs text-text-muted mt-1">
                No donations were logged for {MONTHS.find(m => m.value === filter.month)?.name} {filter.year}.
                Log a donation to populate this report.
              </p>
            </div>
          </div>
        )}

        {/* Report Table */}
        {!error && reportData.length > 0 && (
          <div className="overflow-x-auto animate-smooth-slide-up">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-app-border">
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Blood Group</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Total Donations</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Total Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {reportData.map((row, idx) => {
                  const bloodGroup = row.blood_group || row.bloodType;
                  const donations = row.total_donations || row.totalDonations || 0;
                  const units = row.total_units || row.totalQuantityCollected || row.TotalQuantityCollected || 0;

                  return (
                    <tr key={bloodGroup || idx} className="hover:bg-[#fafafa] transition-colors border-b border-[#f1f5f9]">
                      <td className="px-6 py-4 text-sm font-bold text-text-primary">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 border border-red-150 text-red-700 shadow-sm">
                          {bloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text-muted">{donations}</td>
                      <td className="px-6 py-4 text-sm font-bold text-text-primary">
                        {parseFloat(units).toFixed(2)} Units
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
