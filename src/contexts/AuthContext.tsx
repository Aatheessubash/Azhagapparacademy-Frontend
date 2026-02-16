/**
 * Auth Context
 * Manages authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AxiosError } from 'axios';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  status: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ApiErrorResponse {
  message?: string;
}

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  const typedError = error as AxiosError<ApiErrorResponse>;
  return typedError.response?.data?.message || fallbackMessage;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          setUser(parsedUser);
        } catch {
          localStorage.removeItem('user');
        }
      }

      setIsLoading(false);

      if (token) {
        try {
          // Verify token is still valid
          const response = await authAPI.getMe();
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Login failed'));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.register(name, email, password);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Registration failed'));
    }
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to update profile'));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        refreshUser
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

export default AuthContext;
