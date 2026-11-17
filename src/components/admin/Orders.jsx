import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaFileExport,
  FaFileExcel,
  FaEye,
  FaSort,
  FaTruck,
  FaCreditCard,
  FaCheckCircle,
  FaTrash,
  FaUndo,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exportOrdersToExcel } from "../../utils/exportOrdersExcel";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const isFiltered = (searchTerm.trim() !== "" || activeTab !== "All");
      const ordersToExport = isFiltered ? filteredOrders : orders;
      const filterDescription = isFiltered 
        ? `${activeTab !== "All" ? activeTab : "Filtered"}${searchTerm.trim() ? ` (Search: "${searchTerm.trim()}")` : ""}`
        : "All Orders";
      await exportOrdersToExcel(ordersToExport, filterDescription);
    } catch (err) {
      console.error("Export orders error:", err);
      alert("Failed to export orders to Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const getSavedPage = () => {
    const pageParam = searchParams.get("page");
    if (pageParam && !isNaN(parseInt(pageParam))) {
      return parseInt(pageParam);
    }
    const sessionPage = sessionStorage.getItem("admin_orders_page");
    if (sessionPage && !isNaN(parseInt(sessionPage))) {
      return parseInt(sessionPage);
    }
    return 1;
  };

  const [currentPage, setCurrentPage] = useState(getSavedPage);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const isInitialFilterMount = React.useRef(true);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    sessionStorage.setItem("admin_orders_page", newPage.toString());
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newPage > 1) {
          next.set("page", newPage.toString());
        } else {
          next.delete("page");
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleDeleteOrder = async (e, orderId, displayId) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete Order #${displayId}? It will be moved to the Deleted log.`)) {
      return;
    }

    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, is_deleted: true, deleted_at: data.deleted_at || new Date().toISOString(), deleted_by: data.deleted_by || "Admin" }
              : o
          )
        );
        alert(data.message || `Order #${displayId} moved to Deleted tab. You can view or restore it anytime.`);
      } else {
        alert("Failed to delete order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting order.");
    }
  };

  const handleRestoreOrder = async (e, orderId, displayId) => {
    e.stopPropagation();
    if (!window.confirm(`Restore Order #${displayId} back to active orders?`)) {
      return;
    }

    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/restore/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, is_deleted: false, deleted_at: null, deleted_by: null }
              : o
          )
        );
        alert(data.message || `Order #${displayId} restored successfully.`);
      } else {
        alert("Failed to restore order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error restoring order.");
    }
  };

  useEffect(() => {
    if (isInitialFilterMount.current) {
      isInitialFilterMount.current = false;
      return;
    }
    handlePageChange(1);
  }, [activeTab, searchTerm, itemsPerPage]);

  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    if (!token) {
      navigate("/admin-login");
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/orders/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (err.message === "Unauthorized") navigate("/admin-login");
        setLoading(false);
      });
  }, [navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const activeOrders = orders.filter((o) => !o.is_deleted);
  const deletedOrders = orders.filter((o) => o.is_deleted);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "Deleted") {
      if (!order.is_deleted) return false;
    } else {
      if (order.is_deleted) return false;
      if (activeTab === "Unpaid" && order.is_paid) return false;
      if (activeTab === "Paid" && !order.is_paid) return false;
      if (activeTab === "Open" && (order.status === "Delivered" || order.status === "Cancelled")) return false;
      if (activeTab === "Delivered" && (order.status || "").toLowerCase() !== "delivered") return false;
    }

    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (order.full_name || "").toLowerCase().includes(search) ||
      (order.email || "").toLowerCase().includes(search) ||
      (order.phone || "").includes(search) ||
      (order.id || "").toString().includes(search);
    return matchesSearch;
  });

  const handleRowClick = (id) => navigate(`/react-admin/orders/${id}`);

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full animate-pulse ring-2 ring-[#f59e0b]/20 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-[#f59e0b] font-heading">Order Management</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Global <span className="text-[#f59e0b] font-heading">Orders</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Managing {orders.length} Total Orders</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || orders.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[0.7rem] uppercase tracking-wider shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download complete orders report as Excel"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FaFileExcel className="text-white text-sm" />
                <span>Export Orders</span>
              </>
            )}
          </button>
          <button
            onClick={() => navigate("/react-admin/orders/new")}
            className="bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.6rem] uppercase tracking-[0.2em] transition-all hover:bg-[#c82237] active:scale-95 shadow-md flex items-center gap-2"
          >
            + Create Order
          </button>
        </div>
      </div>

      {/* STRATEGIC KPIS */}
      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
        {[
          { label: "Active Orders", value: activeOrders.length, icon: <FaTruck />, trend: `${deletedOrders.length} in Deleted log` },
          { label: "Active Revenue", value: `Rs. ${activeOrders.reduce((acc, o) => acc + Number(o.total_price), 0).toLocaleString()}`, icon: <FaCreditCard />, trend: "Gross Active Sales" },
          { label: "Unpaid Orders", value: activeOrders.filter((o) => !o.is_paid).length, icon: <FaCheckCircle />, trend: "Awaiting Payment" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] flex items-center justify-between group hover:border-[#FECD08]/20 transition-all">
            <div>
               <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">{kpi.label}</span>
               <div className="text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</div>
               <span className="text-[0.55rem] font-bold text-slate-600 uppercase tracking-widest mt-2 block">{kpi.trend}</span>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-[#b89000] transition-colors">{kpi.icon}</div>
          </div>
        ))}
      </div>

      {/* FILTER & TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        {/* TAB NAVIGATION */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-wrap gap-4">
           <div className="flex gap-2 flex-wrap">
              {["All", "Unpaid", "Paid", "Open", "Delivered", "Deleted"].map((tab) => {
                const count = tab === "Deleted" 
                  ? orders.filter(o => o.is_deleted).length
                  : tab === "All"
                  ? orders.filter(o => !o.is_deleted).length
                  : tab === "Unpaid"
                  ? orders.filter(o => !o.is_deleted && !o.is_paid).length
                  : tab === "Paid"
                  ? orders.filter(o => !o.is_deleted && o.is_paid).length
                  : tab === "Open"
                  ? orders.filter(o => !o.is_deleted && o.status !== "Delivered" && o.status !== "Cancelled").length
                  : orders.filter(o => !o.is_deleted && (o.status || "").toLowerCase() === "delivered").length;

                return (
                  <button
                    key={tab}
                    className={`px-5 py-2 rounded-full text-[0.6rem] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      activeTab === tab 
                        ? tab === "Deleted"
                          ? "bg-slate-900 text-white shadow-md"
                          : tab === "Delivered"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-[#FECD08] text-[#212121] font-bold shadow-md shadow-[#FECD08]/20" 
                        : tab === "Deleted"
                        ? "text-red-500 hover:bg-red-50"
                        : tab === "Delivered"
                        ? "text-emerald-700 hover:bg-emerald-50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    <span>{tab}</span>
                    {count > 0 && (
                      <span className={`text-[0.55rem] font-bold px-1.5 py-0.2 rounded-full ${
                        activeTab === tab ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-700"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
           </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl w-[300px] focus-within:border-orm-gold/50 transition-all">
               <FaSearch size={12} className="text-slate-500" />
               <input
                 type="text"
                 placeholder="Search orders..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-transparent border-none outline-none ml-3 w-full text-[0.7rem] font-bold text-slate-900 placeholder:text-slate-300"
               />
            </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Orders...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Order ID</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Date</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Customer</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Payment</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Fulfillment</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Items</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Total</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
                  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

                  return (
                    <>
                      {currentItems.length > 0 ? (
                        currentItems.map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => handleRowClick(order.id)}
                            className="group transition-all hover:bg-slate-100/50 cursor-pointer"
                          >
                            <td className="p-6">
                              <span className={`font-mono font-black text-[0.8rem] tracking-tight group-hover:underline ${
                                order.is_deleted ? "text-slate-400 line-through" : "text-[#b89000]"
                              }`}>
                                #{order.id}
                              </span>
                            </td>
                            <td className="p-6">
                              <span className="text-[0.7rem] font-bold text-slate-500">{formatDate(order.created_at)}</span>
                            </td>
                            <td className="p-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-[#1e293b] text-[0.75rem] uppercase tracking-tight">{order.full_name}</span>
                                <span className="text-[0.6rem] font-medium text-slate-500">{order.email}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${order.is_paid ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-[#FECD08]/10 border-[#FECD08]/20 text-[#b89000]"}`}>
                                 <div className={`w-1 h-1 rounded-full ${order.is_paid ? "bg-green-500" : "bg-[#FECD08]"} animate-pulse`}></div>
                                 <span className="text-[0.55rem] font-black uppercase tracking-widest">{order.is_paid ? "Paid" : "Unpaid"}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              {order.is_deleted ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="px-3 py-1 border rounded-full text-[0.55rem] font-black uppercase tracking-widest bg-red-500/10 border-red-500/20 text-red-600 inline-block w-fit">
                                    DELETED
                                  </span>
                                  {order.deleted_at && (
                                    <span className="text-[0.55rem] text-slate-400 font-medium">
                                      {formatDate(order.deleted_at)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`px-3 py-1 border rounded-full text-[0.55rem] font-black uppercase tracking-widest ${
                                   order.status === "Delivered"
                                     ? "bg-green-500/10 border-green-500/20 text-green-500"
                                     : order.status === "Shipped"
                                     ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                     : order.status === "Cancelled"
                                     ? "bg-[#FECD08]/10 border-[#FECD08]/20 text-[#b89000]"
                                     : "bg-slate-100 border-slate-200 text-slate-700"
                                 }`}>
                                   {order.status || "Processing"}
                                 </span>
                              )}
                            </td>
                            <td className="p-6">
                              <span className="text-[0.7rem] font-bold text-slate-500">{order.items ? order.items.length : 0} items</span>
                            </td>
                            <td className="p-6 text-right">
                              <span className="font-black text-slate-900 text-[0.8rem] tracking-tighter">Rs. {Number(order.total_price).toLocaleString()}</span>
                            </td>
                            <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                              {order.is_deleted ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleRestoreOrder(e, order.id, order.id)}
                                  title="Restore Order"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm text-xs font-bold"
                                >
                                  <FaUndo size={11} />
                                  <span>Restore</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteOrder(e, order.id, order.id)}
                                  title="Delete Order (Preserves Audit Log)"
                                  className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-[#FECD08] hover:text-white transition-all shadow-sm"
                                >
                                  <FaTrash size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="p-20 text-center">
                             <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-300">No orders found</span>
                          </td>
                        </tr>
                      )}

                      {/* PAGINATION BLOCK */}
                      {filteredOrders.length > 0 && (
                        <tr>
                          <td colSpan="8" className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} entries
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Show</span>
                                  <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                      setItemsPerPage(Number(e.target.value));
                                      setCurrentPage(1);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 text-[0.7rem] font-bold outline-none cursor-pointer focus:border-[#FECD08]"
                                  >
                                    {[10, 25, 50, 100].map((size) => (
                                      <option key={size} value={size}>{size}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={(e) => { e.stopPropagation(); handlePageChange(1); }}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="First Page"
                                  >
                                    <FaAngleDoubleLeft size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={(e) => { e.stopPropagation(); handlePageChange(Math.max(1, currentPage - 1)); }}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="Previous Page"
                                  >
                                    <FaChevronLeft size={10} />
                                  </button>
                                  {(() => {
                                    let start = Math.max(1, currentPage - 2);
                                    let end = Math.min(totalPages, start + 4);
                                    if (end === totalPages) start = Math.max(1, totalPages - 4);
                                    const pages = [];
                                    for (let i = start; i <= end; i++) pages.push(i);
                                    return pages;
                                  })().map((pageNum) => (
                                    <button
                                      key={pageNum}
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handlePageChange(pageNum); }}
                                      className={`w-8 h-8 rounded-xl text-[0.65rem] font-black uppercase transition-all ${
                                        currentPage === pageNum
                                          ? "bg-[#FECD08] text-[#212121] font-bold shadow-md shadow-[#FECD08]/20"
                                          : "border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={(e) => { e.stopPropagation(); handlePageChange(Math.min(totalPages, currentPage + 1)); }}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="Next Page"
                                  >
                                    <FaChevronRight size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={(e) => { e.stopPropagation(); handlePageChange(totalPages); }}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="Last Page"
                                  >
                                    <FaAngleDoubleRight size={10} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
