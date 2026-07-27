import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/avatar';
import './Avatar.css';

export default function Avatar({ name = '', size = 'md', src = '', className = '' }) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ backgroundColor: src ? 'transparent' : bgColor }}
      title={name ? `u/${name}` : 'User'}
    >
      {src ? (
        <img src={src} alt={name} className="avatar-img" />
      ) : (
        <span className="avatar-text">{initials}</span>
      )}
    </div>
  );
}
