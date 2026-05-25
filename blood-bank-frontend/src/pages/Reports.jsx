import React, { useState } from 'react';
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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Generate aggregated monthly audit summaries of all blood donations collected.</p>
      </div>

      {/* Top Section: Monthly Parameters Selection Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <form onSubmit={generateReport} className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 w-full">
            <label htmlFor="month" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Select Month</label>
            <select
              id="month"
              name="month"
              value={filter.month}
              onChange={handleInputChange}
              className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all text-slate-700 font-medium"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label htmlFor="year" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Select Year</label>
            <input
              type="number"
              id="year"
              name="year"
              min="2000"
              max="2100"
              required
              value={filter.year}
              onChange={handleInputChange}
              className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap h-[42px]"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </form>
      </div>

      {/* KPI Cards — shown after a successful report request (including zero-donation months) */}
      {!loading && !error && searched && summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-xl flex-shrink-0">🩸</div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Total Blood Collected</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {parseFloat(summaryData.totalBloodCollected || 0).toFixed(2)} L
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl flex-shrink-0">👥</div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Unique Donors</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {summaryData.uniqueDonors || 0}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl flex-shrink-0">✓</div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Test Pass Rate</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {summaryData.testPassRate || '100%'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">
            Monthly Donation Summary — {MONTHS.find(m => m.value === filter.month)?.name} {filter.year}
          </h2>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-red-700/20 border-t-red-700 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-500">Compiling monthly report ledger...</span>
          </div>
        )}

        {/* Error Block */}
        {error && !loading && (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && searched && reportData.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2m6-12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Donations Logged</h3>
              <p className="text-xs text-slate-500 mt-1">
                No donations were logged for {MONTHS.find(m => m.value === filter.month)?.name} {filter.year}.
                Log a donation for a donor to populate this report.
              </p>
            </div>
          </div>
        )}

        {/* Report Table */}
        {!loading && !error && reportData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Blood Group</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Total Donations</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Total Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => {
                  const bloodGroup = row.blood_group || row.bloodType;
                  const donations = row.total_donations || row.totalDonations || 0;
                  const units = row.total_units || row.totalQuantityCollected || row.TotalQuantityCollected || 0;

                  return (
                    <tr key={bloodGroup || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-850">
                          {bloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{donations}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
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
