import axios, { AxiosError, type AxiosResponse } from "axios";
import { LOGIN } from "../routes/routes";
import { toast } from "react-toastify";
import { store } from "../store/store";
import { logout, loginSuccess } from "../store/authSlice";

const LOGIN_URL = `${import.meta.env.BASE_URL.replace(/\/$/, "")}${LOGIN}`;

export interface FailedQueueItem {
  resolve: (value: string | PromiseLike<string>) => void;
  reject: (reason?: unknown) => void;
}

// API Service Axios instance
const apiService = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Order Service Axios instance
const orderApiService = axios.create({
  baseURL: import.meta.env.VITE_ORDER_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Apply interceptors to both services
const allApis = [apiService, orderApiService];

// 1. Request Interceptors
allApis.forEach((apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const authToken = store.getState().auth.authToken;

      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }

      return config;
    },
    (error: unknown) => {
      return Promise.reject(error);
    },
  );
});

// 2. Queue logic for token refreshing
let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const doLogout = () => {
  store.dispatch(logout());
  if (window.location.pathname !== LOGIN_URL) {
    window.location.href = LOGIN_URL;
  }
};

// 3. Response Interceptors
allApis.forEach((apiInstance) => {
  apiInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      const responseData = response.data;
      if (
        responseData &&
        typeof responseData === "object" &&
        typeof responseData.code === "string" &&
        (responseData.code.startsWith("CONTROL-CENTER-ERR-") ||
          responseData.code.startsWith("CATALOG-ERR-") ||
          responseData.code.includes("-ERR-"))
      ) {
        const errorMessage =
          responseData.message || responseData.error || `An error occurred (${responseData.code}).`;

        toast.error(errorMessage);

        const errorObj = new Error(errorMessage) as Error & {
          response?: AxiosResponse;
          code?: string;
        };
        errorObj.response = response;
        errorObj.code = responseData.code;

        return Promise.reject(errorObj);
      }
      return response;
    },
    async (error: AxiosError) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalRequest = error.config as any;

      // Check if error is due to token expiration
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await forceTokenRefresh();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiInstance(originalRequest);
        } catch (refreshError: unknown) {
          return Promise.reject(refreshError);
        }
      } else if (error.response?.status === 403) {
        const errorData = error.response?.data as
          { message?: string; detail?: string; title?: string } | undefined;
        const errorMessage =
          errorData?.message || errorData?.detail || errorData?.title || "Permission denied.";
        console.error(error, errorMessage);
        toast.error(errorMessage);

        setTimeout(() => doLogout(), 3000);
        return Promise.reject(error);
      } else {
        // Fallback error handler
        console.error("API Error:", error.message);

        const errorData = error.response?.data as
          { message?: string; detail?: string; title?: string } | undefined;
        const errorMessage =
          errorData?.message ||
          errorData?.detail ||
          errorData?.title ||
          error.message ||
          "An unexpected error occurred.";
        // Don't show toast for 404s to avoid spam when checking if resources exist
        if (error.response?.status !== 404) {
          toast.error(errorMessage);
        }

        return Promise.reject(error);
      }
    },
  );
});

export const forceTokenRefresh = async () => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  const currentRefreshToken = store.getState().auth.refreshToken;

  try {
    const authData = store.getState().auth;
    if (!currentRefreshToken) {
      throw new Error("No refresh token available.");
    }

    const res = await axios.post(
      `${import.meta.env.VITE_AUTH_API_BASE_URL || ""}/user/refresh`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentRefreshToken}`,
          "X-Device-Type": "DISPLAY",
          ...(authData.kioskSerialNo && { "X-Serial-No": authData.kioskSerialNo }),
        },
      },
    );

    const data = res.data;
    const newToken = data.accessToken;

    if (newToken && store.getState().auth.refreshToken === currentRefreshToken) {
      store.dispatch(
        loginSuccess({
          authToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.accessTokenExpiry,
          refreshTokenExpiresAt: data.refreshTokenExpiry,
          username: data.username,
          storeId: data.posStoreId,
          storeName: data.storeName,
          plazaId: data.plazaId,
          plazaName: data.plazaName,
          deviceId: data.deviceId,
          pinpadIp: data.pinpadIp,
          pinpadPort: data.pinpadPort,
          printerIp: data.printerIp,
          printerPort: data.printerPort,
          kioskSerialNo: data.kioskSerialNo,
          idleCarouselTimeout: data.idleCarouselTimeout,
        }),
      );

      processQueue(null, newToken);
      isRefreshing = false;
      return newToken;
    } else {
      throw new Error("Failed to acquire new token.");
    }
  } catch (refreshError: unknown) {
    if (store.getState().auth.refreshToken !== currentRefreshToken) {
      isRefreshing = false;
      throw refreshError;
    }
    processQueue(refreshError, null);
    isRefreshing = false;
    console.error("Session expired. Please login again.");
    toast.error("Session expired. Please login again.");

    setTimeout(() => doLogout(), 3000);
    throw refreshError;
  }
};

export { apiService, orderApiService };
