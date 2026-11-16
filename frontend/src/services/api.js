import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('viora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const loginUser = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  if (data.token) localStorage.setItem('viora_token', data.token);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const structureCaseSheet = async (payload) => {
  const { data } = await api.post('/case/structure', payload);
  return data;
};

export const getClinicalQuestions = async (payload) => {
  const { data } = await api.post('/case/questions', payload);
  return data;
};

export const getAllCases = async () => {
  const { data } = await api.get('/case/all');
  return data;
};

export const verifyCaseSheet = async (caseId, payload) => {
  const { data } = await api.put(`/case/${caseId}/verify`, payload);
  return data;
};
