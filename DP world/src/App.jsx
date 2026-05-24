import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { GsnDashboard } from './pages/gsn/GsnDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route
            element={(
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout role="ADMIN" />
              </ProtectedRoute>
            )}
          >
            <Route path="/admin/dashboard" element={<GsnDashboard view="admin" />} />
          </Route>

          <Route
            element={(
              <ProtectedRoute allowedRoles={['CHAPTER_PRESIDENT']}>
                <DashboardLayout role="CHAPTER_PRESIDENT" />
              </ProtectedRoute>
            )}
          >
            <Route path="/president/dashboard" element={<GsnDashboard view="president" />} />
          </Route>

          <Route
            element={(
              <ProtectedRoute allowedRoles={['NORMAL_USER', 'USER']}>
                <DashboardLayout role="NORMAL_USER" />
              </ProtectedRoute>
            )}
          >
            <Route path="/user/dashboard" element={<GsnDashboard view="user" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
