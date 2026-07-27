const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6'
];

export function getInitials(name = '') {
  if (!name) return 'U';
  const clean = name.trim().replace(/^u\//i, '').replace(/^r\//i, '');
  const parts = clean.split(/[\s_.-]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}
