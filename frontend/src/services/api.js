const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'forumhub_token';
const REFRESH_TOKEN_KEY = 'forumhub_refresh_token';
const USER_KEY = 'forumhub_user';

// Set by AuthContext so api.js can react when refresh fails (session truly dead).
let onSessionExpired = () => {};
export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setSession(token, refreshToken, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Dedupe concurrent refresh attempts so multiple failed requests don't each trigger their own refresh call.
let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) throw new Error('Refresh token expired or invalid');

    const data = await response.json();
    const user = getStoredUser();
    setSession(data.token, data.refreshToken, user);
    return data.token;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

async function request(endpoint, options = {}, isRetry = false) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    // A 401/403 on an authenticated call (never on login/register/refresh itself) means the
    // access token likely expired. Try a silent refresh once, then retry the original call.
    if (
      (response.status === 401 || response.status === 403) &&
      !isRetry &&
      token &&
      !AUTH_ENDPOINTS.includes(endpoint)
    ) {
      try {
        await refreshAccessToken();
        return request(endpoint, options, true);
      } catch (refreshErr) {
        clearSession();
        onSessionExpired();
        throw new Error('Your session has expired. Please sign in again.');
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || getDefaultErrorMessage(response.status);
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your backend connection.');
    }
    throw err;
  }
}

function getDefaultErrorMessage(status) {
  switch (status) {
    case 400: return 'Invalid input provided.';
    case 401: return 'Authentication required. Please sign in.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'Requested resource not found.';
    case 500: return 'Internal server error occurred. Please try again.';
    default: return 'An unexpected error occurred.';
  }
}

export const api = {
  login: (usernameOrEmail, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password })
    }),

  register: (username, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    }),

  fetchPosts: (page = 0, size = 20) =>
    request(`/posts?page=${page}&size=${size}`),

  fetchCommunities: () =>
    request('/communities'),

  createPost: (data) =>
    request('/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  createCommunity: (data) =>
    request('/communities', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  votePost: (postId, value) =>
    request(`/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value })
    }),

  fetchComments: (postId) =>
    request(`/posts/${postId}/comments`),

  addComment: (postId, content) =>
    request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  getProfile: () =>
    request('/users/me'),

  updateProfile: (bio, avatarUrl) =>
    request('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ bio, avatarUrl })
    }),

  changePassword: (currentPassword, newPassword) =>
    request('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    })
};
