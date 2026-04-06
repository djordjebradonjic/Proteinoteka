import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Proveri da li ti je na backendu port 8080
});

export default api;