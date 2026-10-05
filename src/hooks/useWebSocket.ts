import { useState, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";

export interface LivePickupOrder {
  orderId: number;
  orderNo: number;
  storeId: number;
  pickupTime: string;
  guestName: string;
  displayStatus: "IN_PROGRESS" | "READY" | string;
}

const WS_URL = "ws://localhost:5051/user-service/ws";
const STORE_ID = "6100131";

interface UseWebSocketOptions {
  onOrderReady?: () => void;
}

export const useWebSocket = (options?: UseWebSocketOptions) => {
  const [orders, setOrders] = useState<Map<number, LivePickupOrder>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        console.log("Connected to STOMP WebSocket (Display)");

        client.subscribe(`/topic/stores/${STORE_ID}/orderUpdates/display`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.events && Array.isArray(payload.events)) {
              payload.events.forEach((evt: any) => {
                if (evt.eventType === "ORDER_FIRED" && evt.order) {
                  setOrders((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(evt.order.orderId, {
                      ...evt.order,
                      displayStatus: "IN_PROGRESS",
                    });
                    return newMap;
                  });
                } else if (evt.eventType === "ORDER_PROCESSED" && evt.order) {
                  setOrders((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(evt.order.orderId);

                    if (existing && existing.displayStatus !== "READY") {
                      if (optionsRef.current?.onOrderReady) optionsRef.current.onOrderReady();
                    } else if (!existing) {
                      if (optionsRef.current?.onOrderReady) optionsRef.current.onOrderReady();
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
  }, []);

  return { orders, isConnected };
};
