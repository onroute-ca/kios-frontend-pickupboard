import axios, { AxiosError, type AxiosResponse } from "axios";
import { toast } from "react-toastify";

const authServiceApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptors: Business error toasts without blocking or auto-redirecting public auth calls
authServiceApi.interceptors.response.use(
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
        responseData.message ||
        responseData.detail ||
        responseData.error ||
        `An error occurred (${responseData.code}).`;
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
  (error: AxiosError) => {
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
  },
);

export { authServiceApi };
