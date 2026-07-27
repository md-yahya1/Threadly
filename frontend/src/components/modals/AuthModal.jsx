import React, { useState } from 'react';
import { X, Eye, EyeOff, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

export default function AuthModal() {
  const { showAuthModal, closeAuthModal, authMode, setAuthMode, login, register, isLoading } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!showAuthModal) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (authMode === 'login') {
        await login(form.username, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      setForm({ username: '', email: '', password: '' });
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={closeAuthModal} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Left Branding Banner */}
        <div className="auth-left-banner">
          <div className="banner-logo">
            <MessageSquare size={28} color="#ffffff" />
          </div>
          <h3>Threadly</h3>
          <p>Where conversations become communities.</p>
          <div className="banner-features">
            <div className="feature-chip">🔥 Real-time discussions</div>
            <div className="feature-chip">🛡️ Dedicated communities</div>
            <div className="feature-chip">⚡ Fast & lightweight</div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="auth-right-content">
          <div className="auth-mode-switch">
            <button
              className={`mode-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
            >
              Log In
            </button>
            <button
              className={`mode-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

            <div className="form-group">
              <label>{authMode === 'login' ? 'Username or Email' : 'Username'}</label>
              <input
                required
                type="text"
                className="form-input"
                placeholder={authMode === 'login' ? 'e.g. johndoe' : 'e.g. johndoe'}
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>

            {authMode === 'register' && (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  required
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              <span>{isLoading ? (authMode === 'login' ? 'Signing in...' : 'Creating account...') : (authMode === 'login' ? 'Sign In' : 'Create Account')}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
