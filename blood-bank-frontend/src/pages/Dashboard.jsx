import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import api, { NEARBY_HOSPITALS_TIMEOUT_MS } from '../api/axios';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import ThreeDripChamber from '../components/ThreeDripChamber';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function FitHospitalsBounds({ hospitals, searchCenter }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [];
    if (searchCenter?.latitude != null && searchCenter?.longitude != null) {
      bounds.push([searchCenter.latitude, searchCenter.longitude]);
    }
    (hospitals || [])
      .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude))
      .forEach((h) => bounds.push([h.latitude, h.longitude]));

    if (bounds.length === 0) return;

    if (bounds.length === 1) {
      map.setView(bounds[0], 13, { animate: false });
      return;
    }

    map.fitBounds(bounds, {
      padding: [35, 35],
      animate: false,
    });
  }, [hospitals, searchCenter, map]);

  return null;
}

function Dashboard() {
  const [inventory, setInventory] = useState({});
  const [donorCounts, setDonorCounts] = useState({});
  const [donorCount, setDonorCount] = useState(0);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingHint, setLoadingHint] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationQuery, setLocationQuery] = useState(() => {
    return sessionStorage.getItem('dashboard_locationQuery') || '';
  });
  const [isFindingHospitals, setIsFindingHospitals] = useState(false);
  const [hospitalSearchError, setHospitalSearchError] = useState('');
  const [nearestHospitals, setNearestHospitals] = useState(() => {
    const savedKey = sessionStorage.getItem('dashboard_hospitalsSearchKey') || '';
    const currentKey = sessionStorage.getItem('dashboard_locationQuery') || '';
    if (savedKey !== currentKey) return [];
    const saved = sessionStorage.getItem('dashboard_nearestHospitals');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchCenter, setSearchCenter] = useState(() => {
    const savedKey = sessionStorage.getItem('dashboard_hospitalsSearchKey') || '';
    const currentKey = sessionStorage.getItem('dashboard_locationQuery') || '';
    if (savedKey !== currentKey) return null;
    const saved = sessionStorage.getItem('dashboard_searchCenter');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [resolvedLocationName, setResolvedLocationName] = useState(() => {
    const savedKey = sessionStorage.getItem('dashboard_hospitalsSearchKey') || '';
    const currentKey = sessionStorage.getItem('dashboard_locationQuery') || '';
    if (savedKey !== currentKey) return '';
    return sessionStorage.getItem('dashboard_resolvedLocationName') || '';
  });
  const [selectedHospitalIndex, setSelectedHospitalIndex] = useState(() => {
    const saved = sessionStorage.getItem('dashboard_selectedHospitalIndex');
    return saved !== null ? Number(saved) : null;
  });

  useEffect(() => {
    sessionStorage.setItem('dashboard_locationQuery', locationQuery);
  }, [locationQuery]);

  useEffect(() => {
    sessionStorage.setItem('dashboard_nearestHospitals', JSON.stringify(nearestHospitals));
  }, [nearestHospitals]);

  useEffect(() => {
    if (searchCenter) {
      sessionStorage.setItem('dashboard_searchCenter', JSON.stringify(searchCenter));
    } else {
      sessionStorage.removeItem('dashboard_searchCenter');
    }
  }, [searchCenter]);

  useEffect(() => {
    sessionStorage.setItem('dashboard_resolvedLocationName', resolvedLocationName);
  }, [resolvedLocationName]);

  useEffect(() => {
    if (selectedHospitalIndex !== null) {
      sessionStorage.setItem('dashboard_selectedHospitalIndex', String(selectedHospitalIndex));
    } else {
      sessionStorage.removeItem('dashboard_selectedHospitalIndex');
    }
  }, [selectedHospitalIndex]);
  const hospitalsGridRef = useRef(null);
  const hospitalCardRefs = useRef([]);
  const [activeCardIndicator, setActiveCardIndicator] = useState(null);

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

  const searchNearbyHospitals = async (locationValue) => {
    const trimmedLocation = String(locationValue || '').trim();
    if (!trimmedLocation) {
      setHospitalSearchError('Please enter your location to find nearby hospitals.');
      setNearestHospitals([]);
      return;
    }

    try {
      setIsFindingHospitals(true);
      setHospitalSearchError('');
      setNearestHospitals([]);
      setSearchCenter(null);
      setResolvedLocationName('');

      const response = await api.get('/api/hospitals/nearby', {
        params: {
          location: trimmedLocation,
          radius_km: 15,
          limit: 8
        },
        timeout: NEARBY_HOSPITALS_TIMEOUT_MS
      });

      if (!response.data?.success) {
        throw new Error('Unable to fetch nearest hospitals right now.');
      }

      setNearestHospitals(response.data.hospitals || []);
      setResolvedLocationName(response.data.search?.resolved_name || trimmedLocation);
      if (response.data.search?.latitude != null && response.data.search?.longitude != null) {
        setSearchCenter({
          latitude: Number(response.data.search.latitude),
          longitude: Number(response.data.search.longitude),
        });
      }
      sessionStorage.setItem('dashboard_hospitalsSearchKey', trimmedLocation);
      setSelectedHospitalIndex(null);
    } catch (err) {
      let message = 'Unable to fetch nearby hospitals.';
      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.message) {
        message = err.message;
      }
      setHospitalSearchError(message);
      setNearestHospitals([]);
    } finally {
      setIsFindingHospitals(false);
    }
  };

  const handleLocationSubmit = (event) => {
    event.preventDefault();
    searchNearbyHospitals(locationQuery);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setHospitalSearchError('Geolocation is not supported in this browser.');
      return;
    }

    setHospitalSearchError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const coordsQuery = `${coords.latitude},${coords.longitude}`;
        setLocationQuery(coordsQuery);
        await searchNearbyHospitals(coordsQuery);
      },
      (geoError) => {
        setHospitalSearchError(
          geoError?.message || 'Unable to access your current location.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  // Card color picker logic based on requirements
  const getCardStyle = (units) => {
    if (units > 10) {
      return {
        bg: 'bg-white border-app-border text-text-primary hover:border-emerald-300',
        badge: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
        status: 'Safe Stock',
        color: 'text-emerald-600',
        indicator: 'bg-emerald-500'
      };
    } else if (units >= 4 && units <= 9.99) {
      return {
        bg: 'bg-white border-app-border text-text-primary hover:border-amber-300',
        badge: 'bg-amber-50 border border-amber-100 text-amber-700',
        status: 'Low Stock',
        color: 'text-amber-600',
        indicator: 'bg-amber-500'
      };
    } else {
      return {
        bg: 'bg-white border-app-border text-text-primary hover:border-red-300',
        badge: 'bg-red-50 border border-red-100 text-red-700',
        status: 'Critical Stock',
        color: 'text-red-650',
        indicator: 'bg-red-500'
      };
    }
  };

  const getChipStyle = (units) => {
    if (units > 10) {
      return {
        wrap: 'bg-emerald-50 border-emerald-100 text-[#059669]',
      };
    }
    if (units >= 4) {
      return {
        wrap: 'bg-amber-50 border-amber-100 text-[#d97706]',
      };
    }
    return {
      wrap: 'bg-red-50 border-red-100 text-[#dc2626]',
    };
  };

  const selectedHospital =
    selectedHospitalIndex !== null ? nearestHospitals[selectedHospitalIndex] : null;

  const selectedHospitalInventory = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = 0;
    return acc;
  }, {});

  if (selectedHospital?.blood_availability) {
    selectedHospital.blood_availability.forEach((item) => {
      if (BLOOD_GROUPS.includes(item.blood_group)) {
        selectedHospitalInventory[item.blood_group] = Number(item.units_available || 0);
      }
    });
  }

  const stockInventoryToShow = selectedHospital ? selectedHospitalInventory : inventory;

  const mapCenter = selectedHospital
    ? [selectedHospital.latitude, selectedHospital.longitude]
    : searchCenter
      ? [searchCenter.latitude, searchCenter.longitude]
      : nearestHospitals.length > 0
        ? [nearestHospitals[0].latitude, nearestHospitals[0].longitude]
        : [12.9716, 77.5946];

  useLayoutEffect(() => {
    const grid = hospitalsGridRef.current;
    if (!grid || selectedHospitalIndex === null) {
      setActiveCardIndicator(null);
      return;
    }

    const card = hospitalCardRefs.current[selectedHospitalIndex];
    if (!card) {
      setActiveCardIndicator(null);
      return;
    }

    const updateIndicator = () => {
      const gridRect = grid.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      setActiveCardIndicator({
        x: cardRect.left - gridRect.left,
        y: cardRect.top - gridRect.top,
        width: cardRect.width,
        height: cardRect.height,
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [selectedHospitalIndex, nearestHospitals]);

  useEffect(() => {
    if (selectedHospitalIndex !== null && nearestHospitals[selectedHospitalIndex]) {
      const hospital = nearestHospitals[selectedHospitalIndex];
      let total = 0;
      if (hospital.blood_availability) {
        hospital.blood_availability.forEach((item) => {
          total += Number(item.units_available || 0);
        });
      }
      // Map total stock (0 to 80 units capacity) to cylinder level (15% to 100%)
      const percent = Math.min(Math.max(15, (total / 80) * 100), 100);
      window.dispatchEvent(new CustomEvent('sidebar-hospital-selected', {
        detail: {
          name: hospital.name,
          percent: percent
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('sidebar-hospital-deselected'));
    }
  }, [selectedHospitalIndex, nearestHospitals]);

  return (
    <div className="space-y-8">
      {/* Page Header with circular refresh button matching other pages */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="bb-page-title">Dashboard</h1>
          <p className="bb-page-subtitle">Real-time blood stock levels in the main cold storage repository.</p>
        </div>
        <button 
          onClick={fetchInventory}
          disabled={isRefreshing || loading}
          className="group p-2 hover:bg-app-hover border border-app-border rounded-xl text-text-muted hover:text-text-primary transition-colors duration-150 flex items-center justify-center disabled:opacity-50 active:scale-[0.98]"
          title="Refresh Dashboard"
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

      {/* Legend row (moved to top) */}
      {!loading && !error && (
        <div className="bb-card px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-xs text-text-muted">
            Inventory thresholds
          </div>
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-2 text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-status-green" />
              <span>Safe (&gt; 10)</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-status-amber" />
              <span>Low (4–9)</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-status-red" />
              <span>Critical (&lt; 4)</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {loadingHint && (
            <p className="text-sm text-status-amber bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] rounded-xl px-4 py-3">
              {loadingHint}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {BLOOD_GROUPS.map((g, idx) => (
              <div key={idx} className="h-48 bg-app-surface rounded-xl border border-app-border p-6 flex flex-col justify-between animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-6 bg-app-border rounded"></div>
                  <div className="w-20 h-5 bg-app-border rounded-full"></div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-6 bg-app-border rounded w-3/4"></div>
                  <div className="h-4 bg-app-border/60 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {error && !loading && (
        <div className="bb-card p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 bg-[rgba(220,38,38,0.15)] rounded-full flex items-center justify-center text-status-red">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Connection Failure</h3>
            <p className="text-sm text-text-muted mt-1">{error}</p>
          </div>
          <button 
            onClick={fetchInventory} 
            className="bb-button-primary"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main layout: 40% list (scroll) + 60% sticky map (full height) */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
          {/* Left column: list */}
          <div className="bb-card p-6 space-y-4 flex flex-col h-[calc(100vh-180px)]">
            <div>
              <h3 className="text-[15px] font-semibold text-text-primary">Nearest Hospitals</h3>
              <p className="mt-1 text-sm text-text-muted">
                Enter a location to view nearby hospitals and current blood stock availability.
              </p>
            </div>

            <form onSubmit={handleLocationSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="e.g. Whitefield, Bengaluru"
                className="bb-input"
              />
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="px-4 py-2.5 rounded-xl border border-app-border bg-white text-text-primary text-sm font-medium hover:bg-app-hover transition-colors duration-150 active:scale-[0.98]"
                >
                  Use Location
                </button>
                <button
                  type="submit"
                  disabled={isFindingHospitals}
                  className="bb-button-primary disabled:opacity-60 flex-1"
                >
                  {isFindingHospitals ? 'Searching...' : 'Find Hospitals'}
                </button>
              </div>
            </form>

            {hospitalSearchError && (
              <p className="text-sm text-status-red bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.25)] rounded-xl px-4 py-3">
                {hospitalSearchError}
              </p>
            )}

            {!hospitalSearchError && resolvedLocationName && (
              <p className="text-sm text-text-muted">
                Showing nearest hospitals for <span className="font-semibold text-text-primary">{resolvedLocationName}</span>
              </p>
            )}

            {!hospitalSearchError && !isFindingHospitals && resolvedLocationName && nearestHospitals.length === 0 && (
              <p className="text-sm text-status-amber bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.25)] rounded-xl px-4 py-3">
                No nearby hospitals found. Try a nearby city.
              </p>
            )}

            {!hospitalSearchError && nearestHospitals.length > 0 && (
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {nearestHospitals.map((hospital, idx) => (
                  <button
                    key={`${hospital.name}-${idx}`}
                    type="button"
                    onClick={() => setSelectedHospitalIndex(idx)}
                    className={[
                      'w-full text-left rounded-2xl p-4 border transition-all duration-300 relative shadow-sm hover:shadow-md hover:-translate-y-0.5',
                      selectedHospitalIndex === idx
                        ? 'border-red-500 bg-red-50/20 ring-1 ring-red-200 scale-[1.01]'
                        : 'border-app-border bg-white hover:bg-[#fafafa]/80 hover:border-red-100',
                    ].join(' ')}
                    style={{ animation: `smooth-fade-in 0.35s ease-out ${idx * 50}ms both` }}
                  >
                    <div className="relative pr-20">
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-text-primary truncate pr-2">
                          {hospital.name}
                        </div>
                        <div className="mt-1 text-[11px] text-text-muted line-clamp-1">
                          {hospital.address}
                        </div>
                      </div>
                      <span className="absolute top-0.5 right-0 text-[10px] font-bold tracking-wider uppercase text-white bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-0.5 rounded-full shadow-sm border border-red-500/20">
                        {hospital.distance_km} km
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((group) => {
                        const units = Number(
                          (hospital.blood_availability || []).find((i) => i.blood_group === group)?.units_available || 0,
                        );
                        const chip = getChipStyle(units);
                        return (
                          <div
                            key={`${hospital.name}-${group}`}
                            className={[
                              'rounded-lg border px-2 py-1',
                              'flex items-center justify-between gap-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
                              chip.wrap,
                            ].join(' ')}
                          >
                            <span className="text-[10px] font-bold">{group}</span>
                            <span className="text-[10px] font-extrabold font-mono">{units.toFixed(0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column: sticky map */}
          <div className="bb-card overflow-hidden h-[calc(100vh-180px)] sticky top-8">
            <div className="px-4 py-3 border-b border-app-border flex items-center justify-between">
              <div className="text-sm font-semibold text-text-primary">Map</div>
              <div className="text-[11px] text-text-muted">Static view</div>
            </div>
            <div className="h-full">
              <MapContainer
                center={mapCenter}
                zoom={12}
                className="h-full w-full"
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
                attributionControl={false}
              >
                <FitHospitalsBounds hospitals={nearestHospitals} searchCenter={searchCenter} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {searchCenter && (
                  <CircleMarker
                    center={[searchCenter.latitude, searchCenter.longitude]}
                    radius={7}
                    pathOptions={{
                      color: '#2563eb',
                      weight: 2,
                      fillColor: '#3b82f6',
                      fillOpacity: 1,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]}>
                      Your search location
                    </Tooltip>
                  </CircleMarker>
                )}
                {nearestHospitals.map((hospital, idx) => (
                  <CircleMarker
                    key={`pin-${hospital.name}-${idx}`}
                    center={[hospital.latitude, hospital.longitude]}
                    radius={selectedHospitalIndex === idx ? 10 : 8}
                    pathOptions={{
                      color: selectedHospitalIndex === idx ? '#dc2626' : '#64748b',
                      weight: selectedHospitalIndex === idx ? 3 : 2,
                      fillColor: selectedHospitalIndex === idx ? '#dc2626' : '#64748b',
                      fillOpacity: 0.9,
                    }}
                    eventHandlers={{ click: () => setSelectedHospitalIndex(idx) }}
                  >
                    <Tooltip direction="top" opacity={0.98} offset={[0, -8]}>
                      <div className="min-w-[210px] max-w-[260px] rounded-xl border border-app-border bg-app-surface/95 shadow-lg backdrop-blur px-3 py-2.5">
                        <p className="text-xs font-extrabold text-text-primary tracking-tight">
                          {hospital.name}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                          Distance: {hospital.distance_km} km
                        </p>
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {BLOOD_GROUPS.map((group) => {
                            const units = Number(
                              (hospital.blood_availability || []).find((i) => i.blood_group === group)?.units_available || 0,
                            );
                            const chip = getChipStyle(units);
                            return (
                              <span
                                key={`tip-${hospital.name}-${group}`}
                                className={[
                                  'inline-flex items-center justify-between rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
                                  chip.wrap,
                                ].join(' ')}
                              >
                                <span>{group}</span>
                                <span className="font-mono">{units.toFixed(0)}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
      {!loading && !error && selectedHospital && (
        <div className="space-y-6">
          {/* Header block with title & clear selection */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-primary tracking-wide uppercase">
              {`Stock Details for ${selectedHospital.name}`}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedHospitalIndex(null)}
              className="text-xs px-3 py-1.5 rounded-xl border border-app-border text-text-muted hover:bg-app-hover hover:text-text-primary transition-all duration-150 active:scale-95 bg-white shadow-sm"
            >
              Clear Selection
            </button>
          </div>

          {/* Stats KPI Row (Registered Donors, Active Requests) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-smooth-slide-up">
            <div className="bb-card p-6 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">👥</div>
              <div>
                <span className="block text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Registered Donors</span>
                <span className="text-2xl font-black text-text-primary mt-1 block">
                  {donorCount}
                </span>
              </div>
            </div>

            <div className="bb-card p-6 flex items-center gap-4 cursor-default">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-inner">📋</div>
              <div>
                <span className="block text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Active Requests</span>
                <span className="text-2xl font-black text-text-primary mt-1 block">
                  {activeRequestsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Main Visuals & Stock Grid Layout (Side-by-Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6 items-start">
            {/* COLUMN 1: The Graduated Medical Blood Reserve Cylinder Tank */}
            {(() => {
              const totalHospitalUnits = Object.values(stockInventoryToShow).reduce((a, b) => a + b, 0);
              const hospitalCapacityPercent = Math.min(Math.max(0, (totalHospitalUnits / 80) * 100), 100);
              
              const getCylinderStatus = (percent) => {
                if (percent > 50) {
                  return {
                    badge: 'bg-emerald-50 border-emerald-100 text-[#059669]',
                    text: 'Safe Reserves',
                    desc: 'Adequate stock level for operations.',
                    gradient: 'from-emerald-600 via-emerald-500 to-emerald-400',
                  };
                } else if (percent >= 15) {
                  return {
                    badge: 'bg-amber-50 border-amber-100 text-[#d97706]',
                    text: 'Low Reserves',
                    desc: 'Diminishing blood volumes.',
                    gradient: 'from-amber-600 via-amber-500 to-amber-400',
                  };
                } else {
                  return {
                    badge: 'bg-red-50 border-red-100 text-[#dc2626]',
                    text: 'Critical Stock',
                    desc: 'Dangerously low volume.',
                    gradient: 'from-red-600 via-rose-500 to-red-500',
                  };
                }
              };

              const cylinderStatus = getCylinderStatus(hospitalCapacityPercent);
              // Set a minimum height percent for the wave animation so it is visible even at 0%
              const waveHeightPercent = Math.max(15, hospitalCapacityPercent);

              return (
                <div className="bb-card p-6 flex flex-col items-center justify-between h-[480px] relative overflow-hidden group animate-smooth-slide-up bg-white">
                  {/* Subtle clean background light overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-50/20 to-white/50 pointer-events-none" />

                  {/* Three.js interactive 3D IV Drip Chamber */}
                  <div className="relative w-full h-[288px] flex items-center justify-center">
                    <ThreeDripChamber percent={hospitalCapacityPercent} />
                  </div>

                  {/* Metadata and Digital readouts below the physical tank */}
                  <div className="w-full text-center space-y-2 mt-4 z-10">
                    <span className="block text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">
                      Hospital Reserves Fill
                    </span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-3xl font-black text-text-primary tracking-tight font-heading">
                        {hospitalCapacityPercent.toFixed(0)}%
                      </span>
                      <span className="text-[11px] font-bold text-text-muted">
                        {totalHospitalUnits.toFixed(1)} / 80.0 U
                      </span>
                    </div>
                    
                    {/* Dynamic Status badge */}
                    <div className="pt-0.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border shadow-sm ${cylinderStatus.badge}`}>
                        {cylinderStatus.text}
                      </span>
                    </div>
                  </div>
                </div>
              );

            })()}

            {/* COLUMN 2: The 4x2 Detailed Blood Group Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BLOOD_GROUPS.map((group, idx) => {
                const units = stockInventoryToShow[group] || 0;
                const style = getCardStyle(units);
                const donorsForGroup = donorCounts[group] || 0;

                return (
                  <div 
                    key={group}
                    style={{
                      animation: `smooth-slide-up 0.5s ease-out ${idx * 50}ms both`
                    }}
                    className={`bb-card p-6 flex flex-col justify-between h-[213px] transition-smooth hover:scale-[1.03] cursor-default ${style.bg}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-3xl font-black tracking-tight">{group}</span>
                      <span className={`text-[11px] px-2.5 py-1 font-bold rounded-full transition-smooth ${style.badge}`}>
                        {style.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {/* Blood stock units */}
                      <div className="flex justify-between items-baseline border-b border-app-border pb-2">
                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Stock</span>
                        <span className={`text-2xl font-black tracking-tight ${style.color}`}>
                          {units.toFixed(2)} <span className="text-xs font-semibold text-text-muted">Units</span>
                        </span>
                      </div>

                      {/* Registered donor count for this blood group */}
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.5px]">Donors</span>
                        <span className="text-xl font-bold tracking-tight text-text-primary">
                          {donorsForGroup} <span className="text-xs font-semibold text-text-muted">Registered</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !selectedHospital && (
        <div className="bb-card px-5 py-4 text-sm text-text-muted flex items-center gap-2.5">
          <span className="text-accent text-base">ℹ</span>
          <span>Select a hospital from the list above to view its stock cards.</span>
        </div>
      )}

      {/* Color Legend */}
      {!loading && !error && (
        <div className="bb-card p-6 animate-smooth-fade-in">
          <h3 className="text-xs font-bold text-text-primary tracking-wide uppercase">Inventory Threshold Legend</h3>
          <p className="text-xs text-text-muted mt-1">Status colors represent critical levels mapped to blood reserves.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="flex items-start gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl transition-smooth hover:shadow-sm hover:border-emerald-250">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-[#059669] flex-shrink-0 transition-smooth group-hover:scale-125"></span>
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Safe Stock (&gt; 10 Units)</h4>
                <p className="text-xs text-emerald-700 mt-0.5">Sufficient volume of blood units; adequate for standard requests.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl transition-smooth hover:shadow-sm hover:border-amber-250">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-[#d97706] flex-shrink-0 transition-smooth group-hover:scale-125"></span>
              <div>
                <h4 className="text-xs font-bold text-amber-950">Low Stock (4 - 9 Units)</h4>
                <p className="text-xs text-amber-700 mt-0.5">Diminished stock. Keep track of incoming donations for this type.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-red-50/50 border border-red-100 rounded-xl transition-smooth hover:shadow-sm hover:border-red-250">
              <span className="w-3.5 h-3.5 mt-0.5 rounded-full bg-[#dc2626] flex-shrink-0 transition-smooth group-hover:scale-125"></span>
              <div>
                <h4 className="text-xs font-bold text-red-950">Critical Stock (&lt; 4 Units)</h4>
                <p className="text-xs text-red-700 mt-0.5">Dangerously low volume. Triggers system-wide alerts immediately.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
