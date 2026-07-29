import React from 'react';
import { ArrowBigUp, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '../../utils/time';

/** Compact post row used inside modals (profile tabs, saved items). */
export default function PostListItem({ post, onOpenPost }) {
  return (
    <button className="post-list-item" onClick={() => onOpenPost?.(post.id)}>
      <span className="post-list-title">{post.title}</span>
      <span className="post-list-meta">
        {post.community && <span className="community-tag">r/{post.community.name}</span>}
        <span className="post-list-stat">
          <ArrowBigUp size={13} /> {post.score}
        </span>
        <span className="post-list-stat">
          <MessageSquare size={12} /> {post.commentCount}
        </span>
        <span>{formatRelativeTime(post.createdAt)}</span>
      </span>
    </button>
  );
}
