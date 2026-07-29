import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function FollowButton({ username, isFollowing, onChange }) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToast } = useToast();
  const [following, setFollowing] = useState(!!isFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setLoading(true);
    try {
      const res = following ? await api.unfollowUser(username) : await api.followUser(username);
      setFollowing(!following);
      onChange?.(!following, res.followerCount);
    } catch (err) {
      addToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={following ? 'btn-secondary' : 'btn-primary'}
      onClick={toggle}
      disabled={loading}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
