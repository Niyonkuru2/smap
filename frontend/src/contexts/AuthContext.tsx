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
          setUser(JSON.parse(storedUser));
        } else {
          // Optional API fallback
          const session = await getSession();
          if (session?.user) {
            const userData: UserType = {
              id: session.user.id.toString(),
              name: session.user.name,
              email: session.user.email,
              role: session.user.role,
            };

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
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
      const response = await signIn(email, password);

      const userData: UserType = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };

      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ================= REGISTER =================
  const register = async (data: RegisterData): Promise<UserType> => {
    setLoading(true);
    try {
      const response = await apiRegister(data);

      const newUser: UserType = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };

      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }

      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

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