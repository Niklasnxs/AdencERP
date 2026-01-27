import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from './types';
import { store } from './store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is stored in session storage
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const authenticatedUser = store.authenticateUser(email, password);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      sessionStorage.setItem('user', JSON.stringify(authenticatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
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
