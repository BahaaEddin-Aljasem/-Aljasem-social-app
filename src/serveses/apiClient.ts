import axios from "axios";
import { baseUrl } from "../const/environment";

export const AUTH_TOKEN_KEY = "route-posts-token";

const apiClient = axios.create({
  baseURL: baseUrl,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return config;

  config.headers.token = token;
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
