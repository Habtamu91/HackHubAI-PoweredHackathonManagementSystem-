import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { getApiBaseUrl } from "./urls";

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function unwrap(promise) {
  const response = await promise;
  return response.data.data;
}
