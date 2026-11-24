import React, { createContext, useState, useMemo, useEffect } from 'react';
import { User } from '../types';
import { apiService, Credentials, RegisterDetails } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: Credentials) => Promise<User | null>;
  logout: () => void;
  register: (details: RegisterDetails) => Promise<{ user?: User, error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (credentials: Credentials) => {
    const response = await apiService.login(credentials);
    if (response && response.user && response.token) {
      setUser(response.user);
      setToken(response.token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      sessionStorage.setItem('token', response.token);
      return response.user;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  const register = async (details: RegisterDetails) => {
    return await apiService.register(details);
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    register,
  }), [user, token, loading]);

  if (loading) {
    return <div>Loading application...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
