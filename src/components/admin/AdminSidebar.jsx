import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBox,
  FaShoppingBag,
  FaPenNib,
  FaTags,
  FaUsers,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
  FaChartLine,
  FaUserShield,
  FaQuestionCircle,
  FaFire,
  FaBars,
  FaChevronLeft,
  FaTimes,
} from "react-icons/fa";

const AdminSidebar = ({
  isCollapsed = false,
  toggleSidebar = () => {},
  isMobileOpen = false,
  setIsMobileOpen = () => {},
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState({
    username: "LBC Admin",
    email: "support@lbcmoto.com",
  });

  // SINGLE ACTIVE MENU ACCORDION (When one opens, all others close)
  const [openMenu, setOpenMenu] = useState(() => {
    if (
      location.pathname.includes("/products") ||
      location.pathname.includes("/add-product") ||
      location.pathname.includes("/inventory") ||
      location.pathname.includes("/collections")
    ) {
      return "products";
    }
    if (location.pathname.includes("/orders")) return "orders";
    if (location.pathname.includes("/customers")) return "customers";
    if (location.pathname.includes("/blog")) return "blog";
    return null;
  });

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const storedUser =
      localStorage.getItem("lbc_admin_user") ||
      localStorage.getItem("orm_admin_user");
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (e) {
        // fallback
      }
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("lbc_admin_token");
      localStorage.removeItem("lbc_admin_user");
      localStorage.removeItem("orm_admin_token");
      localStorage.removeItem("orm_admin_user");
      navigate("/admin");
    }
  };

  // Accordion toggle: opening any menu automatically closes all other menus
  const toggleMenu = (menuName) => {
    if (isCollapsed) {
      toggleSidebar();
      setOpenMenu(menuName);
    } else {
      setOpenMenu((prev) => (prev === menuName ? null : menuName));
    }
  };

  const isProductsOpen = openMenu === "products";
  const isOrdersOpen = openMenu === "orders";
  const isCustomersOpen = openMenu === "customers";
  const isBlogOpen = openMenu === "blog";

  return (
    <aside
      className={`bg-slate-100/90 backdrop-blur-2xl border-r border-slate-200/90 flex flex-col fixed h-screen left-0 top-0 z-[100] transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[80px] p-4" : "w-[280px] p-6"
      } ${
        isMobileOpen
          ? "translate-x-0 !w-[280px] !p-6 shadow-2xl"
          : "max-md:-translate-x-full"
      }`}
    >
      {/* SIDEBAR HEADER / TOGGLE */}
      <div className="mb-6 flex items-center justify-between pb-4 border-b border-slate-200/80">
        {!isCollapsed || isMobileOpen ? (
          <>
            <Link to="/react-admin/dashboard" className="block group min-w-0">
              <img
                src="/images/lbcmoto-logo.png"
                alt="LBC Moto Admin"
                className="w-[125px] h-auto block transition-transform duration-500 group-hover:scale-105 object-contain drop-shadow-sm"
              />
              <div className="mt-1 text-[0.62rem] font-black text-slate-800 uppercase tracking-[0.3em] font-heading">
                Admin Console
              </div>
            </Link>

            {/* Desktop Collapse Button */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex w-8 h-8 rounded-xl bg-white hover:bg-[#FECD08] hover:text-[#212121] text-slate-700 items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/60"
              title="Click to Close Sidebar"
            >
              <FaChevronLeft size={11} />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="flex md:hidden w-8 h-8 rounded-xl bg-white text-slate-700 items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/60"
              title="Close Menu"
            >
              <FaTimes size={13} />
            </button>
          </>
        ) : (
          /* Collapsed Header Mode */
          <div className="w-full flex flex-col items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-xl bg-white hover:bg-[#FECD08] hover:text-[#212121] text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-200/80 active:scale-95"
              title="Click to Open Sidebar"
            >
              <FaBars size={14} />
            </button>
            <Link to="/react-admin/dashboard" title="Dashboard">
              <img
                src="/fav-icon.png"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/lbcmoto-logo.png";
                }}
                alt="LBC Moto"
                className="w-8 h-8 object-contain rounded-md"
              />
            </Link>
          </div>
        )}
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto no-scrollbar">
        {(!isCollapsed || isMobileOpen) && (
          <div className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-slate-400 mb-1 px-3">
            Main Menu
          </div>
        )}

        {/* DASHBOARD */}
        <Link
          to="/react-admin/dashboard"
          title="Dashboard"
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 group ${
            isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
          } ${
            isActive("/react-admin/dashboard")
              ? "bg-[#FECD08] text-[#212121] shadow-md shadow-[#FECD08]/30 font-black"
              : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <FaChartLine
            className={`text-base shrink-0 ${
              isActive("/react-admin/dashboard")
                ? "text-[#212121]"
                : "text-slate-600 group-hover:text-black"
            }`}
          />
          {(!isCollapsed || isMobileOpen) && <span>Dashboard</span>}
        </Link>

        {/* TOP SELLING ITEMS */}
        <Link
          to="/react-admin/top-selling"
          title="Top Selling Items"
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 group ${
            isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
          } ${
            isActive("/react-admin/top-selling")
              ? "bg-[#FECD08] text-[#212121] shadow-md shadow-[#FECD08]/30 font-black"
              : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <FaFire
            className={`text-base shrink-0 ${
              isActive("/react-admin/top-selling")
                ? "text-[#212121]"
                : "text-amber-500 group-hover:text-amber-600"
            }`}
          />
          {(!isCollapsed || isMobileOpen) && <span>Top Selling Items</span>}
        </Link>

        {/* PRODUCTS GROUP */}
        <div className="flex flex-col">
          <div
            title="Products"
            className={`flex items-center justify-between gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 cursor-pointer group ${
              isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
            } ${
              location.pathname.includes("/products") ||
              location.pathname.includes("/add-product")
                ? "text-slate-900 bg-slate-200/80 font-black"
                : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
            }`}
            onClick={() => toggleMenu("products")}
          >
            <div className="flex items-center gap-3.5">
              <FaBox
                className={`text-base shrink-0 ${
                  location.pathname.includes("/products") ||
                  location.pathname.includes("/add-product")
                    ? "text-[#212121]"
                    : "text-slate-600 group-hover:text-black"
                }`}
              />
              {(!isCollapsed || isMobileOpen) && <span>Products</span>}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div>
                {isProductsOpen ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
              </div>
            )}
          </div>
          {isProductsOpen && (!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col pl-10 mt-1 gap-1 animate-fadeInUp">
              {[
                { name: "All Products", path: "/react-admin/products" },
                { name: "Add Product", path: "/react-admin/add-product" },
                { name: "Top Selling Items", path: "/react-admin/top-selling" },
                { name: "Collections", path: "/react-admin/products/collections" },
                { name: "Inventory", path: "/react-admin/products/inventory" },
              ].map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className={`text-[0.68rem] font-bold py-2 px-3 rounded-xl transition-all ${
                    location.pathname === sub.path
                      ? "text-[#212121] bg-white shadow-xs font-black border-l-2 border-[#FECD08]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ORDERS GROUP */}
        <div className="flex flex-col">
          <div
            title="Orders"
            className={`flex items-center justify-between gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 cursor-pointer group ${
              isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
            } ${
              location.pathname.includes("/orders")
                ? "text-slate-900 bg-slate-200/80 font-black"
                : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
            }`}
            onClick={() => toggleMenu("orders")}
          >
            <div className="flex items-center gap-3.5">
              <FaShoppingBag
                className={`text-base shrink-0 ${
                  location.pathname.includes("/orders")
                    ? "text-[#212121]"
                    : "text-slate-600 group-hover:text-black"
                }`}
              />
              {(!isCollapsed || isMobileOpen) && <span>Orders</span>}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div>
                {isOrdersOpen ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
              </div>
            )}
          </div>
          {isOrdersOpen && (!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col pl-10 mt-1 gap-1 animate-fadeInUp">
              {[
                { name: "All Orders", path: "/react-admin/orders" },
                { name: "Create Order", path: "/react-admin/orders/new" },
              ].map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className={`text-[0.68rem] font-bold py-2 px-3 rounded-xl transition-all ${
                    location.pathname === sub.path
                      ? "text-[#212121] bg-white shadow-xs font-black border-l-2 border-[#FECD08]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* CUSTOMERS GROUP */}
        <div className="flex flex-col">
          <div
            title="Customers"
            className={`flex items-center justify-between gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 cursor-pointer group ${
              isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
            } ${
              location.pathname.includes("/customers")
                ? "text-slate-900 bg-slate-200/80 font-black"
                : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
            }`}
            onClick={() => toggleMenu("customers")}
          >
            <div className="flex items-center gap-3.5">
              <FaUsers
                className={`text-base shrink-0 ${
                  location.pathname.includes("/customers")
                    ? "text-[#212121]"
                    : "text-slate-600 group-hover:text-black"
                }`}
              />
              {(!isCollapsed || isMobileOpen) && <span>Customers</span>}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div>
                {isCustomersOpen ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
              </div>
            )}
          </div>
          {isCustomersOpen && (!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col pl-10 mt-1 gap-1 animate-fadeInUp">
              {[
                { name: "All Customers", path: "/react-admin/customers" },
                { name: "Segments", path: "/react-admin/customers/segments" },
              ].map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className={`text-[0.68rem] font-bold py-2 px-3 rounded-xl transition-all ${
                    location.pathname === sub.path
                      ? "text-[#212121] bg-white shadow-xs font-black border-l-2 border-[#FECD08]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* DISCOUNTS */}
        <Link
          to="/react-admin/discount"
          title="Discounts"
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 group ${
            isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
          } ${
            isActive("/react-admin/discount")
              ? "bg-[#FECD08] text-[#212121] shadow-md shadow-[#FECD08]/30 font-black"
              : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <FaTags
            className={`text-base shrink-0 ${
              isActive("/react-admin/discount")
                ? "text-[#212121]"
                : "text-slate-600 group-hover:text-black"
            }`}
          />
          {(!isCollapsed || isMobileOpen) && <span>Discounts</span>}
        </Link>

        {/* FAQS */}
        <Link
          to="/react-admin/faqs"
          title="FAQs"
          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 group ${
            isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
          } ${
            isActive("/react-admin/faqs")
              ? "bg-[#FECD08] text-[#212121] shadow-md shadow-[#FECD08]/30 font-black"
              : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <FaQuestionCircle
            className={`text-base shrink-0 ${
              isActive("/react-admin/faqs")
                ? "text-[#212121]"
                : "text-slate-600 group-hover:text-black"
            }`}
          />
          {(!isCollapsed || isMobileOpen) && <span>FAQs</span>}
        </Link>

        {/* BLOG GROUP */}
        <div className="flex flex-col">
          <div
            title="Blog"
            className={`flex items-center justify-between gap-3.5 px-3.5 py-3 rounded-2xl text-[0.75rem] font-bold tracking-tight transition-all duration-300 cursor-pointer group ${
              isCollapsed && !isMobileOpen ? "justify-center px-0" : ""
            } ${
              location.pathname.includes("/blog")
                ? "text-slate-900 bg-slate-200/80 font-black"
                : "text-slate-800 hover:bg-slate-200/70 hover:text-slate-900"
            }`}
            onClick={() => toggleMenu("blog")}
          >
            <div className="flex items-center gap-3.5">
              <FaPenNib
                className={`text-base shrink-0 ${
                  location.pathname.includes("/blog")
                    ? "text-[#212121]"
                    : "text-slate-600 group-hover:text-black"
                }`}
              />
              {(!isCollapsed || isMobileOpen) && <span>Blog</span>}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div>
                {isBlogOpen ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
              </div>
            )}
          </div>
          {isBlogOpen && (!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col pl-10 mt-1 gap-1 animate-fadeInUp">
              {[
                { name: "All Posts", path: "/react-admin/blog" },
                { name: "Categories", path: "/react-admin/blog/categories" },
              ].map((sub) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className={`text-[0.68rem] font-bold py-2 px-3 rounded-xl transition-all ${
                    location.pathname === sub.path
                      ? "text-[#212121] bg-white shadow-xs font-black border-l-2 border-[#FECD08]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* FOOTER USER / LOGOUT */}
      <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
        {!isCollapsed || isMobileOpen ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#FECD08]/20 border border-[#FECD08]/40 flex items-center justify-center text-[#212121] shrink-0 shadow-sm">
                <FaUserShield size={16} />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-[0.7rem] font-black text-slate-900 uppercase tracking-wider truncate font-heading">
                  {adminUser.username || "LBC Admin"}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">
                    {adminUser.email || "support@lbcmoto.com"}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="w-9 h-9 rounded-xl bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200/60 shadow-xs"
              onClick={handleLogout}
              title="Logout"
            >
              <FaSignOutAlt size={13} />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <button
              className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer border border-slate-200/80 shadow-xs"
              onClick={handleLogout}
              title="Logout"
            >
              <FaSignOutAlt size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
