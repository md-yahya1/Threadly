import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { formatRelativeTime } from '../../utils/time';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import CommentSection from '../comments/CommentSection';
import './PostCard.css';

export default function PostCard({ post, onVote, onCommentAdded }) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToast } = useToast();
  const [userVote, setUserVote] = useState(0); // -1, 0, or 1
  const [score, setScore] = useState(post.score || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);

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

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setIsSaved(!isSaved);
    addToast(isSaved ? 'Post removed from saved.' : 'Post saved!', isSaved ? 'info' : 'success');
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
            <Avatar name={post.community?.name || 'C'} size="sm" />
            <span className="community-tag">r/{post.community?.name || 'community'}</span>
            <span className="meta-dot">•</span>
            <span className="author-tag">Posted by u/{post.author?.username || 'anonymous'}</span>
            <span className="meta-dot">•</span>
            <span className="post-time">{formatRelativeTime(post.createdAt)}</span>
          </div>

          <button className="post-more-btn" onClick={() => addToast('More options coming soon', 'info')}>
            <MoreHorizontal size={16} />
          </button>
        </div>

        <h3 className="post-title">{post.title}</h3>

        {post.content && <p className="post-body">{post.content}</p>}

        {post.externalUrl && (
          <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="post-external-link">
            🔗 {post.externalUrl}
          </a>
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
