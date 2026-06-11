import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'Super Admin' | 'Help Desk Staff' | 'Technician' | 'Viewer' | 'admin' | 'staff';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  department: string | null;
  department_id: number | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  getToken: () => string | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pan_helpdesk_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('pan_helpdesk_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('pan_helpdesk_token');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newUser: User, token: string) => {
    localStorage.setItem('pan_helpdesk_token', token);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error', error);
    }
    localStorage.removeItem('pan_helpdesk_token');
    setUser(null);
  };

  const getToken = () => localStorage.getItem('pan_helpdesk_token');

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        login, 
        logout, 
        getToken,
        isAdmin: user?.role === 'Super Admin' || user?.role === 'admin'
    }}>
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
