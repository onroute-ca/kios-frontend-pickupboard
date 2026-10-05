import { useMutation } from "@tanstack/react-query";
import { apiService } from "../../api/api";
import { LoginPayload, LoginResponse } from "../../types/auth";

// LOGIN API
export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await apiService.post<LoginResponse>(
    "/v1/user/login",
    {
      username: payload.username,
      password: payload.password,
    },
    {
      headers: {
        "X-Device-Type": payload.deviceType,
      },
    },
  );
  return data;
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginApi,
  });
};

// LOGOUT API
export const logoutApi = async (): Promise<{ message: string; timestamp: string }> => {
  const { data } = await apiService.post("/v1/user/logout");
  return data;
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: logoutApi,
  });
};
