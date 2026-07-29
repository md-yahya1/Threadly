import React, { useEffect, useState } from 'react';
import { ArrowBigUp, ArrowBigDown, Bookmark, Reply } from 'lucide-react';
import { api } from '../../services/api';
import { formatRelativeTime } from '../../utils/time';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';

export default function CommentCard({
  comment,
  depth = 0,
  showPostTitle = false,
  onOpenProfile,
  onReplyClick,
  onSaveChange,
  replyBox,
  children
}) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToast } = useToast();
  const [userVote, setUserVote] = useState(comment.userVote || 0);
  const [score, setScore] = useState(comment.score || 0);
  const [saved, setSaved] = useState(!!comment.saved);

  useEffect(() => {
    setUserVote(comment.userVote || 0);
    setScore(comment.score || 0);
    setSaved(!!comment.saved);
  }, [comment.id, comment.userVote, comment.score, comment.saved]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return false;
    }
    return true;
  };

  const handleVote = async direction => {
    if (!requireAuth()) return;

    const target = userVote === direction ? 0 : direction;
    const previousVote = userVote;
    const previousScore = score;

    setUserVote(target);
    setScore(previousScore + (target - previousVote));

    try {
      const res = await api.voteComment(comment.id, target);
      setScore(res.score);
      setUserVote(res.userVote);
    } catch (err) {
      setUserVote(previousVote);
      setScore(previousScore);
      addToast(err.message || 'Could not register your vote', 'error');
    }
  };

  const handleSave = async () => {
    if (!requireAuth()) return;

    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        await api.saveComment(comment.id);
      } else {
        await api.unsaveComment(comment.id);
      }
      addToast(next ? 'Comment saved!' : 'Comment removed from saved.', next ? 'success' : 'info');
      onSaveChange?.(comment.id, next);
    } catch (err) {
      setSaved(!next);
      addToast(err.message || 'Could not update saved comments', 'error');
    }
  };

  return (
    <div className="comment-item" style={depth ? { marginLeft: Math.min(depth, 4) * 20 } : undefined}>
      <div className="thread-line-container">
        <Avatar name={comment.author?.username} src={comment.author?.avatarUrl} size="sm" />
        <div className="thread-line" />
      </div>

      <div className="comment-body-wrapper">
        <div className="comment-header">
          <span
            className="comment-author"
            onClick={() => comment.author?.username && onOpenProfile?.(comment.author.username)}
            style={{ cursor: comment.author?.username && onOpenProfile ? 'pointer' : 'default' }}
          >
            u/{comment.author?.username || 'anonymous'}
          </span>
          <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
        </div>

        {showPostTitle && comment.postTitle && (
          <span className="comment-context">on “{comment.postTitle}”</span>
        )}

        <p className="comment-text">{comment.content}</p>

        <div className="comment-actions">
          <button
            className={`comment-action-btn ${userVote === 1 ? 'up' : ''}`}
            onClick={() => handleVote(1)}
            aria-label="Upvote comment"
          >
            <ArrowBigUp size={15} />
          </button>
          <span className={`comment-score ${userVote === 1 ? 'up' : userVote === -1 ? 'down' : ''}`}>{score}</span>
          <button
            className={`comment-action-btn ${userVote === -1 ? 'down' : ''}`}
            onClick={() => handleVote(-1)}
            aria-label="Downvote comment"
          >
            <ArrowBigDown size={15} />
          </button>

          {onReplyClick && (
            <button className="comment-action-btn text" onClick={() => onReplyClick(comment)}>
              <Reply size={13} />
              <span>Reply</span>
            </button>
          )}

          <button className={`comment-action-btn text ${saved ? 'saved' : ''}`} onClick={handleSave}>
            <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {replyBox}
        {children}
      </div>
    </div>
  );
}
