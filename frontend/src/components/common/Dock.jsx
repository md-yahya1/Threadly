import React from 'react';
import './Dock.css';

/**
 * Floating icon dock (desktop only — hidden under 800px, see Dock.css).
 * Adapted from a shadcn/framer-motion component to this project's
 * plain CSS + lucide-react conventions (no Tailwind, no extra deps).
 *
 * items: { icon: LucideIcon, label: string, onClick?: () => void, active?: boolean }[]
 */
export default function Dock({ items, className = '' }) {
  return (
    <div className={`dock-wrap ${className}`}>
      <div className="dock">
        {items.map(({ icon: Icon, label, onClick, active }) => (
          <button
            key={label}
            className={`dock-item ${active ? 'active' : ''}`}
            onClick={onClick}
            aria-label={label}
            type="button"
          >
            <Icon className="dock-icon" size={20} />
            <span className="dock-tooltip">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
