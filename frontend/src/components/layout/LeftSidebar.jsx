import React from 'react';
import { Home, Compass, TrendingUp, Bookmark, Plus, Users, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import './LeftSidebar.css';

export default function LeftSidebar({
  activeTab,
  setActiveTab,
  selectedCommunity,
  setSelectedCommunity,
  communities,
  onOpenCreatePost,
  onOpenCreateCommunity,
  onOpenSaved
}) {
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleAction = (callback) => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      callback();
    }
  };

  return (
    <aside className="left-sidebar">
      <nav className="nav-section">
        <button
          className={`nav-item ${activeTab === 'Home' && !selectedCommunity ? 'active' : ''}`}
          onClick={() => { setActiveTab('Home'); setSelectedCommunity(null); }}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'Explore' && !selectedCommunity ? 'active' : ''}`}
          onClick={() => { setActiveTab('Explore'); setSelectedCommunity(null); }}
        >
          <Compass size={18} />
          <span>Explore</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'Popular' && !selectedCommunity ? 'active' : ''}`}
          onClick={() => { setActiveTab('Popular'); setSelectedCommunity(null); }}
        >
          <TrendingUp size={18} />
          <span>Popular</span>
        </button>

        <button className="nav-item" onClick={() => handleAction(onOpenSaved)}>
          <Bookmark size={18} />
          <span>Saved</span>
        </button>
      </nav>

      <div className="sidebar-divider" />

      <div className="cta-section">
        <button className="create-post-cta" onClick={() => handleAction(onOpenCreatePost)}>
          <Plus size={18} />
          <span>Create Post</span>
        </button>

        <button className="create-comm-cta" onClick={() => handleAction(onOpenCreateCommunity)}>
          <Users size={16} />
          <span>New Community</span>
        </button>
      </div>

      <div className="sidebar-divider" />

      <div className="communities-section">
        <div className="section-header">
          <small>COMMUNITIES ({communities.length})</small>
        </div>

        <div className="communities-list">
          {communities.length ? (
            communities.map(c => {
              const isSelected = selectedCommunity === c.id;
              return (
                <button
                  key={c.id}
                  className={`community-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCommunity(isSelected ? null : c.id)}
                >
                  <Avatar name={c.name} size="sm" />
                  <span className="community-name">r/{c.name}</span>
                </button>
              );
            })
          ) : (
            <div className="empty-communities">
              <span>No communities yet</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
