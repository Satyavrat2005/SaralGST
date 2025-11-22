
import React from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Page from './app/page';
import AuthPage from './app/auth/page';
import DashboardLayout from './app/dashboard/layout';
import SMEDashboard from './app/dashboard/sme/page';
import CADashboard from './app/dashboard/ca/page';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Root Route - Landing Page */}
        <Route path="/" element={<Page />} />
        
        {/* Auth Route */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Dashboard Routes (Protected Layout) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
           {/* SME Routes */}
           <Route path="sme" element={<SMEDashboard />} />
           <Route path="sme/*" element={<SMEDashboard />} /> {/* Catch-all for demo */}
           
           {/* CA Routes */}
           <Route path="ca" element={<CADashboard />} />
           <Route path="ca/*" element={<CADashboard />} /> {/* Catch-all for demo */}
           
           {/* Default Redirect */}
           <Route index element={<Navigate to="/dashboard/sme" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
