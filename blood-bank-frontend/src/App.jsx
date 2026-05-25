import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Donors from './pages/Donors';
import Requests from './pages/Requests';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar Navigation */}
        <Sidebar />
        
        {/* Main Content Pane */}
        <main className="flex-1 pl-64 min-h-screen">
          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/donors" element={<Donors />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
