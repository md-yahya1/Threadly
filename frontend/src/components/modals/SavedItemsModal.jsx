import React, { useEffect, useState } from 'react';
import { X, Bookmark, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import CommentCard from '../comments/CommentCard';
import PostListItem from '../posts/PostListItem';
import './CreatePostModal.css'; // Shared modal layout styles
import './UserProfileModal.css'; // Shared tab/list styles

export default function SavedItemsModal({ isOpen, onClose, onOpenPost, onOpenProfile }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setItems([]);
    const load = activeTab === 'posts' ? api.getSavedPosts() : api.getSavedComments();
    load
      .then(data => setItems(data?.content || []))
      .catch(err => addToast(err.message || 'Could not load saved items', 'error'))
      .finally(() => setLoading(false));
  }, [isOpen, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const openPost = postId => {
    onOpenPost?.(postId);
    onClose();
  };

  const handleCommentSaveChange = (commentId, saved) => {
    if (!saved) setItems(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="post-modal-card profile-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Saved</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="post-modal-form">
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <Bookmark size={15} />
              <span>Posts</span>
            </button>
            <button
              className={`profile-tab ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              <MessageSquare size={15} />
              <span>Comments</span>
            </button>
          </div>

          <div className="profile-tab-content">
            {loading ? (
              <p className="profile-empty">Loading...</p>
            ) : !items.length ? (
              <p className="profile-empty">
                {activeTab === 'posts' ? 'No saved posts yet.' : 'No saved comments yet.'}
              </p>
            ) : activeTab === 'posts' ? (
              items.map(post => <PostListItem key={post.id} post={post} onOpenPost={openPost} />)
            ) : (
              <div className="comments-list">
                {items.map(comment => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    showPostTitle
                    onOpenProfile={onOpenProfile}
                    onSaveChange={handleCommentSaveChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
