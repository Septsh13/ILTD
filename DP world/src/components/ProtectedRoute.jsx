import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const fallbackRoutes = {
  ADMIN: '/admin/dashboard',
  CHAPTER_PRESIDENT: '/president/dashboard',
  NORMAL_USER: '/user/dashboard',
  USER: '/user/dashboard',
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackRoutes[user.role] || '/'} replace />;
  }

  return children;
};
