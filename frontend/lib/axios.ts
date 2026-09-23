import axios from 'axios';
import { CURRENT_MARKET } from './marketConfig';
import { CLIENT_API } from './clientApi';

const api = axios.create({
  baseURL: CLIENT_API,
});

api.interceptors.request.use(config => {
  config.params = { ...config.params, market: CURRENT_MARKET };
  return config;
});

export default api;
