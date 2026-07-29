import React, { useState } from 'react';
import { X, Send, Image, Link, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './CreatePostModal.css';

export default function CreatePostModal({ isOpen, onClose, communities = [], onPostCreated }) {
  const [form, setForm] = useState({ communityId: '', title: '', content: '', externalUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async e => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await api.createPost({
        ...form,
        communityId: form.communityId ? Number(form.communityId) : null,
        postType: form.externalUrl ? 'LINK' : 'TEXT'
      });
      addToast('Post published successfully!', 'success');
      setForm({ communityId: '', title: '', content: '', externalUrl: '' });
      onClose();
      if (onPostCreated) onPostCreated();
    } catch (err) {
      addToast(err.message || 'Failed to create post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="post-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create a Post</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-modal-form">
          <div className="form-group">
            <label>Choose Community (optional)</label>
            <select
              className="form-select"
              value={form.communityId}
              onChange={e => setForm({ ...form, communityId: e.target.value })}
            >
              <option value="">No community (personal post)</option>
              {communities.map(c => (
                <option key={c.id} value={c.id}>
                  r/{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              required
              maxLength={300}
              type="text"
              className="form-input"
              placeholder="Title of your post..."
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Content (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Share your thoughts, story, or discussion starter..."
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>External Link (optional)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com"
              value={form.externalUrl}
              onChange={e => setForm({ ...form, externalUrl: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Send size={16} />
              <span>{isSubmitting ? 'Posting...' : 'Publish Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
