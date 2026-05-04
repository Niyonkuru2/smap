import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import ConsumerDashboard from './consumer/ConsumerDashboard';
import VendorDashboard from './vendor/VendorDashboard';
import BusinessDashboard from './business/BusinessDashboard';
import AgentDashboard from './agent/AgentDashboard';

const DashboardRouter: React.FC = () => {
  const { user, viewingAsRole, returnToAdminView, logout, setViewingAsRole, isAdminViewing } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin viewing as another role
  if (isAdminViewing && viewingAsRole) {
    const commonProps = {
      user: user,
      onLogout: logout,
      isAdminViewing: true,
      onReturnToAdmin: returnToAdminView,
    };

    switch (viewingAsRole) {
      case 'consumer':
        return <ConsumerDashboard {...commonProps} />;
      case 'vendor':
        return <VendorDashboard {...commonProps} />;
      case 'business':
        return <BusinessDashboard {...commonProps} />;
      case 'agent':
        return <AgentDashboard {...commonProps} />;
      default:
        return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // Regular role-based dashboard
  switch (user.role) {
    case 'admin':
      // ✅ Pass onViewAsRole correctly - it expects (role: UserRole) => void
      return (
        <AdminDashboard 
          user={user} 
          onLogout={logout} 
          onViewAsRole={(role) => setViewingAsRole(role)} 
        />
      );
    case 'consumer':
      return <ConsumerDashboard user={user} onLogout={logout} />;
    case 'vendor':
      return <VendorDashboard user={user} onLogout={logout} />;
    case 'business':
      return <BusinessDashboard user={user} onLogout={logout} />;
    case 'agent':
      return <AgentDashboard user={user} onLogout={logout} />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

export default DashboardRouter;