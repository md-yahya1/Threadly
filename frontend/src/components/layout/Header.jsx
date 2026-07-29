import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Plus, LogOut, User, MessageSquare, Settings, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../common/Avatar';
import NotificationsMenu from './NotificationsMenu';
import './Header.css';

export default function Header({
  searchQuery,
  setSearchQuery,
  onOpenCreatePost,
  onOpenCreateCommunity,
  onOpenSettings,
  onOpenProfile,
  onOpenSaved,
  onOpenPost
}) {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <a href="/" className="header-brand">
          <div className="brand-icon">
            <MessageSquare size={20} color="#ffffff" />
          </div>
          <span className="brand-name">Threadly</span>
        </a>
      </div>

      <div className="header-center">
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search Threadly..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isAuthenticated && (
          <NotificationsMenu onOpenProfile={onOpenProfile} onOpenPost={onOpenPost} />
        )}

        {isAuthenticated ? (
          <div className="user-menu-container" ref={dropdownRef}>
            <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <Avatar name={user?.username} size="sm" src={user?.avatarUrl} />
              <span className="user-name">u/{user?.username}</span>
            </button>

            {dropdownOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <Avatar name={user?.username} size="md" src={user?.avatarUrl} />
                  <div className="dropdown-user-details">
                    <span className="dropdown-username">u/{user?.username}</span>
                    <span className="dropdown-email">{user?.email}</span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); onOpenProfile(user?.username); }}>
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); onOpenSaved(); }}>
                  <Bookmark size={16} />
                  <span>Saved</span>
                </button>

                <div className="dropdown-divider" />

                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); onOpenCreatePost(); }}>
                  <Plus size={16} />
                  <span>Create Post</span>
                </button>
                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); onOpenCreateCommunity(); }}>
                  <Plus size={16} />
                  <span>Create Community</span>
                </button>

                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); onOpenSettings(); }}>
                  <Settings size={16} />
                  <span>Account Settings</span>
                </button>

                <div className="dropdown-divider" />

                <button className="dropdown-item danger" onClick={() => { setDropdownOpen(false); logout(); }}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-secondary" onClick={() => openAuthModal('login')}>
              Log In
            </button>
            <button className="btn-primary" onClick={() => openAuthModal('register')}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
