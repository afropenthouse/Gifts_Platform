import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
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
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
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