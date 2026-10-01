import React, { useState, useEffect } from "react";
import { Utensils, CheckCircle2, Clock, Monitor } from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";

const getSourceIcon = () => {
  return <Monitor className="text-brand h-6 w-6" />;
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const PickupBoard: React.FC = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { orders, isConnected } = useWebSocket();

  const ordersList = Array.from(orders.values());
  const inProgressOrders = ordersList.filter((o) => o.displayStatus === "IN_PROGRESS");
  const readyOrders = ordersList.filter((o) => o.displayStatus === "READY");

  return (
    <div className="text-primary-text flex min-h-screen flex-col bg-[#f8f9fa] font-sans">
      {/* Header - Scaled up for 1080p display from a distance */}
      <header className="border-primary-border flex shrink-0 items-center justify-between border-b bg-white px-10 py-6">
        <div className="flex items-center gap-6">
          <div className="bg-brand flex h-20 w-20 items-center justify-center rounded-xl shadow-sm">
            <Utensils className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-primary-text text-5xl leading-tight font-extrabold tracking-tight">
              Order Status
            </h1>
          </div>
        </div>

        {/* Dynamic decorative elements */}
        <div className={`flex items-center gap-3 rounded-full border px-6 py-3 ${isConnected ? "border-project-primary-bg-light bg-project-primary-light" : "border-red-100 bg-red-50"}`}>
          <div
            className={`h-4 w-4 rounded-full ${isConnected ? "bg-brand" : "bg-red-500"}`}
            title={isConnected ? "Connected to WS" : "Disconnected"}
          />
          <span className={`text-lg font-extrabold tracking-widest uppercase ${isConnected ? "text-brand-hover" : "text-red-600"}`}>
            {isConnected ? "Live System" : "Offline"}
          </span>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="grid h-[calc(100vh-130px)] flex-1 grid-cols-2 gap-8 overflow-hidden p-8">
        {/* In Progress Column */}
        <section className="border-primary-border flex h-full flex-col overflow-hidden rounded-[10px] border bg-white shadow-sm">
          <div className="border-primary-border flex shrink-0 items-center justify-between border-b bg-white px-8 py-5">
            <h2 className="text-primary-text text-4xl font-bold">In Progress</h2>
            <div className="border-project-primary-bg-light bg-project-primary-light text-brand-hover rounded-md border px-5 py-2 text-xl font-bold">
              {inProgressOrders.length} Orders
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-[#fcfdfc] p-6">
            {inProgressOrders.length === 0 ? (
              <div className="text-muted-text flex h-full flex-col items-center justify-center space-y-4">
                <Clock className="h-16 w-16 opacity-50" />
                <p className="text-3xl font-medium">Waiting for live orders...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {inProgressOrders.map((order) => {
                  const elapsedMs = now - (order.placedAt || now);
                  return (
                    <div
                      key={order.orderId}
                      className="border-primary-border flex flex-col overflow-hidden rounded-[10px] border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between bg-[#fafafa] px-6 py-4">
                        <div className="flex items-center gap-4">
                          <span className="text-primary-text text-5xl font-black">
                            {order.orderNo ?? order.orderId}
                          </span>
                          <div className="border-project-primary-bg-light bg-project-primary-light flex items-center gap-2 rounded-md border px-3 py-1.5">
                            {getSourceIcon()}
                            <span className="text-brand-hover text-lg font-bold tracking-wide uppercase">
                              {order.guestName || "Guest"}
                            </span>
                          </div>
                        </div>
                        <div className="text-brand-hover flex items-center gap-2 font-mono text-2xl font-bold">
                          <Clock className="h-6 w-6" />
                          {formatTime(elapsedMs)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Ready For Pick Up Column */}
        <section className="border-primary-border flex h-full flex-col overflow-hidden rounded-[10px] border bg-white shadow-sm">
          <div className="border-primary-border flex shrink-0 items-center justify-between border-b bg-white px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="bg-brand h-10 w-2 rounded-full"></div>
              <h2 className="text-primary-text text-4xl font-bold">Ready For Pick Up</h2>
            </div>
            <div className="border-project-primary-bg-light bg-project-primary-light text-brand-hover rounded-md border px-5 py-2 text-xl font-bold">
              {readyOrders.length} Orders
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-[#fcfdfc] p-6">
            {readyOrders.length === 0 ? (
              <div className="text-muted-text flex h-full flex-col items-center justify-center space-y-4">
                <CheckCircle2 className="h-16 w-16 opacity-50" />
                <p className="text-3xl font-medium">No ready orders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {readyOrders.map((order) => {
                  return (
                    <div
                      key={order.orderId}
                      className="border-primary-border relative flex flex-col overflow-hidden rounded-[10px] border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                    >
                      {/* Decorative background icon */}
                      <div className="pointer-events-none absolute -top-6 -right-6 opacity-[0.05]">
                        <CheckCircle2 className="text-brand h-48 w-48" strokeWidth={1} />
                      </div>

                      {/* Header */}
                      <div className="relative z-10 flex items-center justify-between bg-[#fafafa] px-6 py-4">
                        <div className="flex items-center gap-4">
                          <span className="text-primary-text text-5xl font-black">
                            {order.orderNo ?? order.orderId}
                          </span>
                          <div className="border-project-primary-bg-light bg-project-primary-light flex items-center gap-2 rounded-md border px-3 py-1.5">
                            {getSourceIcon()}
                            <span className="text-brand-hover text-lg font-bold tracking-wide uppercase">
                              {order.guestName || "Guest"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PickupBoard;

