import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api/axios';

function Sidebar() {
  const [bloodLevel, setBloodLevel] = useState(35);
  const [tankLabel, setTankLabel] = useState('Global Reserves');
  const [globalBaseline, setGlobalBaseline] = useState(35);

  useEffect(() => {
    const fetchInitialBlood = async () => {
      try {
        const response = await api.get('/api/inventory');
        if (response.data?.success) {
          const items = response.data.data || [];
          let total = 0;
          items.forEach(item => {
            total += parseFloat(item.QuantityAvailable || 0);
          });
          const mappedPercent = Math.min(Math.max(15, (total / 150) * 100), 100);
          setBloodLevel(mappedPercent);
          setGlobalBaseline(mappedPercent);
        }
      } catch (err) {
        console.error('Failed to fetch initial sidebar blood level:', err);
      }
    };

    fetchInitialBlood();

    const handleDonation = () => {
      setGlobalBaseline((prev) => Math.min(prev + 10, 100));
      setBloodLevel((prev) => Math.min(prev + 10, 100));
    };

    const handleHospitalSelected = (e) => {
      setTankLabel(e.detail.name);
      setBloodLevel(e.detail.percent);
    };

    const handleHospitalDeselected = () => {
      setTankLabel('Global Reserves');
      setBloodLevel(globalBaseline);
    };

    window.addEventListener('donation-logged', handleDonation);
    window.addEventListener('sidebar-hospital-selected', handleHospitalSelected);
    window.addEventListener('sidebar-hospital-deselected', handleHospitalDeselected);

    return () => {
      window.removeEventListener('donation-logged', handleDonation);
      window.removeEventListener('sidebar-hospital-selected', handleHospitalSelected);
      window.removeEventListener('sidebar-hospital-deselected', handleHospitalDeselected);
    };
  }, [globalBaseline]);

  const links = [
    {
      name: 'Dashboard',
      path: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
        </svg>
      )
    },
    {
      name: 'Donors',
      path: '/donors',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      )
    },
    {
      name: 'Requests',
      path: '/requests',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      )
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
      )
    },
    {
      name: 'AI Assistant',
      path: '/ai',
      badge: 'NEW',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-[#6b0f0f] via-[#520909] to-[#2b020a] border-r border-white/5 text-white flex flex-col z-30 transition-all duration-300 shadow-2xl">
      <div className="px-6 py-6 border-b border-white/10 bg-black/10">
        <div className="text-[20px] font-black text-white flex items-center gap-2.5">
          <svg className="w-6 h-6 text-red-500 fill-current animate-pulse drop-shadow-[0_2px_8px_rgba(239,68,68,0.7)]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35c-4.42 0-8-3.58-8-8c0-3.14 2.56-6.72 8-11.85c5.44 5.13 8 8.71 8 11.85c0 4.42-3.58 8-8 8z" />
          </svg>
          <span className="tracking-tight bg-gradient-to-r from-white via-white to-red-100 bg-clip-text text-transparent">LifeFlow</span>
        </div>
        <div className="mt-1.5 text-[9px] font-bold tracking-[0.15em] text-white/40 uppercase font-mono">Blood Bank Portal</div>
      </div>

      <nav className="flex-1 py-6">
        <div className="px-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl',
                  'transition-all duration-300 relative',
                  isActive
                    ? 'bg-white/10 text-white border-l-[4px] border-red-500 rounded-l-none shadow-[inset_1px_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-white' : 'text-white/60 group-hover:text-white transition-colors duration-300'}>
                    {link.icon}
                  </span>
                  <span className="transition-all duration-300">{link.name}</span>
                  {link.badge && (
                    <span className="ml-2 px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-red-600 text-white rounded-full leading-none tracking-wider shadow-sm animate-pulse shrink-0">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Liquid Blood Reserves Level Cylinder Tank */}
      <div className="px-4 py-4 mt-auto">
        <div className="relative w-full h-32 bg-black/20 border border-white/10 rounded-2xl overflow-hidden shadow-inner backdrop-blur-md flex flex-col justify-between p-4 group hover:border-red-500/30 transition-all duration-300">
          
          {/* Wave fluid backdrop */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-850 to-red-650 transition-all duration-1000 ease-out" 
            style={{ height: `${bloodLevel}%` }}
          >
            {/* Wave layer 1 */}
            <div 
              className="absolute -top-[270px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-[42%] bg-[#4c0519] animate-spin" 
              style={{ animationDuration: '12s' }} 
            />
            {/* Wave layer 2 */}
            <div 
              className="absolute -top-[275px] left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-[40%] bg-red-500/30 animate-spin" 
              style={{ animationDuration: '16s' }} 
            />
          </div>

          {/* Glowing pulse indicator at top left */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold tracking-[0.12em] text-white/70 uppercase font-mono truncate max-w-[150px]" title={tankLabel}>{tankLabel}</span>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>

          {/* Large Level Percentage */}
          <div className="relative z-10 mt-auto flex items-baseline gap-1">
            <span className="text-3xl font-black text-white tracking-tight drop-shadow-md">{bloodLevel.toFixed(0)}</span>
            <span className="text-xs font-bold text-white/70">%</span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider ml-auto drop-shadow-sm animate-pulse">Live</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 border-t border-white/10 bg-black/10">
        <div className="text-[9px] text-white/30 font-mono tracking-[0.15em] uppercase">DataVista 2026</div>
      </div>
    </aside>
  );
}

export default Sidebar;
