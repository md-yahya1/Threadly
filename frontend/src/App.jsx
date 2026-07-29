import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Plus, Flame, Clock, TrendingUp, X } from 'lucide-react';
import { api } from './services/api';

import Header from './components/layout/Header';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import MobileNav from './components/layout/MobileNav';

import PostCard from './components/posts/PostCard';
import PostSkeleton from './components/posts/PostSkeleton';

import AuthModal from './components/modals/AuthModal';
import CreatePostModal from './components/modals/CreatePostModal';
import CreateCommunityModal from './components/modals/CreateCommunityModal';
import AccountSettingsModal from './components/modals/AccountSettingsModal';
import UserProfileModal from './components/modals/UserProfileModal';

import { useAuth } from './context/AuthContext';
import './App.css';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Layout & Filter states
  const [activeTab, setActiveTab] = useState('Home'); // Home, Explore, Popular
  const [feedFilter, setFeedFilter] = useState('For You'); // For You, Latest, Popular
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileUsername, setProfileUsername] = useState(null);

  const { isAuthenticated, openAuthModal } = useAuth();

  const loadData = () => {
    setLoadingPosts(true);
    setLoadingCommunities(true);

    api.fetchPosts(0, 50)
      .then(data => {
        setPosts(data?.content || []);
        setLoadingPosts(false);
      })
      .catch(() => {
        setPosts([]);
        setLoadingPosts(false);
      });

    api.fetchCommunities()
      .then(data => {
        setCommunities(data || []);
        setLoadingCommunities(false);
      })
      .catch(() => {
        setCommunities([]);
        setLoadingCommunities(false);
      });
  };

  useEffect(loadData, []);

  // Filter & Sort posts dynamically
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    // Filter by Selected Community
    if (selectedCommunityId) {
      list = list.filter(p => p.community?.id === selectedCommunityId);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p => p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q)
      );
    }

    // Sort by Feed Filter
    if (feedFilter === 'Latest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (feedFilter === 'Popular') {
      list.sort((a, b) => b.score - a.score);
    }

    return list;
  }, [posts, selectedCommunityId, searchQuery, feedFilter]);

  const activeCommunityObj = useMemo(() => {
    if (!selectedCommunityId) return null;
    return communities.find(c => c.id === selectedCommunityId);
  }, [selectedCommunityId, communities]);

  const handleVoteApi = async (postId, value, callback) => {
    try {
      const res = await api.votePost(postId, value);
      if (res && typeof res.score === 'number') {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, score: res.score } : p));
        if (callback) callback(res.score);
      }
    } catch (err) {
      // Revert handle handled inside PostCard state
    }
  };

  return (
    <div className="app-shell">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCreatePost={() => setShowCreatePost(true)}
        onOpenCreateCommunity={() => setShowCreateCommunity(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="app-main-layout">
        {/* Left Sidebar */}
        <LeftSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCommunity={selectedCommunityId}
          setSelectedCommunity={setSelectedCommunityId}
          communities={communities}
          onOpenCreatePost={() => setShowCreatePost(true)}
          onOpenCreateCommunity={() => setShowCreateCommunity(true)}
        />

        {/* Center Feed */}
        <section className="feed-container">
          {/* Community Filter Banner if selected */}
          {activeCommunityObj && (
            <div className="community-banner">
              <div>
                <h2>r/{activeCommunityObj.name}</h2>
                <p>{activeCommunityObj.description}</p>
              </div>
              <button className="clear-filter-btn" onClick={() => setSelectedCommunityId(null)}>
                <X size={16} />
                <span>Clear filter</span>
              </button>
            </div>
          )}

          {/* Feed Filter Header */}
          <div className="feed-filter-bar">
            <div className="filter-pills">
              <button
                className={`filter-pill ${feedFilter === 'For You' ? 'active' : ''}`}
                onClick={() => setFeedFilter('For You')}
              >
                <Sparkles size={16} />
                <span>For You</span>
              </button>

              <button
                className={`filter-pill ${feedFilter === 'Latest' ? 'active' : ''}`}
                onClick={() => setFeedFilter('Latest')}
              >
                <Clock size={16} />
                <span>Latest</span>
              </button>

              <button
                className={`filter-pill ${feedFilter === 'Popular' ? 'active' : ''}`}
                onClick={() => setFeedFilter('Popular')}
              >
                <Flame size={16} />
                <span>Popular</span>
              </button>
            </div>
          </div>

          {/* Posts Feed / Skeleton / Empty State */}
          {loadingPosts ? (
            <PostSkeleton count={3} />
          ) : filteredPosts.length ? (
            filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onVote={handleVoteApi}
                onOpenProfile={setProfileUsername}
                onCommentAdded={() => {
                  setPosts(prev =>
                    prev.map(p => (p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p))
                  );
                }}
              />
            ))
          ) : (
            <div className="empty-feed-card">
              <div className="empty-icon">💬</div>
              <h3>Your feed is quiet</h3>
              <p>
                {searchQuery
                  ? `No posts match "${searchQuery}". Try a different keyword.`
                  : activeCommunityObj
                  ? `No posts in r/${activeCommunityObj.name} yet. Be the first to start the conversation!`
                  : 'Explore communities or create the first post on Threadly.'}
              </p>
              <button
                className="btn-primary"
                onClick={() => (isAuthenticated ? setShowCreatePost(true) : openAuthModal('login'))}
              >
                <Plus size={16} />
                <span>Create a Post</span>
              </button>
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <RightSidebar
          communities={communities}
          onSelectCommunity={id => setSelectedCommunityId(id)}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreatePost={() => setShowCreatePost(true)}
        onOpenCreateCommunity={() => setShowCreateCommunity(true)}
      />

      {/* Modals */}
      <AuthModal />
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        communities={communities}
        onPostCreated={loadData}
      />
      <CreateCommunityModal
        isOpen={showCreateCommunity}
        onClose={() => setShowCreateCommunity(false)}
        onCommunityCreated={loadData}
      />
      <AccountSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <UserProfileModal
        isOpen={!!profileUsername}
        username={profileUsername}
        onClose={() => setProfileUsername(null)}
      />
    </div>
  );
}
