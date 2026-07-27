import React, { useState } from 'react';
import { Sparkles, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import './RightSidebar.css';

export default function RightSidebar({ communities = [], onSelectCommunity }) {
  const [joinedState, setJoinedState] = useState({});
  const { addToast } = useToast();

  const toggleJoin = (commName, e) => {
    e.stopPropagation();
    const isJoined = joinedState[commName];
    setJoinedState(prev => ({ ...prev, [commName]: !isJoined }));
    if (!isJoined) {
      addToast(`Joined r/${commName}!`, 'success');
    } else {
      addToast(`Left r/${commName}.`, 'info');
    }
  };

  const trending = communities.slice(0, 4);

  return (
    <aside className="right-sidebar">
      {/* Trending Communities Card */}
      <div className="sidebar-card">
        <div className="card-header">
          <TrendingUp size={16} className="header-icon primary" />
          <h4>Trending Communities</h4>
        </div>
        <div className="trending-list">
          {trending.length ? (
            trending.map(c => {
              const isJoined = joinedState[c.name];
              return (
                <div
                  key={c.id}
                  className="trending-item"
                  onClick={() => onSelectCommunity(c.id)}
                >
                  <Avatar name={c.name} size="sm" />
                  <div className="trending-info">
                    <span className="trending-name">r/{c.name}</span>
                    <span className="trending-desc">{c.description}</span>
                  </div>
                  <button
                    className={`join-btn ${isJoined ? 'joined' : ''}`}
                    onClick={(e) => toggleJoin(c.name, e)}
                  >
                    {isJoined ? 'Joined' : 'Join'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-trending">
              <Users size={20} color="var(--color-text-muted)" />
              <span>Create communities to populate trending topics!</span>
            </div>
          )}
        </div>
      </div>

      {/* Rules / Guidelines Card */}
      <div className="sidebar-card">
        <div className="card-header">
          <ShieldCheck size={16} className="header-icon success" />
          <h4>Threadly Guidelines</h4>
        </div>
        <ul className="rules-list">
          <li>1. Be respectful and constructive</li>
          <li>2. Post authentic, high-quality content</li>
          <li>3. Vote thoughtfully to highlight great ideas</li>
          <li>4. Follow individual community rules</li>
        </ul>
      </div>

      {/* Startup Promo Card */}
      <div className="sidebar-card promo-card">
        <div className="promo-badge">
          <Sparkles size={14} />
          <span>Threadly v1.0</span>
        </div>
        <h4>Where conversations become communities.</h4>
        <p>Built with Spring Boot 3.5, MySQL & React. Fast, responsive, and open for discussions.</p>
      </div>
    </aside>
  );
}
