import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import InstallPrompt from './components/shared/InstallPrompt';
import WelcomeScreen from './components/WelcomeScreen';
import LoginPage from './components/LoginPage';
import { Loader2 } from 'lucide-react';

// Dashboard imports
import AdminDashboard from './components/admin/AdminDashboard';
import ConsumerDashboard from './components/consumer/ConsumerDashboard';
import VendorDashboard from './components/vendor/VendorDashboard';
import BusinessDashboard from './components/business/BusinessDashboard';
import AgentDashboard from './components/agent/AgentDashboard';
import UnauthorizedPage from './components/auth/UnauthorizedPage';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
// Safe localStorage helper
const getLocalStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

// Inner App Logic with Routes
function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const [showWelcome, setShowWelcome] = useState(() => {
    return !getLocalStorage('welcome_seen');
  });

  // Force dark mode once
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-900">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  // First-time welcome (only when not logged in)
  if (!user && showWelcome) {
    return (
      <WelcomeScreen
        onEnterApp={() => {
          localStorage.setItem('welcome_seen', 'true');
          setShowWelcome(false);
        }}
      />
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes - Main Dashboard Redirect */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            {user?.role === 'admin' && <Navigate to="/admin/dashboard" replace />}
            {user?.role === 'vendor' && <Navigate to="/vendor/dashboard" replace />}
            {user?.role === 'business' && <Navigate to="/business/dashboard" replace />}
            {user?.role === 'consumer' && <Navigate to="/consumer/dashboard" replace />}
            {user?.role === 'agent' && <Navigate to="/agent/dashboard" replace />}
            <Navigate to="/login" replace />
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard user={user!} onLogout={logout} />
          </ProtectedRoute>
        } 
      />

      {/* Vendor Routes */}
      <Route 
        path="/vendor/*" 
        element={
          <ProtectedRoute allowedRoles={['vendor', 'admin']}>
            <VendorDashboard user={user!} onLogout={logout} />
          </ProtectedRoute>
        } 
      />

      {/* Business Routes */}
      <Route 
        path="/business/*" 
        element={
          <ProtectedRoute allowedRoles={['business', 'admin']}>
            <BusinessDashboard user={user!} onLogout={logout} />
          </ProtectedRoute>
        } 
      />

      {/* Consumer Routes */}
      <Route 
        path="/consumer/*" 
        element={
          <ProtectedRoute allowedRoles={['consumer', 'admin']}>
            <ConsumerDashboard user={user!} onLogout={logout} />
          </ProtectedRoute>
        } 
      />

      {/* Agent Routes */}
      <Route 
        path="/agent/*" 
        element={
          <ProtectedRoute allowedRoles={['agent', 'admin']}>
            <AgentDashboard user={user!} onLogout={logout} />
          </ProtectedRoute>
        } 
      />

      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />

      {/* 404 - Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App Layout Component
function AppLayout() {
  const { user } = useAuth();
  
  return (
    <>
      {/* Background Layers */}
      <div className="app-bg" />
      <div className="app-overlay" />

      {/* Main App Content */}
      <div className="relative z-10 min-h-screen">
        <AppRoutes />
        
        {/* Smart Install Prompt (only after login) */}
        {user && <InstallPrompt />}
        
        {/* Notifications */}
        <Toaster position="top-right" richColors />
      </div>
    </>
  );
}

// Root App with Providers and Router
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;