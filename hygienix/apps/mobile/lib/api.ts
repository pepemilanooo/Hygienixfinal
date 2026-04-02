import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000/api/v1';

class MobileApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');
            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            await SecureStore.setItemAsync('accessToken', data.data.accessToken);
            await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
            error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return this.client(error.config);
          } catch {
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const { data } = await this.client.get(url, { params });
    return data;
  }

  async post<T>(url: string, body?: unknown): Promise<T> {
    const { data } = await this.client.post(url, body);
    return data;
  }

  async patch<T>(url: string, body?: unknown): Promise<T> {
    const { data } = await this.client.patch(url, body);
    return data;
  }

  async uploadPhoto(url: string, photoUri: string, type: string): Promise<unknown> {
    const formData = new FormData();
    formData.append('photos', { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
    formData.append('type', type);
    const { data } = await this.client.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  }
}

export const api = new MobileApiClient();
export default api;

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) return error.response?.data?.error?.message || error.message;
  if (error instanceof Error) return error.message;
  return 'Errore sconosciuto';
}
