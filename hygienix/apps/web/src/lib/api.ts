import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor: aggiungi token
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: gestione token scaduto
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as typeof error.config & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            originalRequest!.headers!.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest!);
          } catch {
            // Refresh fallito → logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined') window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  get instance() { return this.client; }

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

  async delete<T>(url: string): Promise<T> {
    const { data } = await this.client.delete(url);
    return data;
  }

  async upload<T>(url: string, formData: FormData): Promise<T> {
    const { data } = await this.client.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }
}

export const api = new ApiClient();
export default api;

// ─── API ERROR HELPER ─────────────────────────────────────────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message || error.message || 'Errore di rete';
  }
  if (error instanceof Error) return error.message;
  return 'Errore sconosciuto';
}
