import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingBag,
  FaTimes,
  FaVolumeUp,
  FaVolumeMute,
  FaArrowRight,
  FaCheckCircle,
  FaBell,
  FaVial
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- WEB AUDIO API SIREN GENERATOR ---
// Generates an authentic, attention-grabbing dual-phase siren alert
const playOrderSiren = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Main Siren Oscillator (Filtered sawtooth for authentic siren horn acoustics)
    const oscMain = ctx.createOscillator();
    const gainMain = ctx.createGain();
    oscMain.type = "sawtooth";

    // Warm Lowpass Filter (creates rich acoustic siren resonance without harsh digital bite)
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1900, now);

    // Siren pitch modulation (2 energetic cycles: 650Hz -> 1150Hz -> 650Hz -> 1150Hz -> 450Hz)
    oscMain.frequency.setValueAtTime(650, now);
    oscMain.frequency.linearRampToValueAtTime(1150, now + 0.22);
    oscMain.frequency.linearRampToValueAtTime(650, now + 0.44);
    oscMain.frequency.linearRampToValueAtTime(1150, now + 0.66);
    oscMain.frequency.exponentialRampToValueAtTime(450, now + 0.95);

    // Gain envelope: fast punchy attack, sustained sirens, smooth finish
    gainMain.gain.setValueAtTime(0.01, now);
    gainMain.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gainMain.gain.setValueAtTime(0.35, now + 0.82);
    gainMain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

    oscMain.connect(filter);
    filter.connect(gainMain);
    gainMain.connect(ctx.destination);

    oscMain.start(now);
    oscMain.stop(now + 1.05);

    // Sub-harmonic sine oscillator for deep body and presence
    const oscSub = ctx.createOscillator();
    const gainSub = ctx.createGain();
    oscSub.type = "sine";

    oscSub.frequency.setValueAtTime(325, now);
    oscSub.frequency.linearRampToValueAtTime(575, now + 0.22);
    oscSub.frequency.linearRampToValueAtTime(325, now + 0.44);
    oscSub.frequency.linearRampToValueAtTime(575, now + 0.66);
    oscSub.frequency.exponentialRampToValueAtTime(225, now + 0.95);

    gainSub.gain.setValueAtTime(0.01, now);
    gainSub.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gainSub.gain.setValueAtTime(0.25, now + 0.82);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

    oscSub.connect(gainSub);
    gainSub.connect(ctx.destination);

    oscSub.start(now);
    oscSub.stop(now + 1.05);
  } catch (err) {
    console.warn("Could not play order siren audio:", err);
  }
};

const OrderNotificationToast = () => {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("admin_order_chime_muted") === "true";
  });
  const [hasDesktopPermission, setHasDesktopPermission] = useState(() => {
    return typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
  });

  const lastSeenIdRef = useRef(null);
  const isInitialMountRef = useRef(true);

  // Sync mute setting
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("admin_order_chime_muted", String(next));
      return next;
    });
  };

  // Request browser desktop notification permission
  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setHasDesktopPermission(perm === "granted");
      if (perm === "granted") {
        new Notification("LBC Moto Admin Notifications Active", {
          body: "You will now receive desktop alerts whenever a customer places an order!",
          icon: "/images/lbcmoto-logo.png",
        });
      }
    }
  };

  // Add toast helper
  const addOrderToast = (order) => {
    const toastId = `order-${order.id}-${Date.now()}`;
    const newToast = {
      toastId,
      order,
      time: "Just now",
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible

    // Play siren sound if not muted
    if (!isMuted) {
      playOrderSiren();
    }

    // Trigger Browser Desktop Notification if allowed
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`🎉 New Order #${order.id} Placed!`, {
          body: `${order.full_name} placed an order for ₹${order.total_price} (${order.items_count} items)`,
          icon: "/images/lbcmoto-logo.png",
        });
      } catch (e) {
        console.warn("Desktop notification trigger failed:", e);
      }
    }

    // Auto dismiss after 14 seconds
    setTimeout(() => {
      removeToast(toastId);
    }, 14000);
  };

  const removeToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const handleViewOrder = (orderId, toastId) => {
    removeToast(toastId);
    navigate(`/react-admin/orders/${orderId}`);
  };

  // Trigger a test alert to verify sound and UI
  const triggerTestAlert = () => {
    addOrderToast({
      id: 9999,
      full_name: "Rahul Sharma (Test)",
      city: "Mumbai, MH",
      total_price: "2499.00",
      is_paid: true,
      status: "Processing",
      items_count: 2,
      items_preview: "1x Mototech Tourer Tank Bag, 1x Rain Cover",
    });
  };

  // Polling loop for new orders
  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    if (!token) return;

    // Read stored last seen order id
    const storedLastId = localStorage.getItem("admin_last_notified_order_id");
    if (storedLastId && !isNaN(parseInt(storedLastId))) {
      lastSeenIdRef.current = parseInt(storedLastId);
    }

    const checkNewOrders = async () => {
      try {
        const activeToken = localStorage.getItem("orm_admin_token");
        if (!activeToken) return;

        const res = await fetch(`${BASE_URL}/api/orders/latest-alerts/`, {
          headers: {
            Authorization: `Token ${activeToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const latestId = data.latest_id;
        const orders = data.orders || [];

        // On first run: record the highest order ID so we don't alert old past orders
        if (isInitialMountRef.current) {
          isInitialMountRef.current = false;
          if (latestId && (!lastSeenIdRef.current || latestId > lastSeenIdRef.current)) {
            lastSeenIdRef.current = latestId;
            localStorage.setItem("admin_last_notified_order_id", String(latestId));
          }
          return;
        }

        // On subsequent ticks: detect genuine new incoming orders
        if (latestId && lastSeenIdRef.current && latestId > lastSeenIdRef.current) {
          const newOrders = orders.filter((o) => o.id > lastSeenIdRef.current);

          // Update tracked latest ID
          lastSeenIdRef.current = latestId;
          localStorage.setItem("admin_last_notified_order_id", String(latestId));

          // Trigger toast alert for each new order (newest first)
          newOrders.reverse().forEach((ord) => {
            addOrderToast(ord);
          });
        }
      } catch (err) {
        console.warn("[ORDER ALERT POLL] Check failed:", err);
      }
    };

    // Initial check
    checkNewOrders();

    // Poll every 15 seconds
    const interval = setInterval(checkNewOrders, 15000);

    return () => clearInterval(interval);
  }, [isMuted]);

  return (
    <>
      {/* Discreet Audio & Desktop Notification Floating Control Bar */}
      <div className="fixed bottom-4 right-4 z-[9990] flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-700/60 text-[0.7rem] font-semibold">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Alerts</span>
        </span>

        <span className="text-slate-600">|</span>

        {/* Sound toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? "Unmute Order Alert Siren" : "Mute Order Alert Siren"}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
            isMuted ? "text-slate-400 hover:text-white" : "text-amber-300 hover:text-amber-200"
          }`}
        >
          {isMuted ? <FaVolumeMute size={11} /> : <FaVolumeUp size={11} />}
          <span className="text-[0.65rem]">{isMuted ? "Muted" : "Siren ON"}</span>
        </button>

        {/* Desktop notification opt-in if not yet enabled */}
        {!hasDesktopPermission && (
          <>
            <span className="text-slate-600">|</span>
            <button
              onClick={requestDesktopPermission}
              title="Enable Desktop Push Notifications"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <FaBell size={10} />
              <span className="text-[0.65rem]">Desktop Alerts</span>
            </button>
          </>
        )}
      </div>

      {/* Floating Order Toast Notifications Container */}
      <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-3 w-full max-w-[420px] pointer-events-none">
        <style>{`
          @keyframes orderToastSlideIn {
            0% {
              transform: translateX(120%) scale(0.9);
              opacity: 0;
            }
            70% {
              transform: translateX(-4px) scale(1.02);
              opacity: 1;
            }
            100% {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
          }
          .animate-order-toast {
            animation: orderToastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {toasts.map((toast) => {
          const { toastId, order, time } = toast;
          const formattedTotal = Number(order.total_price || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          });

          return (
            <div
              key={toastId}
              className="pointer-events-auto bg-slate-950 text-white rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_25px_rgba(228,44,67,0.25)] border border-slate-800/80 p-4 relative overflow-hidden animate-order-toast backdrop-blur-2xl transition-all hover:scale-[1.01]"
            >
              {/* Left Accent Bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-emerald-400 via-[#FECD08] to-amber-400" />

              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <FaShoppingBag size={12} />
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-[0.62rem] font-black uppercase tracking-wider text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      NEW ORDER RECEIVED!
                    </span>
                    <span className="text-[0.62rem] text-slate-400">{time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold tracking-wide bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {order.is_paid ? "PAID" : "COD"}
                  </span>
                  <button
                    onClick={() => removeToast(toastId)}
                    className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                    title="Dismiss"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              </div>

              {/* Order Info */}
              <div className="mb-3">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-sm font-bold text-white tracking-tight">
                    Order #{order.id}
                  </div>
                  <div className="text-base font-extrabold text-emerald-400 font-mono">
                    ₹{formattedTotal}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-200 truncate">
                  {order.full_name} {order.city ? `• ${order.city}` : ""}
                </div>

                {order.items_preview ? (
                  <div className="text-[0.72rem] text-slate-400 truncate mt-0.5" title={order.items_preview}>
                    {order.items_preview}
                  </div>
                ) : (
                  <div className="text-[0.72rem] text-slate-400 mt-0.5">
                    {order.items_count || 1} item(s) ordered
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleViewOrder(order.id, toastId)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FECD08] hover:bg-[#c9253a] text-white py-2 px-3 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-[#FECD08]/30 active:scale-95 cursor-pointer"
                >
                  <span>View Order Details</span>
                  <FaArrowRight size={10} />
                </button>
                <button
                  onClick={() => removeToast(toastId)}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default OrderNotificationToast;
