import React, { useState, useEffect, useRef } from "react";
import { Utensils, CheckCircle2, Clock, Volume2, VolumeX } from "lucide-react";
import { IconBtn } from "../../components/CustomButton";
import { useWebSocket } from "../../hooks/useWebSocket";
import { playNewOrderSound } from "../../utils/sound";

const PickupBoard: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const { orders, isConnected } = useWebSocket({
    onOrderReady: () => {
      if (soundEnabledRef.current) playNewOrderSound();
    },
  });

  const ordersList = Array.from(orders.values());
  const inProgressOrders = ordersList.filter((o) => o.displayStatus === "IN_PROGRESS");
  const readyOrders = ordersList.filter((o) => o.displayStatus === "READY");

  return (
    <div className="text-primary-text flex min-h-screen flex-col bg-[#f8f9fa] font-sans">
      {/* Header - Scaled up for 1080p display from a distance */}
      <header className="border-primary-border flex shrink-0 items-center justify-between border-b bg-white px-8 py-6">
        <div className="flex items-center gap-6">
          <div className="bg-brand flex h-20 w-20 items-center justify-center rounded-xl">
            <Utensils className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-primary-text text-5xl leading-tight font-extrabold tracking-tight">
              Order Status
            </h1>
          </div>
        </div>

        {/* Dynamic decorative elements */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-[52px] items-center gap-3 rounded-full border px-6 py-3 ${isConnected ? "border-[var(--project-primary-bg-light)] bg-[var(--project-primary-light)]" : "border-red-100 bg-red-50"}`}
          >
            <div
              className={`h-4 w-4 rounded-full ${isConnected ? "bg-brand" : "bg-red-500"}`}
              title={isConnected ? "Connected to WS" : "Disconnected"}
            />
            <span
              className={`text-lg font-extrabold tracking-widest uppercase ${isConnected ? "text-brand-hover" : "text-red-600"}`}
            >
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>
          <IconBtn
            icon={soundEnabled ? Volume2 : VolumeX}
            title={soundEnabled ? "Mute Sounds" : "Unmute Sounds"}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="!h-[52px] !w-[52px] rounded-full"
            size={28}
          />
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="grid h-[calc(100vh-130px)] flex-1 grid-cols-2 gap-8 overflow-hidden p-8">
        {/* In Progress Column */}
        <section className="border-primary-border flex h-full flex-col overflow-hidden rounded-[10px] border bg-white">
          <div className="border-primary-border flex shrink-0 items-center justify-between border-b bg-white px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-2 rounded-full bg-[#f59e0b]"></div>
              <h2 className="text-primary-text text-4xl font-bold">In Progress</h2>
            </div>
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
                  return (
                    <div
                      key={order.orderId}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="absolute top-0 left-0 h-full w-2 bg-[#f59e0b]"></div>
                      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-50 opacity-60 blur-2xl"></div>
                      <div className="mb-6 flex items-start justify-between">
                        <span className="relative z-10 text-6xl font-extrabold tracking-tight text-gray-900">
                          #{order.orderNo ?? order.orderId}
                        </span>
                      </div>
                      <span className="relative z-10 flex items-center gap-3 text-2xl font-bold text-gray-600">
                        {order.guestName || "Guest"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Ready For Pick Up Column */}
        <section className="border-primary-border flex h-full flex-col overflow-hidden rounded-[10px] border bg-white">
          <div className="border-primary-border flex shrink-0 items-center justify-between border-b bg-white px-6 py-5">
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
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="absolute top-0 left-0 h-full w-2 bg-[#7ab838]"></div>
                      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#eef7ee] opacity-60 blur-2xl"></div>
                      <div className="mb-6 flex items-start justify-between">
                        <span className="relative z-10 text-6xl font-extrabold tracking-tight text-gray-900">
                          #{order.orderNo ?? order.orderId}
                        </span>
                      </div>
                      <span className="relative z-10 flex items-center gap-3 text-2xl font-bold text-gray-600">
                        {order.guestName || "Guest"}
                      </span>
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
