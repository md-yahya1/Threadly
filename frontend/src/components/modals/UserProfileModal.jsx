import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import FollowButton from '../common/FollowButton';
import './CreatePostModal.css'; // Shared modal layout styles

export default function UserProfileModal({ isOpen, onClose, username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen || !username) return;
    setLoading(true);
    api.getUserProfile(username)
      .then(setProfile)
      .catch(err => addToast(err.message || 'Could not load profile', 'error'))
      .finally(() => setLoading(false));
  }, [isOpen, username]);

  if (!isOpen) return null;

  const isSelf = user?.username === username;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="post-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>u/{username}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="post-modal-form">
          {loading || !profile ? (
            <p>Loading...</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar name={profile.username} src={profile.avatarUrl} size="lg" />
                <div>
                  <div style={{ fontWeight: 700 }}>u/{profile.username}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {profile.karma} karma
                  </div>
                </div>
              </div>

              {profile.bio && <p>{profile.bio}</p>}

              <div style={{ display: 'flex', gap: '20px' }}>
                <span><strong>{profile.followerCount}</strong> Followers</span>
                <span><strong>{profile.followingCount}</strong> Following</span>
              </div>

              {!isSelf && (
                <FollowButton
                  username={profile.username}
                  isFollowing={profile.isFollowing}
                  onChange={(nowFollowing, followerCount) =>
                    setProfile(p => ({ ...p, isFollowing: nowFollowing, followerCount }))
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
