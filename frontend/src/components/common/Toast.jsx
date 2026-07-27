import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-card toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle2 className="toast-icon" size={18} />}
          {t.type === 'error' && <AlertCircle className="toast-icon" size={18} />}
          {t.type === 'info' && <Info className="toast-icon" size={18} />}
          <span className="toast-message">{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Close notification">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
