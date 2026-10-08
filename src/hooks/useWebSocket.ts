/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../store/hooks";
import { Client } from "@stomp/stompjs";
import { useGetActiveOrdersList } from "../services";
import { Order } from "../types/order";

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL as string | undefined;

// Reconnect tuning: exponential backoff (1s, 2s, 4s ... capped at 30s) with jitter
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;
const CONNECTION_TIMEOUT = 10000;

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "failed";

const getReconnectDelay = (attempt: number) => {
  const backoff = Math.min(RECONNECT_BASE_DELAY * 2 ** (attempt - 1), RECONNECT_MAX_DELAY);
  return backoff + Math.random() * 1000;
};

interface UseWebSocketOptions {
  onNewOrder?: () => void;
  onOrderReady?: () => void;
}

export const useWebSocket = (options?: UseWebSocketOptions) => {
  const [orders, setOrders] = useState<Map<number, Order>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const clientRef = useRef<Client | null>(null);
  const reconnectRef = useRef<() => void>(() => {});
  const collectedOrderIdsRef = useRef<Set<number>>(new Set());
  const locallyFiredOrderIdsRef = useRef<Set<number>>(new Set());
  const isConnected = connectionStatus === "connected";

  const auth = useAppSelector((state) => state.auth);
  const storeId = auth.storeId?.toString() || "6100131";
  const token = auth.authToken;

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const {
    data: activeOrdersData,
    isLoading: isLoadingOrders,
    refetch,
  } = useGetActiveOrdersList(storeId);

  useEffect(() => {
    if (activeOrdersData?.orders) {
      setOrders((prev) => {
        const newMap = new Map<number, Order>();

        // 1. Apply authoritative API data
        activeOrdersData.orders.forEach((apiOrder) => {
          if (!collectedOrderIdsRef.current.has(apiOrder.orderId)) {
            const existingLocal = prev.get(apiOrder.orderId);
            // Protect local READY state if WS delivered it before REST API caught up
            const isLocalAdvanced =
              existingLocal?.displayStatus === "READY" && apiOrder.displayStatus === "IN_PROGRESS";

            newMap.set(apiOrder.orderId, {
              ...apiOrder,
              displayStatus: isLocalAdvanced ? "READY" : apiOrder.displayStatus,
            });
          }
        });

        // 2. Preserve orders freshly fired via WebSocket that aren't in the REST snapshot yet
        locallyFiredOrderIdsRef.current.forEach((id) => {
          if (!newMap.has(id) && prev.has(id) && !collectedOrderIdsRef.current.has(id)) {
            newMap.set(id, prev.get(id)!);
          }
        });

        return newMap;
      });
    }
  }, [activeOrdersData]);

  useEffect(() => {
    if (!WS_URL) {
      console.error("VITE_WEBSOCKET_URL is not configured");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConnectionStatus("failed");
      return;
    }

    let attempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
    };

    // Tear down the current socket (if any) and open a fresh one
    const restart = async () => {
      await client.deactivate();
      if (!disposed) client.activate();
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer) return;

      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`WebSocket reconnect attempt ${attempts} (capped delay)`);
      }

      attempts += 1;
      const delay = getReconnectDelay(attempts);
      setReconnectAttempt(attempts);
      setConnectionStatus("reconnecting");
      console.warn(
        `WebSocket disconnected. Reconnect attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(delay)}ms`,
      );

      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        restart();
      }, delay);
    };

    // Manual / event-driven reconnect: resets the attempt counter and retries immediately
    const reconnectNow = () => {
      if (disposed || client.connected) return;
      refetch().catch(console.error);
      clearReconnectTimer();
      attempts = 0;
      setReconnectAttempt(0);
      setConnectionStatus("connecting");
      restart();
    };
    reconnectRef.current = reconnectNow;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      // Built-in fixed-delay reconnect is disabled; backoff is handled by scheduleReconnect
      reconnectDelay: 0,
      connectionTimeout: CONNECTION_TIMEOUT,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        clearReconnectTimer();
        attempts = 0;
        setReconnectAttempt(0);
        setConnectionStatus("connected");
        console.log("Connected to STOMP WebSocket (Display)");

        refetch().catch(console.error);

        client.subscribe(`/topic/stores/${storeId}/orderUpdates/display`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.events && Array.isArray(payload.events)) {
              payload.events.forEach((evt: any) => {
                if (evt.eventType === "ORDER_FIRED" && evt.order) {
                  setOrders((prev) => {
                    const newMap = new Map(prev);
                    const orderData = evt.order;
                    const existing = newMap.get(orderData.orderId);

                    locallyFiredOrderIdsRef.current.add(orderData.orderId);
                    if (!existing && optionsRef.current?.onNewOrder) {
                      optionsRef.current.onNewOrder();
                    }

                    newMap.set(orderData.orderId, {
                      ...orderData,
                      displayStatus: "IN_PROGRESS",
                    });
                    return newMap;
                  });
                } else if (evt.eventType === "ORDER_PROCESSED" && evt.order) {
                  setOrders((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(evt.order.orderId);

                    if (!existing || existing.displayStatus !== "READY") {
                      if (optionsRef.current?.onOrderReady) {
                        optionsRef.current.onOrderReady();
                      }
                    }

                    if (existing) {
                      newMap.set(evt.order.orderId, {
                        ...existing,
                        ...evt.order,
                        displayStatus: "READY",
                      });
                    } else {
                      newMap.set(evt.order.orderId, {
                        ...evt.order,
                        displayStatus: "READY",
                      });
                    }
                    return newMap;
                  });
                } else if (evt.eventType === "ORDER_COLLECTED" && evt.order) {
                  collectedOrderIdsRef.current.add(evt.order.orderId);

                  setOrders((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(evt.order.orderId);
                    return newMap;
                  });
                }
              });
            }
          } catch (err) {
            console.error("Failed to parse message", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame.headers["message"], frame.body);
      },
      onWebSocketClose: () => {
        // client.active is false when we closed it ourselves (unmount / restart)
        if (disposed || !client.active) return;
        scheduleReconnect();
      },
    });

    // Retry right away when the network comes back or the tab becomes visible again
    const handleOnline = () => reconnectNow();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") reconnectNow();
    };
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    setConnectionStatus("connecting");
    client.activate();
    clientRef.current = client;

    return () => {
      disposed = true;
      clearReconnectTimer();
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
      client.deactivate();
    };
  }, [storeId, token, refetch]);

  const reconnect = () => reconnectRef.current();

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all orders?")) {
      setOrders(new Map());
    }
  };

  return {
    orders,
    isLoadingOrders,
    isConnected,
    connectionStatus,
    reconnectAttempt,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnect,
    clearAll,
  };
};
