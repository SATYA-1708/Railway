import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'railflow_auth_token';
const USER_KEY = 'railflow_auth_user';

export const authService = {
  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Authentication failed');
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};
