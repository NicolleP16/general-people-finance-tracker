import api from '../api/axios';

const BASE = '/finances/dashboard';

export const getSummary = (month, year) =>
  api.get(`${BASE}/summary/`, { params: { month, year } }).then((response) => response.data);

export const getMonthlyFlow = (month, year, months = 6) =>
  api
    .get(`${BASE}/monthly-flow/`, { params: { month, year, months } })
    .then((response) => response.data);

export const getBudgetStatus = (month, year) =>
  api
    .get(`${BASE}/budget-status/`, { params: { month, year } })
    .then((response) => response.data);

export const getExpensesByCategory = (month, year) =>
  api
    .get(`${BASE}/expenses-by-category/`, { params: { month, year } })
    .then((response) => response.data);

export const getRecentTransactions = (limit = 5) =>
  api
    .get('/finances/transactions/', { params: { page_size: limit } })
    .then((response) => response.data.results);
