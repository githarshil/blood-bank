import React, { useState, useEffect } from 'react';
import api, { NEARBY_HOSPITALS_TIMEOUT_MS } from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function Donors() {
  const { addNotification } = useNotification();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    blood_group: '',
    phone: '',
    email: '',
    address: '',
    hospital_name: '',
    hospital_distance_km: ''
  });
  
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [loggingDonationId, setLoggingDonationId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [isFindingHospitals, setIsFindingHospitals] = useState(false);
  const [hospitalSearchError, setHospitalSearchError] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospitalIndex, setSelectedHospitalIndex] = useState(null);

  const deleteDonor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this donor? This will also remove their entire donation history.")) {
      return;
    }
    setDeleteLoadingId(id);
    try {
      const response = await api.delete(`/api/donors/${id}`);
      if (response.data && response.data.success) {
        addNotification("Donor and associated history deleted successfully.", "success");
        fetchDonors();
      } else {
        throw new Error(response.data.error || "Failed to delete donor");
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message || "Failed to delete donor.";
      addNotification(backendError, "error");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const fetchDonors = async () => {
    setIsRefreshing(true);
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/donors');
      if (response.data && response.data.success) {
        setDonors(response.data.data || []);
      } else {
        throw new Error('Failed to retrieve donor records');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while loading donor records.');
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchDonors();
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

    // Simple Client-side validation
    if (!formData.name.trim() || !formData.blood_group || !formData.phone.trim()) {
      addNotification('Name, Blood Group, and Phone fields are required.', 'error');
      setFormSubmitLoading(false);
      return;
    }
    if (selectedHospitalIndex === null || !nearbyHospitals[selectedHospitalIndex]) {
      addNotification('Select a nearby hospital before registering donor.', 'error');
      setFormSubmitLoading(false);
      return;
    }

    try {
      const selectedHospital = nearbyHospitals[selectedHospitalIndex];
      const response = await api.post('/api/donors', {
        ...formData,
        hospital_name: selectedHospital.name,
        hospital_distance_km: selectedHospital.distance_km,
      });
      if (response.data && response.data.success) {
        addNotification('Donor registered successfully!', 'success');
        // Reset form
        setFormData({
          name: '',
          blood_group: '',
          phone: '',
          email: '',
          address: '',
          hospital_name: '',
          hospital_distance_km: ''
        });
        setNearbyHospitals([]);
        setSelectedHospitalIndex(null);
        // Reload donor table
        fetchDonors();
      } else {
        throw new Error(response.data.error || 'Failed to register donor.');
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message || 'Database error registered.';
      addNotification(backendError, 'error');
    } finally {
      setFormSubmitLoading(false);
    }
  };

  const searchNearbyHospitals = async () => {
    const trimmedLocation = formData.address.trim();
    if (!trimmedLocation) {
      setHospitalSearchError('Enter residential address first to check nearby hospitals.');
      return;
    }
    if (!formData.blood_group) {
      setHospitalSearchError('Select blood group first to evaluate hospital stock.');
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

  const logDonation = async (donor) => {
    const donorId = donor.donor_id || donor.DonorID;
    setLoggingDonationId(donorId);
    try {
      const response = await api.post('/api/donations', {
        donor_id: donorId,
        blood_group: donor.blood_group,
        units: 1
      });
      if (response.data?.success) {
        addNotification(`Donation logged for ${donor.name}. Check Reports for updated stats.`, 'success');
        window.dispatchEvent(new CustomEvent('donation-logged', { detail: { donor } }));
        fetchDonors();
      } else {
        throw new Error(response.data?.error || 'Failed to log donation');
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to log donation';
      const errorType = err.response?.data?.error?.includes('already donated') ? 'warning' : 'error';
      addNotification(errorMsg, errorType);
    } finally {
      setLoggingDonationId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-slate-400 italic">Never Donated</span>;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="bb-page-title">Donors</h1>
        <p className="bb-page-subtitle">Manage blood donors, record registrations, and track donation histories.</p>
      </div>

      {/* Top Section: Form Card */}
      <div className="bb-card overflow-hidden animate-smooth-fade-in">
        <div className="px-6 py-5 border-b border-app-border bg-slate-50/75">
          <h2 className="bb-card-title flex items-center gap-2">
            <span className="text-accent">🩸</span> Register New Donor
          </h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="bb-label">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. Rajesh Kumar"
                value={formData.name}
                onChange={handleInputChange}
                className="bb-input"
              />
            </div>

            <div>
              <label htmlFor="blood_group" className="bb-label">Blood Group *</label>
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
              <label htmlFor="phone" className="bb-label">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                className="bb-input bb-mono"
              />
            </div>

            <div>
              <label htmlFor="email" className="bb-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="e.g. rajesh@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="bb-input"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="bb-label">Residential Address</label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="e.g. 123 Main Street, Delhi"
                value={formData.address}
                onChange={handleInputChange}
                className="bb-input"
              />
            </div>

            <div className="md:col-span-2 border border-app-border rounded-xl p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">Select Nearest Hospital</h3>
              <button
                type="button"
                onClick={searchNearbyHospitals}
                disabled={isFindingHospitals}
                className="px-4 py-2.5 bg-white border border-app-border text-text-primary text-sm font-semibold rounded-xl hover:bg-app-hover disabled:opacity-50 active:scale-[0.98] transition-colors duration-150 shadow-sm"
              >
                {isFindingHospitals ? 'Checking...' : 'Check Nearby Hospitals'}
              </button>

              {hospitalSearchError && (
                <p className="text-sm text-status-red bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.25)] rounded-lg px-3 py-2">
                  {hospitalSearchError}
                </p>
              )}

              {!hospitalSearchError && nearbyHospitals.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {nearbyHospitals.map((hospital, idx) => {
                    const donorGroupStock = Number(
                      (hospital.blood_availability || []).find(
                        (item) => item.blood_group === formData.blood_group,
                      )?.units_available || 0,
                    );
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
                        className={`text-left rounded-2xl border p-3 transition-all duration-350 shadow-sm ${
                          selectedHospitalIndex === idx
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-200 scale-[1.01]'
                            : 'border-app-border bg-white hover:bg-app-hover hover:border-red-100'
                        }`}
                      >
                        <p className="text-sm font-semibold text-text-primary">{hospital.name}</p>
                        <p className="text-xs text-text-muted mt-0.5 bb-mono">{hospital.distance_km} km away</p>
                        <p className="mt-2 text-xs font-semibold text-text-muted">
                          {formData.blood_group || 'Selected blood group'} stock: {donorGroupStock} units
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={formSubmitLoading}
                className="bb-button-primary px-6 disabled:opacity-50 flex items-center gap-2"
              >
                {formSubmitLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  'Register Donor'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Section: Table of Donors */}
      <div className="bb-card overflow-hidden animate-smooth-fade-in">
        <div className="px-6 py-5 border-b border-app-border flex items-center justify-between bg-slate-50/75">
          <h2 className="bb-card-title">Registered Donors</h2>
          <button 
            onClick={fetchDonors}
            disabled={isRefreshing}
            className="group p-2 hover:bg-app-hover border border-app-border rounded-xl text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center justify-center disabled:opacity-50 active:scale-[0.98] bg-white shadow-sm"
            title="Refresh List"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-500 ease-out group-hover:rotate-180 ${isRefreshing ? 'animate-spin text-accent' : ''}`} 
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

        {/* Loading / Spinner */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-text-muted">Retrieving donor ledger...</span>
          </div>
        )}

        {/* Table Error */}
        {error && !loading && (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button 
              onClick={fetchDonors} 
              className="mt-3 px-4 py-1.5 bg-white border border-app-border text-text-muted hover:text-text-primary text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Reload Table
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && donors.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 animate-smooth-fade-in">
            <div className="w-12 h-12 bg-slate-50 border border-app-border text-text-muted rounded-full flex items-center justify-center transition-smooth hover:scale-110">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">No Donors Registered</h3>
              <p className="text-xs text-text-muted mt-1">There are currently no records inside the database.</p>
            </div>
          </div>
        )}

        {/* Grid / Table Content */}
        {!loading && !error && donors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-app-border">
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Blood Group</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Hospital</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Phone</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Last Donation</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {donors.map((donor, idx) => (
                  <tr 
                    key={donor.donor_id || donor.DonorID || idx} 
                    className="hover:bg-[#fafafa] transition-colors border-b border-[#f1f5f9]"
                    style={{
                      animation: `smooth-fade-in 0.3s ease-out ${idx * 30}ms both`
                    }}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-text-primary">{donor.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 border border-red-150 text-red-700 transition-smooth hover:scale-105 shadow-sm">
                        {donor.blood_group}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">
                      {donor.hospital_name || <span className="text-text-muted/65 italic">Not selected</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">{donor.phone}</td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">
                      {donor.email || <span className="text-text-muted/65 italic">None</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted font-medium">
                      {formatDate(donor.last_donation_date)}
                    </td>
                     <td className="px-6 py-4 text-sm flex items-center gap-2">
                       <button
                         type="button"
                         onClick={() => logDonation(donor)}
                         disabled={loggingDonationId === (donor.donor_id || donor.DonorID) || deleteLoadingId === (donor.donor_id || donor.DonorID)}
                         className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-xl hover:bg-accent-hover disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                       >
                         {loggingDonationId === (donor.donor_id || donor.DonorID) ? 'Logging...' : 'Log Donation'}
                       </button>
                       <button
                         type="button"
                         onClick={() => deleteDonor(donor.donor_id || donor.DonorID)}
                         disabled={loggingDonationId === (donor.donor_id || donor.DonorID) || deleteLoadingId === (donor.donor_id || donor.DonorID)}
                         className="p-1.5 border border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg text-xs transition-all hover:scale-105 flex items-center justify-center disabled:opacity-50 shadow-sm bg-white"
                         title="Delete Donor"
                       >
                         {deleteLoadingId === (donor.donor_id || donor.DonorID) ? (
                           <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                         ) : (
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         )}
                       </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Donors;
