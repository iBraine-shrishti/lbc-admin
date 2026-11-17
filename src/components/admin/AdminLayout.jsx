import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import AdminSidebar from "./AdminSidebar";
import OrderNotificationToast from "./OrderNotificationToast";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#FECD08] selection:text-[#212121] relative">
      {/* Mobile Drawer Dark Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[95] md:hidden transition-opacity"
        />
      )}

      {/* Mobile Top Header with Menu Button */}
      <div className="fixed top-0 left-0 right-0 h-[56px] bg-[#181818]/95 backdrop-blur-md border-b border-white/10 z-[90] flex md:hidden items-center justify-between px-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-9 h-9 rounded-xl bg-[#242424] hover:bg-[#FECD08] hover:text-[#212121] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
          title="Open Menu"
        >
          <FaBars size={15} />
        </button>
        <img
          src="/images/lbcmoto-logo.png"
          alt="LBC Moto"
          className="h-7 w-auto object-contain"
        />
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Admin Sidebar with Click to Open & Click to Close */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <OrderNotificationToast />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out box-border p-[40px] max-md:p-[16px] max-md:pt-[64px] ${
          isCollapsed
            ? "ml-[80px] w-[calc(100%-80px)]"
            : "ml-[280px] w-[calc(100%-280px)]"
        } max-md:!ml-0 max-md:!w-full`}
      >
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;