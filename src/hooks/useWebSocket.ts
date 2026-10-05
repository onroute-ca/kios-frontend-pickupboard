import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../store/hooks";
import { Client } from "@stomp/stompjs";

export interface LivePickupOrder {
  orderId: number;
  orderNo: number;
  storeId: number;
  guestName: string;
  displayStatus: "IN_PROGRESS" | "READY" | string;
  placedAt: number; // Internal timestamp for elapsed time
}

const WS_URL = "wss://api-dev.onroute.ca/user-service/ws";

interface UseWebSocketOptions {
  onNewOrder?: () => void;
  onOrderReady?: () => void;
}

export const useWebSocket = (options?: UseWebSocketOptions) => {
  const [orders, setOrders] = useState<Map<number, LivePickupOrder>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const auth = useAppSelector((state) => state.auth);
  const storeId = auth.storeId?.toString() || "6100131";
  const token = auth.authToken;

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        console.log("Connected to STOMP WebSocket (Display)");

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

                    if (!existing && optionsRef.current?.onNewOrder) {
                      optionsRef.current.onNewOrder();
                    }

                    newMap.set(orderData.orderId, {
                      ...orderData,
                      displayStatus: "IN_PROGRESS",
                      placedAt: existing?.placedAt || Date.now(),
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
                        placedAt: Date.now(),
                      });
                    }
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
      onDisconnect: () => setIsConnected(false),
      onWebSocketClose: () => setIsConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [storeId, token]);

  const clearAll = () => {
    if (window.confirm("Are you sure you want to clear all orders?")) {
      setOrders(new Map());
    }
  };

  return {
    orders,
    isConnected,
    clearAll,
  };
};
