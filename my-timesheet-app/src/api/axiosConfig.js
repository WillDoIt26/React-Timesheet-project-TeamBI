// src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  // This is correct. It ensures all API calls start with /api.
  baseURL: '/api', 
  withCredentials: true,
});

export default api;