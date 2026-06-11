/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Placeholder imports for pages we are about to create
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Login from './pages/Login';

import TicketDetail from './pages/TicketDetail';
import TicketNew from './pages/TicketNew';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: ReactNode, requireAdmin?: boolean }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/new" element={<TicketNew />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            <Route path="/departments" element={<ProtectedRoute requireAdmin><Departments /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute requireAdmin><Logs /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requireAdmin><div className="p-8"><h1 className="text-2xl font-bold">System Settings</h1></div></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

