import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function Sidebar() {
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
    }
  ];

  const location = useLocation();
  const itemRefs = useRef([]);

  // Find active index
  const activeIndex = links.findIndex((link) => {
    if (link.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(link.path);
  });

  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
        const activeEl = itemRefs.current[activeIndex];
        setIndicatorStyle({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    // Run layout-dependent code inside requestAnimationFrame to ensure rendering is complete
    const handle = requestAnimationFrame(updateIndicator);

    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeIndex]);

  return (
    <div className="fixed top-0 left-0 w-64 h-full bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col z-30 shadow-lg">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-red-500 animate-pulse">🩸</span> Blood Bank
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 relative">
        {/* Smooth sliding outline pill with a premium glowing border and custom delayed catch-up */}
        <div
          className="absolute left-4 right-4 border border-red-500 bg-red-950/20 rounded-xl pointer-events-none z-0"
          style={{
            top: `${indicatorStyle.top}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
            transition: 'top 380ms cubic-bezier(0.16, 1, 0.3, 1) 60ms, height 380ms cubic-bezier(0.16, 1, 0.3, 1) 60ms, opacity 200ms ease-out',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.25), inset 0 0 6px rgba(239, 68, 68, 0.1)',
          }}
        />

        {links.map((link, index) => (
          <NavLink
            key={link.path}
            to={link.path}
            ref={(el) => (itemRefs.current[index] = el)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl relative z-10 transition-colors duration-150 ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`
            }
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info Area */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        © 2026 Blood Bank Portal
      </div>
    </div>
  );
}

export default Sidebar;
