// ──────────────────────────────────────────────
// src/api/auth.js  —  Authentication endpoints
// ──────────────────────────────────────────────
// POST /auth/register   → register
// POST /auth/login      → login
// POST /auth/logout     → logout
// GET  /users/me        → getMe
// ──────────────────────────────────────────────

import { post, get } from './client';

export function register(name, email, password) {
  return post('/auth/register', { name, email, password });
}

export function login(email, password) {
  return post('/auth/login', { email, password });
}

export function logout(refreshToken) {
  return post('/auth/logout', { refreshToken });
}

export function getMe() {
  return get('/users/me');
}
