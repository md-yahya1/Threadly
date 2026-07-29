import React, { useEffect, useState } from 'react';
import { X, User, Lock, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import './CreatePostModal.css'; // Shared modal layout styles
import './AccountSettingsModal.css';

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({ bio: '', avatarUrl: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('profile');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setLoading(true);
    api.getProfile()
      .then(data => setProfileForm({ bio: data.bio || '', avatarUrl: data.avatarUrl || '' }))
      .catch(err => addToast(err.message || 'Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const handleProfileSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.updateProfile(profileForm.bio, profileForm.avatarUrl);
      updateUser({ bio: data.bio, avatarUrl: data.avatarUrl });
      addToast('Profile updated!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      addToast('Password updated successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="post-modal-card settings-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Account Settings</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} />
            <span>Profile</span>
          </button>
          <button
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={15} />
            <span>Security</span>
          </button>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="post-modal-form">
            <div className="settings-identity-row">
              <Avatar name={user?.username} size="lg" src={profileForm.avatarUrl} />
              <div>
                <div className="settings-username">u/{user?.username}</div>
                <div className="settings-email">{user?.email}</div>
              </div>
            </div>

            <div className="form-group">
              <label>Avatar URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/your-photo.jpg"
                value={profileForm.avatarUrl}
                disabled={loading}
                onChange={e => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                maxLength={300}
                className="form-textarea"
                placeholder="Tell the community a bit about yourself..."
                value={profileForm.bio}
                disabled={loading}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
              <small className="settings-char-count">{profileForm.bio.length}/300</small>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving || loading}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="post-modal-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                required
                type="password"
                className="form-input"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                required
                minLength={8}
                type="password"
                className="form-input"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                required
                minLength={8}
                type="password"
                className="form-input"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Lock size={16} />
                <span>{saving ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
