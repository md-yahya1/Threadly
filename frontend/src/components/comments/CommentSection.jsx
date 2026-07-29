import React, { useEffect, useMemo, useState } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import CommentCard from './CommentCard';
import './CommentSection.css';

export default function CommentSection({ postId, onCommentAdded, onOpenProfile }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

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

  // Flat list -> parent/child threads, so nested replies render underneath their parent.
  const childrenByParent = useMemo(() => {
    const map = new Map();
    comments.forEach(c => {
      const key = c.parentCommentId ?? 'root';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    });
    return map;
  }, [comments]);

  // Total nested reply count per comment, used for the "N replies hidden" collapse summary.
  const descendantCounts = useMemo(() => {
    const counts = new Map();
    const countFor = id => {
      if (counts.has(id)) return counts.get(id);
      const kids = childrenByParent.get(id) || [];
      const total = kids.reduce((sum, kid) => sum + 1 + countFor(kid.id), 0);
      counts.set(id, total);
      return total;
    };
    comments.forEach(c => countFor(c.id));
    return counts;
  }, [comments, childrenByParent]);

  const submitComment = async (content, parentCommentId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return false;
    }
    if (!content.trim()) return false;

    setIsSubmitting(true);
    try {
      const newComment = await api.addComment(postId, content, parentCommentId);
      setComments(prev => [...prev, newComment]);
      addToast(parentCommentId ? 'Reply posted!' : 'Comment added!', 'success');
      if (onCommentAdded) onCommentAdded();
      return true;
    } catch (err) {
      addToast(err.message || 'Failed to post comment', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (await submitComment(text, null)) setText('');
  };

  const handleReplySubmit = async e => {
    e.preventDefault();
    if (await submitComment(replyText, replyTo.id)) {
      setReplyText('');
      setReplyTo(null);
    }
  };

  const handleReplyClick = comment => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setReplyText('');
    setReplyTo(prev => (prev?.id === comment.id ? null : comment));
  };

  const renderThread = (parentKey, depth) =>
    (childrenByParent.get(parentKey) || []).map(c => (
      <CommentCard
        key={c.id}
        comment={c}
        depth={depth}
        replyCount={descendantCounts.get(c.id) || 0}
        onOpenProfile={onOpenProfile}
        onReplyClick={handleReplyClick}
        replyBox={
          replyTo?.id === c.id ? (
            <form className="comment-form reply-form" onSubmit={handleReplySubmit}>
              <input
                autoFocus
                type="text"
                className="comment-input"
                placeholder={`Reply to u/${c.author?.username || 'anonymous'}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                disabled={isSubmitting}
              />
              <button type="submit" className="comment-submit-btn" disabled={!replyText.trim() || isSubmitting}>
                <Send size={14} />
                <span>{isSubmitting ? 'Posting...' : 'Reply'}</span>
              </button>
              <button type="button" className="comment-cancel-btn" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                <X size={14} />
              </button>
            </form>
          ) : null
        }
      >
        {renderThread(c.id, depth + 1)}
      </CommentCard>
    ));

  return (
    <div className="comment-section">
      {/* Input Form */}
      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <Avatar name={user?.username} src={user?.avatarUrl} size="sm" />
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
        <div className="comments-list">{renderThread('root', 0)}</div>
      ) : (
        <div className="empty-comments">
          <MessageSquare size={20} color="var(--color-text-muted)" />
          <span>No comments yet. Be the first to start the conversation!</span>
        </div>
      )}
    </div>
  );
}
