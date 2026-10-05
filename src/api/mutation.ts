import { apiService } from "./api";
import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

export const useApiMutationService = <T, V = void>(
  service: AxiosInstance = apiService,
  endpoint: string,
  method: "post" | "put" | "patch" | "delete" = "post",
  options?: UseMutationOptions<T, Error, V>,
): UseMutationResult<T, Error, V> => {
  return useMutation<T, Error, V>({
    mutationFn: async (data) => {
      const isFormData = data instanceof FormData;

      const response = await service.request<T>({
        url: endpoint,
        method,
        data,
        headers: isFormData
          ? { "Content-Type": "multipart/form-data" }
          : { "Content-Type": "application/json" },
      });

      return response.data;
    },
    ...options,
  });
};

