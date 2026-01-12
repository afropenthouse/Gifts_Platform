import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  wallet: number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
  loginModalOpen: boolean;
  signupModalOpen: boolean;
  openLoginModal: () => void;
  openSignupModal: () => void;
  closeModals: () => void;
  switchToLogin: () => void;
  switchToSignup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  const openLoginModal = () => setLoginModalOpen(true);
  const openSignupModal = () => setSignupModalOpen(true);
  const closeModals = () => {
    setLoginModalOpen(false);
    setSignupModalOpen(false);
  };
  const switchToLogin = () => {
    setSignupModalOpen(false);
    setLoginModalOpen(true);
  };
  const switchToSignup = () => {
    setLoginModalOpen(false);
    setSignupModalOpen(true);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    // Optimistic rehydrate from localStorage to avoid flicker on refresh
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (_) {
        // If parsing fails, clear corrupted data
        localStorage.removeItem('user');
      }
    }

    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const freshUser = await res.json();
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth revalidate failed:', err);
        // Keep optimistic user so UI stays up; user can retry actions to refresh
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, loginModalOpen, signupModalOpen, openLoginModal, openSignupModal, closeModals, switchToLogin, switchToSignup }}>
      {children}
    </AuthContext.Provider>
  );
};