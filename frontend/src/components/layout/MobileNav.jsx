import React from 'react';
import { Home, Compass, Plus, Users, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './MobileNav.css';

export default function MobileNav({
  activeTab,
  setActiveTab,
  onOpenCreatePost,
  onOpenCreateCommunity
}) {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  return (
    <nav className="mobile-nav">
      <button
        className={`mobile-nav-item ${activeTab === 'Home' ? 'active' : ''}`}
        onClick={() => setActiveTab('Home')}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        className={`mobile-nav-item ${activeTab === 'Explore' ? 'active' : ''}`}
        onClick={() => setActiveTab('Explore')}
      >
        <Compass size={20} />
        <span>Explore</span>
      </button>

      <button
        className="mobile-nav-item create-fab"
        onClick={() => (isAuthenticated ? onOpenCreatePost() : openAuthModal('login'))}
      >
        <Plus size={24} />
      </button>

      <button
        className="mobile-nav-item"
        onClick={() => (isAuthenticated ? onOpenCreateCommunity() : openAuthModal('login'))}
      >
        <Users size={20} />
        <span>Community</span>
      </button>

      <button
        className="mobile-nav-item"
        onClick={() => (isAuthenticated ? null : openAuthModal('login'))}
      >
        <User size={20} />
        <span>{isAuthenticated ? `u/${user.username.slice(0, 6)}` : 'Account'}</span>
      </button>
    </nav>
  );
}
