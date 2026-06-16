const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const register = async (email, password) => {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

export const getToken = () => localStorage.getItem('tj_token');
export const getUser = () => JSON.parse(localStorage.getItem('tj_user') || 'null');
export const saveAuth = (token, user) => {
  localStorage.setItem('tj_token', token);
  localStorage.setItem('tj_user', JSON.stringify(user));
};
export const logout = () => {
  localStorage.removeItem('tj_token');
  localStorage.removeItem('tj_user');
};
export const isLoggedIn = () => !!getToken();