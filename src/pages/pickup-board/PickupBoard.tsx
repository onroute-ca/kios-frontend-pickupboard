import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, Clock, Volume2, VolumeX } from "lucide-react";
import logo from "../../assets/onroute-logo.svg";
import { IconBtn } from "../../components/CustomButton";
import { useWebSocket } from "../../hooks/useWebSocket";
import { playNewOrderSound } from "../../utils/sound";

const PickupBoard: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const {
    orders,
    isConnected,
    connectionStatus,
    reconnectAttempt,
    maxReconnectAttempts,
    reconnect,
  } = useWebSocket({
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
        <div className="flex h-20 items-center">
          <img src={logo} alt="Onroute" className="h-16 w-auto object-contain" />
        </div>

        {/* Dynamic decorative elements */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={connectionStatus === "failed" ? reconnect : undefined}
            disabled={connectionStatus !== "failed"}
            title={connectionStatus === "failed" ? "Tap to reconnect" : undefined}
            className={`flex h-[52px] items-center gap-3 rounded-full border px-6 py-3 ${
              isConnected
                ? "border-[var(--project-primary-bg-light)] bg-[var(--project-primary-light)]"
                : connectionStatus === "failed"
                  ? "cursor-pointer border-red-100 bg-red-50"
                  : "border-amber-100 bg-amber-50"
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full ${
                isConnected
                  ? "bg-brand"
                  : connectionStatus === "failed"
                    ? "bg-red-500"
                    : "animate-pulse bg-amber-500"
              }`}
            />
            <span
              className={`text-lg font-extrabold tracking-widest uppercase ${
                isConnected
                  ? "text-brand-hover"
                  : connectionStatus === "failed"
                    ? "text-red-600"
                    : "text-amber-600"
              }`}
            >
              {connectionStatus === "connected" && "Live"}
              {connectionStatus === "connecting" && "Connecting"}
              {connectionStatus === "reconnecting" &&
                `Reconnecting ${reconnectAttempt}/${maxReconnectAttempts}`}
              {connectionStatus === "failed" && "Offline · Retry"}
            </span>
          </button>
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
              <div className="grid grid-cols-4 gap-3">
                {inProgressOrders.map((order) => {
                  return (
                    <div
                      key={order.orderId}
                      className="border-primary-border flex min-w-0 items-center justify-center rounded-xl border bg-white py-7 shadow-sm"
                    >
                      <span className="text-4xl font-bold tracking-tight text-[#0f172a]">
                        {order.orderNo ?? order.orderId}
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
              <div className="grid grid-cols-4 gap-3">
                {readyOrders.map((order) => {
                  return (
                    <div
                      key={order.orderId}
                      className="border-primary-border relative flex flex-col items-center justify-center overflow-hidden rounded-xl border bg-white p-8 py-7 shadow-sm"
                    >
                      {/* Decorative Color Wave Background */}
                      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-1/2 opacity-[0.08]">
                        <svg
                          viewBox="0 0 1440 320"
                          preserveAspectRatio="none"
                          className="h-full w-full"
                        >
                          <path
                            fill="currentColor"
                            className="text-brand"
                            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                          ></path>
                        </svg>
                      </div>

                      <span className="text-brand-hover relative z-10 text-4xl font-black tracking-tighter">
                        {order.orderNo ?? order.orderId}
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
