import axios from 'axios';

const API_URL = 'http://localhost:8000/api/finances';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const getTransactions = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`${API_URL}/transactions/?${params}`, getAuthHeaders());
  return res.data.results ? res.data.results : res.data;
};

export const getSummary = async () => {
  const res = await axios.get(`${API_URL}/transactions/summary/`, getAuthHeaders());
  return res.data;
};

export const createTransaction = async (data) => {
  const res = await axios.post(`${API_URL}/transactions/`, data, getAuthHeaders());
  return res.data;
};

export const updateTransaction = async (id, data) => {
  const res = await axios.patch(`${API_URL}/transactions/${id}/`, data, getAuthHeaders());
  return res.data;
};

export const deleteTransaction = async (id) => {
  await axios.delete(`${API_URL}/transactions/${id}/`, getAuthHeaders());
};

export const getCategories = async () => {
  const res = await axios.get(`${API_URL}/categories/`, getAuthHeaders());
  return res.data.results ? res.data.results : res.data;
};