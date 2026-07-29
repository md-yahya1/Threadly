import React, { useEffect, useState } from 'react';
import { X, CalendarDays, FileText, MessageSquare, Users, UserPlus } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import FollowButton from '../common/FollowButton';
import CommentCard from '../comments/CommentCard';
import PostListItem from '../posts/PostListItem';
import { formatJoinDate } from '../../utils/time';
import './CreatePostModal.css'; // Shared modal layout styles
import './UserProfileModal.css';

const TABS = [
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'comments', label: 'Comments', icon: MessageSquare },
  { key: 'followers', label: 'Followers', icon: Users },
  { key: 'following', label: 'Following', icon: UserPlus }
];

export default function UserProfileModal({ isOpen, onClose, username, onOpenPost }) {
  const [viewedUsername, setViewedUsername] = useState(username);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [tabItems, setTabItems] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setViewedUsername(username);
      setActiveTab('posts');
    }
  }, [isOpen, username]);

  useEffect(() => {
    if (!isOpen || !viewedUsername) return;
    setLoading(true);
    setProfile(null);
    api.getUserProfile(viewedUsername)
      .then(setProfile)
      .catch(err => addToast(err.message || 'Could not load profile', 'error'))
      .finally(() => setLoading(false));
  }, [isOpen, viewedUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen || !viewedUsername) return;

    const loaders = {
      posts: () => api.getUserPosts(viewedUsername),
      comments: () => api.getUserComments(viewedUsername),
      followers: () => api.getFollowers(viewedUsername),
      following: () => api.getFollowing(viewedUsername)
    };

    setTabLoading(true);
    setTabItems([]);
    loaders[activeTab]()
      .then(data => setTabItems(data?.content || []))
      .catch(err => addToast(err.message || 'Could not load profile activity', 'error'))
      .finally(() => setTabLoading(false));
  }, [isOpen, viewedUsername, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const isSelf = user?.username === viewedUsername;

  const openPost = postId => {
    onOpenPost?.(postId);
    onClose();
  };

  const renderTabContent = () => {
    if (tabLoading) return <p className="profile-empty">Loading...</p>;
    if (!tabItems.length) return <p className="profile-empty">Nothing here yet.</p>;

    if (activeTab === 'posts') {
      return tabItems.map(post => <PostListItem key={post.id} post={post} onOpenPost={openPost} />);
    }

    if (activeTab === 'comments') {
      return (
        <div className="comments-list">
          {tabItems.map(comment => (
            <CommentCard key={comment.id} comment={comment} showPostTitle onOpenProfile={setViewedUsername} />
          ))}
        </div>
      );
    }

    return tabItems.map(person => (
      <button key={person.id} className="profile-user-row" onClick={() => setViewedUsername(person.username)}>
        <Avatar name={person.username} src={person.avatarUrl} size="sm" />
        <span>u/{person.username}</span>
      </button>
    ));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="post-modal-card profile-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>u/{viewedUsername}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="post-modal-form">
          {loading || !profile ? (
            <p className="profile-empty">Loading...</p>
          ) : (
            <>
              <div className="profile-identity">
                <Avatar name={profile.username} src={profile.avatarUrl} size="lg" />
                <div className="profile-identity-text">
                  <div className="profile-username">u/{profile.username}</div>
                  <div className="profile-joined">
                    <CalendarDays size={13} />
                    <span>Joined {formatJoinDate(profile.createdAt)}</span>
                  </div>
                </div>
                {!isSelf && (
                  <FollowButton
                    key={profile.username}
                    username={profile.username}
                    isFollowing={profile.isFollowing}
                    onChange={(nowFollowing, followerCount) =>
                      setProfile(p => ({ ...p, isFollowing: nowFollowing, followerCount }))
                    }
                  />
                )}
              </div>

              {profile.bio && <p className="profile-bio">{profile.bio}</p>}

              <div className="profile-stats">
                <div className="profile-stat">
                  <strong>{profile.karma}</strong>
                  <small>Karma</small>
                </div>
                <div className="profile-stat">
                  <strong>{profile.postKarma}</strong>
                  <small>Post karma</small>
                </div>
                <div className="profile-stat">
                  <strong>{profile.commentKarma}</strong>
                  <small>Comment karma</small>
                </div>
                <div className="profile-stat">
                  <strong>{profile.followerCount}</strong>
                  <small>Followers</small>
                </div>
                <div className="profile-stat">
                  <strong>{profile.followingCount}</strong>
                  <small>Following</small>
                </div>
              </div>

              <div className="profile-tabs">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    className={`profile-tab ${activeTab === key ? 'active' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    <Icon size={15} />
                    <span>
                      {label}
                      {key === 'posts' && ` (${profile.postCount})`}
                      {key === 'comments' && ` (${profile.commentCount})`}
                    </span>
                  </button>
                ))}
              </div>

              <div className="profile-tab-content">{renderTabContent()}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
