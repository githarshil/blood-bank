import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function Donors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    blood_group: '',
    phone: '',
    email: '',
    address: ''
  });
  
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState(null);
  const [formErrorMessage, setFormErrorMessage] = useState(null);
  const [loggingDonationId, setLoggingDonationId] = useState(null);

  const fetchDonors = async () => {
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
    setFormSuccessMessage(null);
    setFormErrorMessage(null);

    // Simple Client-side validation
    if (!formData.name.trim() || !formData.blood_group || !formData.phone.trim()) {
      setFormErrorMessage('Name, Blood Group, and Phone fields are required.');
      setFormSubmitLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/donors', formData);
      if (response.data && response.data.success) {
        setFormSuccessMessage('Donor registered successfully!');
        // Reset form
        setFormData({
          name: '',
          blood_group: '',
          phone: '',
          email: '',
          address: ''
        });
        // Reload donor table
        fetchDonors();
      } else {
        throw new Error(response.data.error || 'Failed to register donor.');
      }
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message || 'Database error registered.';
      setFormErrorMessage(backendError);
    } finally {
      setFormSubmitLoading(false);
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
        setFormSuccessMessage(`Donation logged for ${donor.name}. Check Reports for updated stats.`);
        fetchDonors();
      } else {
        throw new Error(response.data?.error || 'Failed to log donation');
      }
    } catch (err) {
      console.error(err);
      setFormErrorMessage(err.response?.data?.error || err.message || 'Failed to log donation');
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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Donors</h1>
        <p className="mt-2 text-sm text-slate-500">Manage blood donors, record registrations, and track donation histories.</p>
      </div>

      {/* Top Section: Form Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="text-red-700">🩸</span> Register New Donor
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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. Rajesh Kumar"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="blood_group" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Blood Group *</label>
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
              <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="e.g. rajesh@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Residential Address</label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="e.g. 123 Main Street, Delhi"
                value={formData.address}
                onChange={handleInputChange}
                className="mt-2 block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 focus:bg-white transition-all"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
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
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Registered Donors</h2>
          <button 
            onClick={fetchDonors} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh List"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5"></path>
            </svg>
          </button>
        </div>

        {/* Loading / Spinner */}
        {loading && (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-red-700/20 border-t-red-700 rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-500">Retrieving donor ledger...</span>
          </div>
        )}

        {/* Table Error */}
        {error && !loading && (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button 
              onClick={fetchDonors} 
              className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Reload Table
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && donors.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Donors Registered</h3>
              <p className="text-xs text-slate-500 mt-1">There are currently no records inside the database.</p>
            </div>
          </div>
        )}

        {/* Grid / Table Content */}
        {!loading && !error && donors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Blood Group</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Phone</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Last Donation</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donors.map((donor, idx) => (
                  <tr key={donor.donor_id || donor.DonorID || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{donor.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        {donor.blood_group}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{donor.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {donor.email || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {formatDate(donor.last_donation_date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => logDonation(donor)}
                        disabled={loggingDonationId === (donor.donor_id || donor.DonorID)}
                        className="px-3 py-1.5 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 disabled:opacity-50 transition-colors"
                      >
                        {loggingDonationId === (donor.donor_id || donor.DonorID) ? 'Logging...' : 'Log Donation'}
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
