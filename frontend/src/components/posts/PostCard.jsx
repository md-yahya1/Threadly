import React, { useEffect, useRef, useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Bookmark, Share2, MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react';
import { api } from '../../services/api';
import { formatRelativeTime } from '../../utils/time';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import CommentSection from '../comments/CommentSection';
import './PostCard.css';

export default function PostCard({ post, onVote, onCommentAdded, onOpenProfile, initialSaved = false, onSaveChange, onPostUpdated, onPostDeleted }) {
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const { addToast } = useToast();
  const [userVote, setUserVote] = useState(0); // -1, 0, or 1
  const [score, setScore] = useState(post.score || 0);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

  const isOwner = isAuthenticated && user?.id === post.author?.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editForm, setEditForm] = useState({ title: post.title, content: post.content || '', externalUrl: post.externalUrl || '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setIsSaved(initialSaved), [initialSaved]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const startEditing = () => {
    setEditForm({ title: post.title, content: post.content || '', externalUrl: post.externalUrl || '' });
    setIsEditing(true);
    setMenuOpen(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      addToast('Title cannot be empty', 'error');
      return;
    }
    setIsSavingEdit(true);
    try {
      const updated = await api.updatePost(post.id, {
        title: editForm.title.trim(),
        content: editForm.content,
        externalUrl: editForm.externalUrl
      });
      addToast('Post updated successfully!', 'success');
      setIsEditing(false);
      onPostUpdated?.(post.id, updated);
    } catch (err) {
      addToast(err.message || 'Failed to update post', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deletePost(post.id);
      addToast('Post deleted.', 'info');
      onPostDeleted?.(post.id);
    } catch (err) {
      addToast(err.message || 'Failed to delete post', 'error');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleVoteClick = (direction) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const targetVote = userVote === direction ? 0 : direction;
    const diff = targetVote - userVote;

    // Optimistic UI update
    setUserVote(targetVote);
    setScore(prev => prev + diff);

    onVote(post.id, targetVote, (newScore) => {
      if (typeof newScore === 'number') {
        setScore(newScore);
      }
    });
  };

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        await api.savePost(post.id);
      } else {
        await api.unsavePost(post.id);
      }
      addToast(next ? 'Post saved!' : 'Post removed from saved.', next ? 'success' : 'info');
      onSaveChange?.(post.id, next);
    } catch (err) {
      setIsSaved(!next);
      addToast(err.message || 'Could not update saved posts', 'error');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + `/#post-${post.id}`);
    addToast('Post link copied to clipboard!', 'success');
  };

  return (
    <article className="post-card" id={`post-${post.id}`}>
      <div className="post-vote-column">
        <button
          className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
          onClick={() => handleVoteClick(1)}
          aria-label="Upvote post"
        >
          <ArrowBigUp size={22} />
        </button>
        <span className={`vote-score ${userVote === 1 ? 'up' : userVote === -1 ? 'down' : ''}`}>
          {score}
        </span>
        <button
          className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
          onClick={() => handleVoteClick(-1)}
          aria-label="Downvote post"
        >
          <ArrowBigDown size={22} />
        </button>
      </div>

      <div className="post-content-column">
        <div className="post-header">
          <div className="post-meta">
            <Avatar name={post.community?.name || post.author?.username || 'U'} size="sm" />
            {post.community && (
              <>
                <span className="community-tag">r/{post.community.name}</span>
                <span className="meta-dot">•</span>
              </>
            )}
            <span
              className="author-tag"
              onClick={() => post.author?.username && onOpenProfile?.(post.author.username)}
              style={{ cursor: post.author?.username && onOpenProfile ? 'pointer' : 'default' }}
            >
              Posted by u/{post.author?.username || 'anonymous'}
            </span>
            <span className="meta-dot">•</span>
            <span className="post-time">{formatRelativeTime(post.createdAt)}</span>
          </div>

          <div className="post-more-wrap" ref={menuRef}>
            <button
              className="post-more-btn"
              onClick={() => {
                if (!isOwner) {
                  addToast('More options coming soon', 'info');
                  return;
                }
                setMenuOpen(prev => !prev);
              }}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label="Post options"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && isOwner && (
              <div className="post-options-menu">
                <button className="post-options-item" onClick={startEditing}>
                  <Pencil size={14} />
                  <span>Edit post</span>
                </button>
                <button
                  className="post-options-item danger"
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                >
                  <Trash2 size={14} />
                  <span>Delete post</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {confirmDelete && (
          <div className="post-delete-confirm">
            <span>Delete this post? This can't be undone.</span>
            <div className="post-delete-confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}

        {isEditing ? (
          <form className="post-edit-form" onSubmit={handleSaveEdit}>
            <input
              className="form-input post-edit-title"
              type="text"
              maxLength={300}
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Title"
              required
            />
            <textarea
              className="form-textarea post-edit-body"
              value={editForm.content}
              onChange={e => setEditForm({ ...editForm, content: e.target.value })}
              placeholder="Content (optional)"
            />
            <input
              className="form-input post-edit-url"
              type="url"
              value={editForm.externalUrl}
              onChange={e => setEditForm({ ...editForm, externalUrl: e.target.value })}
              placeholder="External link (optional)"
            />
            <div className="post-edit-actions">
              <button type="button" className="btn-secondary" onClick={cancelEditing} disabled={isSavingEdit}>
                <X size={14} />
                <span>Cancel</span>
              </button>
              <button type="submit" className="btn-primary" disabled={isSavingEdit}>
                <Check size={14} />
                <span>{isSavingEdit ? 'Saving...' : 'Save changes'}</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            <h3 className="post-title">{post.title}</h3>

            {post.content && <p className="post-body">{post.content}</p>}

            {post.externalUrl && (
              <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="post-external-link">
                <img
                  className="link-favicon"
                  alt=""
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(post.externalUrl)}&sz=32`}
                />
                <span className="link-url">{post.externalUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </>
        )}

        <div className="post-actions">
          <button className="action-btn" onClick={() => setShowComments(!showComments)}>
            <MessageSquare size={16} />
            <span>{commentCount} Comments</span>
          </button>

          <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={handleSaveToggle}>
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button className="action-btn" onClick={handleShare}>
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>

        {showComments && (
          <CommentSection
            postId={post.id}
            onOpenProfile={onOpenProfile}
            onCommentAdded={() => {
              setCommentCount(prev => prev + 1);
              if (onCommentAdded) onCommentAdded(post.id);
            }}
          />
        )}
      </div>
    </article>
  );
}
