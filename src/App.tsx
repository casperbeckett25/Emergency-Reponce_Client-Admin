import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import ClientPortal from './pages/ClientPortal';
import AdminPortal from './pages/AdminPortal';
import { EmergencyProvider } from './context/EmergencyContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login
  if (!user) {
    const isAdminRoute = location.pathname.startsWith('/admin');
    return <Login isAdmin={isAdminRoute} />;
  }

  // If admin user tries to access client portal, redirect to admin
  if (isAdmin() && location.pathname.startsWith('/client')) {
    return <Navigate to="/admin" replace />;
  }

  // If client user tries to access admin portal, redirect to client
  if (!isAdmin() && location.pathname.startsWith('/admin')) {
    return <Navigate to="/client" replace />;
  }

  return (
    <EmergencyProvider>
      <Routes>
        <Route path="/" element={<Navigate to={isAdmin() ? "/admin" : "/client"} replace />} />
        <Route path="/client" element={<ClientPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </EmergencyProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;