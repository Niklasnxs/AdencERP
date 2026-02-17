import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from './types';
import { authAPI, setToken, removeToken } from './services/api';
import { store } from './store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      try {
        await store.initialize();
      } finally {
        setUser(JSON.parse(storedUser));
      }
    };
    bootstrapSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);
      const authenticatedUser = response.user;
      
      // Store JWT token
      setToken(response.token);

      // Load fresh cache once after successful authentication.
      await store.initialize();
      
      // Store user in state and persistent storage
      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    removeToken();
  };

  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
