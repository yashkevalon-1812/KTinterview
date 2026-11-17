const API_BASE = '/api';

export const api = {
  // Unified Single Login
  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return await res.json();
  },

  // Unified Single Registration
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // Fetch Candidates
  async getCandidates(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/candidates?${query}`);
    return await res.json();
  },

  // Update Candidate
  async updateCandidate(id, updateData) {
    const res = await fetch(`${API_BASE}/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    return await res.json();
  },

  // Submit Feedback
  async submitFeedback(id, feedbackData) {
    const res = await fetch(`${API_BASE}/candidates/${id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    return await res.json();
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
