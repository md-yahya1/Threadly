import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, getStoredToken, getStoredUser, setSession, clearSession, setSessionExpiredHandler } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

  const { addToast } = useToast();

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const login = useCallback(async (usernameOrEmail, password) => {
    setIsLoading(true);
    try {
      const data = await api.login(usernameOrEmail, password);
      const userInfo = { id: data.id, username: data.username, email: data.email };
      setUser(userInfo);
      setToken(data.token);
      setSession(data.token, data.refreshToken, userInfo);
      closeAuthModal();
      addToast(`Welcome back, u/${data.username}!`, 'success');
      return data;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [closeAuthModal, addToast]);

  const register = useCallback(async (username, email, password) => {
    setIsLoading(true);
    try {
      const data = await api.register(username, email, password);
      const userInfo = { id: data.id, username: data.username, email: data.email };
      setUser(userInfo);
      setToken(data.token);
      setSession(data.token, data.refreshToken, userInfo);
      closeAuthModal();
      addToast(`Account created! Welcome to Threadly, u/${data.username}.`, 'success');
      return data;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [closeAuthModal, addToast]);

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const next = { ...prev, ...patch };
      setSession(getStoredToken(), null, next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken('');
    clearSession();
    addToast('You have signed out.', 'info');
  }, [addToast]);

  // When a silent token refresh fails (refresh token itself expired/invalid), api.js calls this
  // so the app can drop back to a logged-out state and prompt the person to sign back in.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setToken('');
      addToast('Your session has expired. Please sign in again.', 'info');
      openAuthModal('login');
    });
  }, [addToast, openAuthModal]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        showAuthModal,
        authMode,
        isLoading,
        openAuthModal,
        closeAuthModal,
        setAuthMode,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
