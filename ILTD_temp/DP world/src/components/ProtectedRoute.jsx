import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized, redirect to their main dashboard
    if (user.role === 'CHA_AGENT') return <Navigate to="/cha/dashboard" replace />;
    if (user.role === 'GOVT_OFFICIAL') return <Navigate to="/govt/dashboard" replace />;
    if (user.role === 'CBI') return <Navigate to="/cbi" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'COMPLAINANT') return <Navigate to="/complaint/status" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};
