import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: '',
    units_required: ''
  });

  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState(null);
  const [formErrorMessage, setFormErrorMessage] = useState(null);

  // Fulfillment Actions State
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/requests');
      if (response.data && response.data.success) {
        setRequests(response.data.data || []);
      } else {
        throw new Error('Failed to retrieve blood requests');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while loading blood requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitLoading(true);
    setFormSuccessMessage(null);
    setFormErrorMessage(null);

    // Client-side validations
    if (!formData.patient_name.trim() || !formData.blood_group || !formData.units_required) {
      setFormErrorMessage('All fields are required.');
      setFormSubmitLoading(false);
      return;
    }

    const qty = parseFloat(formData.units_required);
    if (isNaN(qty) || qty <= 0) {
      setFormErrorMessage('Units required must be a positive number.');
      setFormSubmitLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/requests', {
        ...formData,
        units_required: qty // Send as number
      });
      if (response.data && response.data.success) {
        setFormSuccessMessage('Blood request submitted successfully!');
        setFormData({
          patient_name: '',
          blood_group: '',
          units_required: ''
        });
        fetchRequests();
      } else {
        throw new Error(response.data.error || 'Failed to submit blood request.');
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message || 'Error submitting request to backend.';
      setFormErrorMessage(backendError);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const handleFulfill = async (id) => {
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const response = await api.post(`/api/requests/fulfill/${id}`);
      if (response.data && response.data.success) {
        setActionMessage({
          type: 'success',
          text: `Request #${id} fulfilled successfully! Stock deducted.`
        });
        fetchRequests();
      } else {
        throw new Error(response.data.error || 'Fulfillment transaction failed.');
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message || 'Stock allocation error.';
      setActionMessage({
        type: 'error',
        text: `Fulfillment failed: ${backendError}`
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    const checkStatus = String(status).toLowerCase();
    if (checkStatus === 'fulfilled') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (checkStatus === 'pending') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (checkStatus === 'rejected') {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    } else {
      return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatRequestedDate = (row) => {
    const rawDate = row.requested_at || row.RequestDate || row.RequestDate || row.created_at;
    if (!rawDate) return <span className="text-slate-400 italic">N/A</span>;
    return new Date(rawDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Requests</h1>
        <p className="mt-2 text-sm text-slate-500">Record inpatient transfusion requirements and manage pending blood allocations.</p>
      </div>

      {/* Top Section: Form Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-red-700">🩸</span> Submit Blood Request
          </h2>
        </div>
        <div className="p-6">
          {formSuccessMessage && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {formSuccessMessage}
            </div>
          )}

          {formErrorMessage && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {formErrorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="patient_name" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Patient Name *</label>
              <input
                type="text"
                id="patient_name"
                name="patient_name"
                required
                placeholder="e.g. Suresh Rao"
                value={formData.patient_name}
                onChange={handleInputChange}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="blood_group" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Blood Group Required *</label>
              <select
                id="blood_group"
                name="blood_group"
                required
                value={formData.blood_group}
                onChange={handleInputChange}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all text-slate-700"
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="units_required" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Units Required *</label>
              <input
                type="number"
                id="units_required"
                name="units_required"
                required
                step="0.1"
                min="0.1"
                placeholder="e.g. 2.0"
                value={formData.units_required}
                onChange={handleInputChange}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all"
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={formSubmitLoading}
                className="px-6 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
              >
                {formSubmitLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Section: Requests Ledger Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Request Ledger</h2>
          <button 
            onClick={fetchRequests} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh List"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"></path>
            </svg>
          </button>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div className="p-4 mx-6 mt-4 rounded-xl text-sm font-semibold flex items-center justify-between border shadow-sm transition-all duration-300 bg-slate-50 border-slate-150">
            <span className={actionMessage.type === 'success' ? 'text-emerald-800' : 'text-rose-800'}>
              {actionMessage.text}
            </span>
            <button 
              onClick={() => setActionMessage(null)} 
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-red-700/20 border-t-red-700 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-500">Retrieving patient requests...</span>
          </div>
        )}

        {/* Table Error */}
        {error && !loading && (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button 
              onClick={fetchRequests} 
              className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Reload Table
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Requests Submitted</h3>
              <p className="text-xs text-slate-500 mt-1">There are currently no active blood requests inside the database.</p>
            </div>
          </div>
        )}

        {/* Grid/Table content */}
        {!loading && !error && requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Blood Group</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Units</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Requested At</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((row, idx) => {
                  const id = row.RequestID || row.id || idx;
                  const isPending = String(row.status).toLowerCase() === 'pending';

                  return (
                    <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.patient_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          {row.blood_group}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {parseFloat(row.units_required || 0).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {formatRequestedDate(row)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {isPending && (
                          <button
                            onClick={() => handleFulfill(id)}
                            disabled={actionLoadingId !== null}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 ml-auto shadow-sm"
                          >
                            {actionLoadingId === id ? (
                              <>
                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Fulfilling...
                              </>
                            ) : (
                              'Fulfill'
                            )}
                          </button>
                        )}
                        {!isPending && (
                          <span className="text-xs text-slate-400 italic font-medium">Completed</span>
                        )}
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

export default Requests;
