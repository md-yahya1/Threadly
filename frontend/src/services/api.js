const API_BASE = 'http://localhost:8080/api';

const TOKEN_KEY = 'forumhub_token';
const USER_KEY = 'forumhub_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(endpoint, options = {}) {
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
    })
};
