import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { orderApiService } from "../../api/api";
import { ActiveOrdersResponse } from "../../types/order";

export const getActiveOrders = async (storeId: number | string): Promise<ActiveOrdersResponse> => {
  const response = await orderApiService.get(`/stores/${storeId}/orders/active`);
  return response.data;
};

export const useGetActiveOrdersList = (
  storeId: number | string | null,
): UseQueryResult<ActiveOrdersResponse, Error> => {
  return useQuery({
    queryKey: ["active-orders-list", storeId],
    queryFn: () => getActiveOrders(storeId!),
    retry: 3,
    gcTime: 0,
    enabled: !!storeId,
  });
};

