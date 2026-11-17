import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";

let globalAlertListener = null;

// Override window.alert globally
window.alert = (message) => {
  if (globalAlertListener) {
    globalAlertListener(message);
  } else {
    console.warn("Global alert fired before Toast component mounted:", message);
  }
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    globalAlertListener = (message) => {
      const id = Math.random().toString(36).substr(2, 9);
      const isError = /error|fail|invalid|wrong|incorrect|reject|taken/i.test(message);
      setToasts((prev) => [...prev, { id, message, type: isError ? "error" : "success" }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    return () => {
      globalAlertListener = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[360px] pointer-events-none">
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      {toasts.map((toast) => {
        const isError = toast.type === "error";
        const accentColor = isError ? "bg-red-500" : "bg-emerald-500";
        const icon = isError 
          ? <FaExclamationCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
          : <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-4 pl-6 pr-5 py-4 border border-slate-100 bg-white/95 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl animate-slideInRight relative overflow-hidden w-full"
          >
            {/* Premium Left Accent Border */}
            <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${accentColor}`} />

            {icon}
            
            <div className="flex-1 min-w-0">
              <span className={`block text-[0.6rem] font-black uppercase tracking-[0.2em] mb-0.5 ${isError ? "text-red-500" : "text-emerald-500"}`}>
                {isError ? "Notification Error" : "Success Alert"}
              </span>
              <p className="text-[0.75rem] font-medium text-slate-700 leading-snug">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 mt-0.5"
            >
              <FaTimes size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
