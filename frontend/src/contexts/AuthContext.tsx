import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProfile, getSession, login as apiLogin, register as apiRegister, logout as apiLogout, signIn } from '../lib/api';
import type { UserType, UserRole } from '../types';

// And in the AuthContextType interface
interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  viewingAsRole: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setViewingAsRole: (role: UserRole | null) => void;
  returnToAdminView: () => void;
  isAdminViewing: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  province?: string;
  district?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingAsRole, setViewingAsRole] = useState<UserRole | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check if user data exists in localStorage
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          id: parsedUser.id.toString(), // Convert id to string
          name: parsedUser.name,
          email: parsedUser.email,
          role: parsedUser.role,
        });
      } else {
        // Try to get session from API
        const session = await getSession();
        if (session && session.user) {
          setUser({
            id: session.user.id.toString(),
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          });
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await signIn(email, password);
      const userData = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      
      // Store in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const response = await apiRegister(userData);
      const newUser = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      
      // Store in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiLogout();
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setViewingAsRole(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      setViewingAsRole(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSetViewingAsRole = (role: UserRole | null) => {
    if (user?.role === 'admin') {
      setViewingAsRole(role);
    }
  };

  const returnToAdminView = () => {
    setViewingAsRole(null);
  };

  const isAdminViewing = user?.role === 'admin' && viewingAsRole !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        viewingAsRole,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        setViewingAsRole: handleSetViewingAsRole,
        returnToAdminView,
        isAdminViewing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};