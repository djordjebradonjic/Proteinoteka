import axios from 'axios';
import { CURRENT_MARKET } from './marketConfig';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || "https://proteinoteka-production.up.railway.app"}/api/v1`,
});

api.interceptors.request.use(config => {
  config.params = { ...config.params, market: CURRENT_MARKET };
  return config;
});

export default api;
