import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSession, register as apiRegister, logout as apiLogout, signIn } from '../lib/api';
import type { UserType, UserRole } from '../types';

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  viewingAsRole: UserRole | null;

  login: (email: string, password: string) => Promise<UserType>;
  register: (userData: RegisterData) => Promise<UserType>;
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

// ================= PROVIDER =================
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingAsRole, setViewingAsRole] = useState<UserRole | null>(null);

  // ================= INIT SESSION =================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');

        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            id: parsedUser.id.toString(),
            name: parsedUser.name,
            email: parsedUser.email,
            role: parsedUser.role,
          });
        }
      } catch (error) {
        console.error('Auth init failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ================= LOGIN =================
  const login = async (email: string, password: string): Promise<UserType> => {
    setLoading(true);
    try {
      // signIn already stores to localStorage and returns LoginResponse
      const response = await signIn(email, password);
      
      // Check if login was successful
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      
      // Get user from response (api.ts already stored it, but we need it for return)
      const userData: UserType = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      
      // Update state from what's already in localStorage (to avoid race conditions)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          id: parsedUser.id.toString(),
          name: parsedUser.name,
          email: parsedUser.email,
          role: parsedUser.role,
        });
      } else {
        setUser(userData);
      }
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ================= REGISTER =================
  const register = async (data: RegisterData): Promise<UserType> => {
    setLoading(true);
    try {
      // apiRegister already stores to localStorage
      const response = await apiRegister(data);
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      const newUser: UserType = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      
      // Update state from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          id: parsedUser.id.toString(),
          name: parsedUser.name,
          email: parsedUser.email,
          role: parsedUser.role,
        });
      } else {
        setUser(newUser);
      }
      
      return newUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    setLoading(true);
    try {
      await apiLogout();
    } catch (error) {
      console.warn('Logout API failed, clearing locally anyway');
    } finally {
      // apiLogout already clears storage, but do it again to be safe
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_session');
      
      setUser(null);
      setViewingAsRole(null);
      setLoading(false);
    }
  };

  // ================= ADMIN VIEW =================
  const setViewingAs = (role: UserRole | null) => {
    if (user?.role === 'admin') {
      setViewingAsRole(role);
    }
  };

  const returnToAdminView = () => setViewingAsRole(null);

  const isAdminViewing = user?.role === 'admin' && viewingAsRole !== null;

  // ================= PROVIDER =================
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        viewingAsRole,

        login,
        register,
        logout,

        setViewingAsRole: setViewingAs,
        returnToAdminView,
        isAdminViewing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================= HOOK =================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};