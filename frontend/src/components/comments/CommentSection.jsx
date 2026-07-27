import React, { useEffect, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { formatRelativeTime } from '../../utils/time';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import './CommentSection.css';

export default function CommentSection({ postId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated, openAuthModal, user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    api.fetchComments(postId)
      .then(data => {
        if (isMounted) {
          setComments(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [postId]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await api.addComment(postId, text);
      setComments(prev => [...prev, newComment]);
      setText('');
      addToast('Comment added!', 'success');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      addToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      {/* Input Form */}
      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <Avatar name={user?.username} size="sm" />
          <input
            type="text"
            className="comment-input"
            placeholder="Join the conversation..."
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={isSubmitting}
          />
          <button type="submit" className="comment-submit-btn" disabled={!text.trim() || isSubmitting}>
            <Send size={14} />
            <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
          </button>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <span>Log in to share your thoughts in this discussion.</span>
          <button className="prompt-login-btn" onClick={() => openAuthModal('login')}>
            Log In
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="comment-loading">
          <div className="skeleton-line short skeleton" />
        </div>
      ) : comments.length ? (
        <div className="comments-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="thread-line-container">
                <Avatar name={c.author?.username} size="sm" />
                <div className="thread-line" />
              </div>
              <div className="comment-body-wrapper">
                <div className="comment-header">
                  <span className="comment-author">u/{c.author?.username || 'anonymous'}</span>
                  <span className="comment-time">{formatRelativeTime(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-comments">
          <MessageSquare size={20} color="var(--color-text-muted)" />
          <span>No comments yet. Be the first to start the conversation!</span>
        </div>
      )}
    </div>
  );
}
