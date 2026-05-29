import React, { useState, useEffect } from 'react';
import api, { NEARBY_HOSPITALS_TIMEOUT_MS } from '../api/axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPATIBILITY_MAP = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: '',
    units_required: '',
    hospital_name: '',
    hospital_distance_km: ''
  });

  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState(null);
  const [formErrorMessage, setFormErrorMessage] = useState(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [isFindingHospitals, setIsFindingHospitals] = useState(false);
  const [hospitalSearchError, setHospitalSearchError] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospitalIndex, setSelectedHospitalIndex] = useState(null);
  const [overallInventory, setOverallInventory] = useState({});

  // Fulfillment Actions State
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient request?")) {
      return;
    }
    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const response = await api.delete(`/api/requests/${id}`);
      if (response.data && response.data.success) {
        setActionMessage({
          type: 'success',
          text: `Request #${id} deleted successfully.`
        });
        fetchRequests();
      } else {
        throw new Error(response.data.error || "Failed to delete request.");
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message || "Failed to delete request.";
      setActionMessage({
        type: 'error',
        text: `Delete failed: ${backendError}`
      });
    } finally {
      setActionLoadingId(null);
    }
  };

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

  const fetchOverallInventory = async () => {
    try {
      const response = await api.get('/api/inventory');
      if (!response.data?.success) return;
      const totals = {};
      BLOOD_GROUPS.forEach((group) => {
        totals[group] = 0;
      });
      (response.data.data || []).forEach((item) => {
        const group = item.BloodType || item.blood_group;
        if (BLOOD_GROUPS.includes(group)) {
          totals[group] += Number(item.QuantityAvailable || item.units_available || 0);
        }
      });
      setOverallInventory(totals);
    } catch (err) {
      console.error('Failed to fetch overall inventory for compatibility checker:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchOverallInventory();
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
    if (selectedHospitalIndex === null || !nearbyHospitals[selectedHospitalIndex]) {
      setFormErrorMessage('Please select a hospital from nearby availability before submitting.');
      setFormSubmitLoading(false);
      return;
    }

    const qty = parseFloat(formData.units_required);
    if (isNaN(qty) || qty <= 0) {
      setFormErrorMessage('Units required must be a positive number.');
      setFormSubmitLoading(false);
      return;
    }
    const selectedHospital = nearbyHospitals[selectedHospitalIndex];
    const selectedStock = Number(
      (selectedHospital.blood_availability || []).find(
        (item) => item.blood_group === formData.blood_group,
      )?.units_available || 0,
    );
    if (selectedStock < qty) {
      setFormErrorMessage(
        `Selected hospital has only ${selectedStock} units of ${formData.blood_group}. Please choose another hospital or lower units.`,
      );
      setFormSubmitLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/requests', {
        ...formData,
        units_required: qty, // Send as number
        hospital_name: selectedHospital.name,
        hospital_distance_km: selectedHospital.distance_km
      });
      if (response.data && response.data.success) {
        setFormSuccessMessage('Blood request submitted successfully!');
        setFormData({
          patient_name: '',
          blood_group: '',
          units_required: '',
          hospital_name: '',
          hospital_distance_km: ''
        });
        setSelectedHospitalIndex(null);
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

  const searchNearbyHospitals = async () => {
    const trimmedLocation = locationQuery.trim();
    if (!trimmedLocation) {
      setHospitalSearchError('Enter location to fetch nearby hospitals.');
      return;
    }
    if (!formData.blood_group) {
      setHospitalSearchError('Select blood group first to check hospital stock.');
      return;
    }
    setHospitalSearchError(null);
    setIsFindingHospitals(true);
    try {
      const response = await api.get('/api/hospitals/nearby', {
        params: { location: trimmedLocation, radius_km: 15, limit: 8 },
        timeout: NEARBY_HOSPITALS_TIMEOUT_MS,
      });
      if (!response.data?.success) {
        throw new Error('Unable to fetch nearby hospitals.');
      }
      setNearbyHospitals(response.data.hospitals || []);
      setSelectedHospitalIndex(null);
    } catch (err) {
      setNearbyHospitals([]);
      setHospitalSearchError(err.response?.data?.error || err.message || 'Unable to fetch nearby hospitals.');
    } finally {
      setIsFindingHospitals(false);
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

  const selectedHospital =
    selectedHospitalIndex !== null ? nearbyHospitals[selectedHospitalIndex] : null;
  const selectedHospitalStock = {};
  BLOOD_GROUPS.forEach((group) => {
    selectedHospitalStock[group] = 0;
  });
  (selectedHospital?.blood_availability || []).forEach((item) => {
    if (BLOOD_GROUPS.includes(item.blood_group)) {
      selectedHospitalStock[item.blood_group] = Number(item.units_available || 0);
    }
  });
  const inventoryForCompatibility = selectedHospital ? selectedHospitalStock : overallInventory;
  const compatibleGroups = formData.blood_group
    ? (COMPATIBILITY_MAP[formData.blood_group] || [])
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="bb-page-title">Requests</h1>
        <p className="bb-page-subtitle">Record inpatient transfusion requirements and manage pending blood allocations.</p>
      </div>

      {/* Top Section: Form Card */}
      <div className="bb-card overflow-hidden">
        <div className="px-6 py-5 border-b border-app-border bg-slate-50/75">
          <h2 className="bb-card-title flex items-center gap-2">
            <span className="text-accent">🩸</span> Submit Blood Request
          </h2>
        </div>
        <div className="p-6">
          {formSuccessMessage && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {formSuccessMessage}
            </div>
          )}

          {formErrorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {formErrorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="patient_name" className="bb-label">Patient Name *</label>
              <input
                type="text"
                id="patient_name"
                name="patient_name"
                required
                placeholder="e.g. Suresh Rao"
                value={formData.patient_name}
                onChange={handleInputChange}
                className="bb-input"
              />
            </div>

            <div>
              <label htmlFor="blood_group" className="bb-label">Blood Group Required *</label>
              <select
                id="blood_group"
                name="blood_group"
                required
                value={formData.blood_group}
                onChange={handleInputChange}
                className="bb-input"
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="units_required" className="bb-label">Units Required *</label>
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
                className="bb-input bb-mono"
              />
            </div>

            <div className="md:col-span-3 border border-app-border rounded-xl p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">Blood Compatibility Checker</h3>
              {!selectedHospital ? (
                <p className="text-sm text-text-muted">
                  First choose a hospital from the list below to view compatibility based on its stock.
                </p>
              ) : !formData.blood_group ? (
                <p className="text-sm text-text-muted">
                  After selecting a hospital, choose a patient blood group to view compatible donor groups and stock.
                </p>
              ) : (
                <>
                  <p className="text-sm text-text-muted">
                    Compatible donor groups for <span className="font-bold">{formData.blood_group}</span>
                    <span className="text-text-muted"> (from selected hospital stock)</span>:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {compatibleGroups.map((group) => {
                      const units = Number(inventoryForCompatibility[group] || 0);
                      const available = units > 0;
                      return (
                        <div
                          key={`compatibility-${group}`}
                          className={`rounded-2xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${
                            available
                              ? 'bg-emerald-50 border-emerald-200 text-[#059669]'
                              : 'bg-red-50 border-red-200 text-[#dc2626]'
                          }`}
                        >
                          <p className="text-sm font-extrabold text-text-primary">{group}</p>
                          <p className={`text-xs mt-1 font-bold font-mono ${available ? 'text-status-green' : 'text-status-red'}`}>
                            {units.toFixed(2)} units {available ? 'available' : 'unavailable'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="md:col-span-3 border border-app-border rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">Choose Hospital by Availability</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Enter patient location (e.g. Indiranagar, Bengaluru)"
                  className="bb-input flex-1"
                />
                <button
                  type="button"
                  onClick={searchNearbyHospitals}
                  disabled={isFindingHospitals}
                  className="px-4 py-2.5 bg-white border border-app-border text-text-primary text-sm font-semibold rounded-xl hover:bg-app-hover disabled:opacity-50 active:scale-[0.98] transition-colors duration-150 shadow-sm"
                >
                  {isFindingHospitals ? 'Checking...' : 'Check Hospitals'}
                </button>
              </div>

              {hospitalSearchError && (
                <p className="text-sm text-status-red bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.25)] rounded-lg px-3 py-2">
                  {hospitalSearchError}
                </p>
              )}

              {!hospitalSearchError && nearbyHospitals.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {nearbyHospitals.map((hospital, idx) => {
                    const bloodStock = Number(
                      (hospital.blood_availability || []).find(
                        (item) => item.blood_group === formData.blood_group,
                      )?.units_available || 0,
                    );
                    const enough = bloodStock >= Number(formData.units_required || 0);
                    return (
                      <button
                        key={`${hospital.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedHospitalIndex(idx);
                          setFormData((prev) => ({
                            ...prev,
                            hospital_name: hospital.name,
                            hospital_distance_km: hospital.distance_km,
                          }));
                        }}
                        className={`text-left rounded-2xl border p-3 transition-all duration-300 shadow-sm ${
                          selectedHospitalIndex === idx
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-200 scale-[1.01]'
                            : 'border-app-border bg-white hover:bg-app-hover hover:border-red-100'
                        }`}
                      >
                        <p className="text-sm font-semibold text-text-primary">{hospital.name}</p>
                        <p className="text-xs text-text-muted mt-0.5 bb-mono">{hospital.distance_km} km away</p>
                        <p className={`mt-2 text-xs font-semibold ${enough ? 'text-status-green' : 'text-status-red'}`}>
                          {formData.blood_group || 'Select blood group'} stock: {bloodStock} units
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={formSubmitLoading}
                className="bb-button-primary px-6 disabled:opacity-50 flex items-center gap-2 shadow-sm"
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
      <div className="bb-card overflow-hidden">
        <div className="px-6 py-5 border-b border-app-border flex items-center justify-between bg-slate-50/75">
          <h2 className="bb-card-title">Request Ledger</h2>
          <button 
            onClick={fetchRequests} 
            disabled={loading}
            className="group p-2 hover:bg-app-hover border border-app-border rounded-xl text-text-muted hover:text-text-primary transition-colors duration-150 shadow-sm flex items-center justify-center disabled:opacity-50 active:scale-[0.98] bg-white"
            title="Refresh List"
          >
            <svg className={`w-4 h-4 transition-transform duration-500 ease-out group-hover:rotate-180 ${loading ? 'animate-spin text-accent' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div className={`p-4 mx-6 mt-4 rounded-xl text-sm font-semibold flex items-center justify-between border shadow-sm transition-all duration-300 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
              : 'bg-red-50 border-red-250 text-red-800'
          }`}>
            <span>
              {actionMessage.text}
            </span>
            <button 
              onClick={() => setActionMessage(null)} 
              className="text-xs font-bold text-text-muted hover:text-text-primary"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-text-muted">Retrieving patient requests...</span>
          </div>
        )}

        {/* Table Error */}
        {error && !loading && (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button 
              onClick={fetchRequests} 
              className="mt-3 px-4 py-1.5 bg-white border border-app-border text-text-muted hover:text-text-primary text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Reload Table
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 border border-app-border text-text-muted rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">No Requests Submitted</h3>
              <p className="text-xs text-text-muted mt-1">There are currently no active blood requests inside the database.</p>
            </div>
          </div>
        )}

        {/* Grid/Table content */}
        {!loading && !error && requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-app-border">
                  <th className="px-8 py-5 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Patient Name</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Blood Group</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Units</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Hospital</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Status</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Requested At</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {requests.map((row, idx) => {
                  const id = row.RequestID || row.id || idx;
                  const isPending = String(row.status).toLowerCase() === 'pending';

                  return (
                    <tr key={id} className="hover:bg-[#fafafa] transition-colors border-b border-[#f1f5f9]">
                      <td className="px-8 py-5 text-sm font-bold text-text-primary">{row.patient_name}</td>
                      <td className="px-8 py-5 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 border border-red-150 text-red-700 shadow-sm">
                          {row.blood_group}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-semibold text-text-primary">
                        {parseFloat(row.units_required || 0).toFixed(1)}
                      </td>
                      <td className="px-8 py-5 text-sm text-text-muted font-medium">
                        {row.hospital_name || <span className="text-text-muted/65 italic">Not captured</span>}
                      </td>
                      <td className="px-8 py-5 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm ${getStatusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-text-muted font-medium">
                        {formatRequestedDate(row)}
                      </td>
                      <td className="px-8 py-5 text-sm text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {isPending && (
                            <button
                              onClick={() => handleFulfill(id)}
                              disabled={actionLoadingId !== null}
                              className="px-3.5 py-1.5 bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm active:scale-95"
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
                            <span className="text-xs text-text-muted italic font-semibold px-2.5 py-1.5 bg-slate-50 border border-app-border rounded-xl shadow-sm">Completed</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(id)}
                            disabled={actionLoadingId !== null}
                            className="p-1.5 border border-rose-200 text-rose-650 hover:text-white hover:bg-rose-650 rounded-lg text-xs transition-all hover:scale-105 flex items-center justify-center disabled:opacity-50 shadow-sm bg-white"
                            title="Delete Request"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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
