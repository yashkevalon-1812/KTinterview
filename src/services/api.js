// Determine backend URL:
// 1. Checks VITE_API_URL or VITE_BACKEND_URL (set on Render environment)
// 2. In production or onrender.com host, defaults to https://ktinterview-b.onrender.com
// 3. In local dev, falls back to empty string so Vite proxy (/api -> http://localhost:5000) handles it seamlessly
const isRenderHost = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');

const rawBackend = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.PROD || isRenderHost ? 'https://ktinterview-b.onrender.com' : '')
)?.trim().replace(/\/+$/, '') || '';

export const BACKEND_URL = rawBackend;
export const API_BASE = rawBackend 
  ? (rawBackend.endsWith('/api') ? rawBackend : `${rawBackend}/api`) 
  : '/api';

// Helper to convert relative /uploads/... links to absolute backend URLs on Render
export const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const base = BACKEND_URL || (isRenderHost ? 'https://ktinterview-b.onrender.com' : '');
  return `${base}${cleanPath}`;
};

// Helper to sanitize candidate object resume links
const normalizeCandidate = (cand) => {
  if (!cand) return cand;
  if (cand.resumeLink && !cand.resumeLink.startsWith('http') && !cand.resumeLink.startsWith('data:')) {
    return {
      ...cand,
      resumeLink: getFileUrl(cand.resumeLink)
    };
  }
  return cand;
};

export const api = {
  BACKEND_URL,
  API_BASE,
  getFileUrl,

  // Unified Single Login
  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (data.user && data.user.candidateProfile) {
      data.user.candidateProfile = normalizeCandidate(data.user.candidateProfile);
    }
    return data;
  },

  // Unified Single Registration
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (resData.user && resData.user.candidateProfile) {
      resData.user.candidateProfile = normalizeCandidate(resData.user.candidateProfile);
    }
    return resData;
  },

  // Fetch Candidates
  async getCandidates(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/candidates?${query}`);
    const data = await res.json();
    if (data.candidates && Array.isArray(data.candidates)) {
      data.candidates = data.candidates.map(normalizeCandidate);
    }
    return data;
  },

  // Update Candidate
  async updateCandidate(id, updateData) {
    const res = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (data.candidate) {
      data.candidate = normalizeCandidate(data.candidate);
    }
    return data;
  },

  // Submit Feedback
  async submitFeedback(id, feedbackData) {
    const res = await fetch(`${API_BASE}/candidates/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    const data = await res.json();
    if (data.candidate) {
      data.candidate = normalizeCandidate(data.candidate);
    }
    return data;
  },

  // Get Interviewers
  async getInterviewers() {
    const res = await fetch(`${API_BASE}/interviewers`);
    return await res.json();
  },

  // Get Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return await res.json();
  },

  // Get Dynamic Master Departments & Domains from MongoDB
  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`);
    return await res.json();
  },

  // Save / Update Department in MongoDB
  async saveDepartment(data) {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
};
