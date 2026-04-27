import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || "https://proteinoteka-production.up.railway.app"}/api/v1`,
});
export default api;