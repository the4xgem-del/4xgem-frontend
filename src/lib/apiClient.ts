import axios, { AxiosError } from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send/receive httpOnly access/refresh cookies
  timeout: 15_000,
});

let csrfToken: string | null = null;

async function fetchCsrfToken(): Promise<string> {
  const { data } = await apiClient.get<{ data: { csrfToken: string } }>("/csrf-token");
  csrfToken = data.data.csrfToken;
  return csrfToken;
}

// Attach the CSRF token to every mutating request (cookie-based sessions only).
apiClient.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    config.headers.set("x-csrf-token", csrfToken ?? (await fetchCsrfToken()));
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;

// On a 401 (expired access token), attempt exactly one silent refresh and
// replay the original request. If refresh also fails, surface the 401 so
// AuthContext can redirect to login.
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !(original as { _retried?: boolean })._retried) {
      (original as { _retried?: boolean })._retried = true;
      try {
        refreshPromise ??= apiClient.post("/auth/refresh").then(() => undefined);
        await refreshPromise;
        refreshPromise = null;
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorShape {
  error: { code: string; message: string; details?: unknown };
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    return data?.error?.message ?? fallback;
  }
  return fallback;
}
