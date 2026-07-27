import React from 'react';
import './PostSkeleton.css';

export default function PostSkeleton({ count = 3 }) {
  return (
    <div className="skeleton-feed">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-vote" />
          <div className="skeleton-content">
            <div className="skeleton-meta">
              <div className="skeleton-avatar skeleton" />
              <div className="skeleton-line short skeleton" />
            </div>
            <div className="skeleton-line title skeleton" />
            <div className="skeleton-line body skeleton" />
            <div className="skeleton-line body-short skeleton" />
            <div className="skeleton-actions">
              <div className="skeleton-btn skeleton" />
              <div className="skeleton-btn skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
