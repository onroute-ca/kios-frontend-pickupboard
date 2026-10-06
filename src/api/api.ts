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

// Catalog Service Axios instance
const apiService = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Apply interceptors to both services
const allApis = [apiService];

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
        if (isRefreshing) {
          // If already refreshing, add to queue
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiInstance(originalRequest);
            })
            .catch((err: unknown) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const authData = store.getState().auth;
          const currentRefreshToken = authData.refreshToken;
          if (!currentRefreshToken) {
            throw new Error("No refresh token available.");
          }

          // Using raw axios to prevent interceptor looping
          const res = await axios.post(
            `${import.meta.env.VITE_AUTH_API_BASE_URL || ""}/v1/user/refresh`,
            {},
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentRefreshToken}`,
                "X-Device-Type": "TABLET",
                ...(authData.kioskSerialNo && { "X-Serial-No": authData.kioskSerialNo }),
              },
            },
          );

          const data = res.data;
          const newToken = data.accessToken;

          if (newToken) {
            store.dispatch(
              loginSuccess({
                authToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresAt: data.accessTokenExpiry,
                refreshTokenExpiresAt: data.refreshTokenExpiry,
                username: data.username,
                storeId: data.storeId,
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

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            isRefreshing = false;
            return apiInstance(originalRequest);
          } else {
            throw new Error("Failed to acquire new token.");
          }
        } catch (refreshError: unknown) {
          // If refresh fails, clear queue and redirect to login
          processQueue(refreshError, null);
          isRefreshing = false;
          console.error("refreshError", refreshError);

          console.error("Session expired. Please login again.");
          toast.error("Session expired. Please login again.");

          setTimeout(() => doLogout(), 3000);
          return Promise.reject(refreshError);
        }
      } else if (error.response?.status === 403) {
        const errorData = error.response?.data as { message?: string } | undefined;
        const errorMessage = errorData?.message || "Permission denied or account inactive.";
        console.error(error, errorMessage);
        toast.error(errorMessage);

        setTimeout(() => doLogout(), 3000);
        return Promise.reject(error);
      } else {
        // Fallback error handler
        console.error("API Error:", error.message);

        const errorData = error.response?.data as { message?: string } | undefined;
        const errorMessage = errorData?.message || error.message || "An unexpected error occurred.";
        // Don't show toast for 404s to avoid spam when checking if resources exist
        if (error.response?.status !== 404) {
          toast.error(errorMessage);
        }

        return Promise.reject(error);
      }
    },
  );
});

export { apiService };
