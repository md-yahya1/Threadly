import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './CreatePostModal.css'; // Shared modal layout styles

export default function CreateCommunityModal({ isOpen, onClose, onCommunityCreated }) {
  const [form, setForm] = useState({ name: '', description: '', visibility: 'PUBLIC' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createCommunity(form);
      addToast(`Community r/${form.name} created!`, 'success');
      setForm({ name: '', description: '', visibility: 'PUBLIC' });
      onClose();
      if (onCommunityCreated) onCommunityCreated();
    } catch (err) {
      addToast(err.message || 'Failed to create community', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="post-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create a Community</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-modal-form">
          <div className="form-group">
            <label>Community Name</label>
            <input
              required
              maxLength={50}
              type="text"
              className="form-input"
              placeholder="e.g. technology, gaming, science"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '2px' }}>
              Names must be lowercase letters, numbers, or underscores (r/{form.name || 'name'}).
            </small>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              required
              maxLength={1000}
              className="form-textarea"
              placeholder="Describe what your community is about..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || !form.name.trim()}>
              <Users size={16} />
              <span>{isSubmitting ? 'Creating...' : 'Create Community'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
