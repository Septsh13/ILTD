import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';

// CHA Portal
import { ChaDashboard } from './pages/cha/Dashboard';
import { ChaShipments } from './pages/cha/Shipments';
import { ChaUpload } from './pages/cha/Upload';
import { ChaInteractionLog } from './pages/cha/InteractionLog';

// Govt Portal
import { GovtDashboard } from './pages/govt/Dashboard';
import { GovtDocuments } from './pages/govt/Documents';
import { GovtPerformance } from './pages/govt/Performance';

// CBI Portal
import { CBIDashboard } from './pages/cbi/Dashboard';
import { ComplaintDetail } from './pages/cbi/ComplaintDetail';

// Admin Portal
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminReviews } from './pages/admin/Reviews';
import { AdminComplaints } from './pages/admin/Complaints';
import { AdminAuditLogs } from './pages/admin/AuditLogs';
import { AdminUsers } from './pages/admin/Users';

// Complaint Portal
import { ComplaintStatus } from './pages/complaint/Status';
import { FileComplaint } from './pages/complaint/FileComplaint';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* CHA Agent Portal */}
          <Route element={<ProtectedRoute allowedRoles={['CHA_AGENT']}><DashboardLayout role="CHA_AGENT" /></ProtectedRoute>}>
            <Route path="/cha/dashboard" element={<ChaDashboard />} />
            <Route path="/cha/shipments" element={<ChaShipments />} />
            <Route path="/cha/upload" element={<ChaUpload />} />
            <Route path="/cha/log" element={<ChaInteractionLog />} />
            <Route path="/complaint" element={<FileComplaint />} />
            <Route path="/complaint/status" element={<ComplaintStatus />} />
          </Route>

          {/* Government Official Portal */}
          <Route element={<ProtectedRoute allowedRoles={['GOVT_OFFICIAL']}><DashboardLayout role="GOVT_OFFICIAL" /></ProtectedRoute>}>
            <Route path="/govt/dashboard" element={<GovtDashboard />} />
            <Route path="/govt/documents" element={<GovtDocuments />} />
            <Route path="/govt/performance" element={<GovtPerformance />} />
          </Route>

          {/* CBI Investigation Portal */}
          <Route element={<ProtectedRoute allowedRoles={['CBI']}><DashboardLayout role="CBI" /></ProtectedRoute>}>
            <Route path="/cbi" element={<CBIDashboard />} />
            <Route path="/cbi/complaints/:id" element={<ComplaintDetail />} />
          </Route>

          {/* Admin Portal */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout role="ADMIN" /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/logs" element={<AdminAuditLogs />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* Complainant Portal */}
          <Route element={<ProtectedRoute allowedRoles={['COMPLAINANT']}><DashboardLayout role="COMPLAINANT" /></ProtectedRoute>}>
            <Route path="/complaint/status" element={<ComplaintStatus />} />
            <Route path="/complaint/new" element={<FileComplaint />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
