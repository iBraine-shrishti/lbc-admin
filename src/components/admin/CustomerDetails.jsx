import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaMapMarkerAlt,
  FaEnvelope,
  FaShoppingCart,
  FaDollarSign,
  FaCalendarAlt,
  FaRegUser,
  FaTrash,
} from "react-icons/fa";

const cleanImageUrl = (path) => {
  if (!path) return "";
  const pathStr = path.toString().trim();
  if (pathStr.includes("http://") || pathStr.includes("https://") || pathStr.includes("http//") || pathStr.includes("https//")) {
    let clean = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;
    return clean.replace("https//", "https://").replace("http//", "http://");
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
  return `${apiBase}${cleanPath}`;
};

const CustomerDetails = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("orm_admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    const loadData = async () => {
      try {
        // Fetch Customers list to find this specific customer
        const custRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/customers/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const custData = await custRes.json();
        const foundCust = custData.find((c) => c.email.toLowerCase() === email.toLowerCase());

        // Fetch Orders list to filter orders
        const ordersRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/orders/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const ordersData = await ordersRes.json();
        const filteredOrders = ordersData.filter(
          (o) => o.email.toLowerCase() === email.toLowerCase()
        );

        if (foundCust) {
          setCustomer(foundCust);
        } else if (filteredOrders.length > 0) {
          // Fallback if customer is not in custom list but has orders
          setCustomer({
            first_name: filteredOrders[0].full_name,
            last_name: "",
            email: email,
            location: `${filteredOrders[0].city}, ${filteredOrders[0].state}`,
            orders_count: filteredOrders.length,
            total_spent: filteredOrders.reduce((sum, o) => sum + Number(o.total_price), 0),
            id: email,
          });
        }

        setCustomerOrders(filteredOrders);
      } catch (err) {
        console.error("Error loading customer data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [email, token, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
        <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Accessing briefing...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-40">
        <Link to="/react-admin/customers" className="text-slate-700 text-[0.65rem] font-black uppercase tracking-[0.2em] flex items-center gap-2 justify-center mb-6 hover:text-[#b89000] transition-colors">
          <FaArrowLeft /> Back to Customers
        </Link>
        <div className="text-slate-500 font-black uppercase tracking-widest">Customer Entry Not Found</div>
      </div>
    );
  }

  const handleDeleteCustomer = async () => {
    const displayName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || email;
    if (!window.confirm(`Are you sure you want to delete customer '${displayName}' (${email})? All associated order records will also be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/customers/delete/${encodeURIComponent(email)}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        alert(`Customer '${displayName}' deleted successfully.`);
        navigate("/react-admin/customers");
      } else {
        alert("Failed to delete customer.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer.");
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Link to="/react-admin/customers" className="text-slate-700 text-[0.65rem] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:text-[#b89000] transition-colors">
            <FaArrowLeft /> Back to Customers
          </Link>
          <button
            type="button"
            onClick={handleDeleteCustomer}
            className="bg-red-50 border border-red-200 text-red-600 px-6 py-2.5 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#FECD08] hover:text-white flex items-center gap-2"
          >
            Delete Customer
          </button>
        </div>
        <div className="flex justify-between items-start gap-6 flex-wrap">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.25rem] bg-[#FECD08]/10 border border-[#FECD08]/20 flex items-center justify-center text-[#b89000] font-black text-2xl uppercase shadow-lg shadow-[#FECD08]/5 shrink-0">
              {customer.first_name ? customer.first_name[0] : <FaUser size={20} />}
            </div>
            <div className="space-y-1.5">
              <h1 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">
                {customer.first_name} {customer.last_name}
              </h1>
              <div className="flex gap-3 items-center flex-wrap">
                <span className="text-xs font-bold text-slate-500">{customer.email}</span>
                <span className={`px-2.5 py-0.5 rounded-full border text-[0.55rem] font-black uppercase tracking-widest ${
                  customer.orders_count > 0 ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                  {customer.orders_count > 0 ? "Subscribed" : "Guest"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Account Details */}
        <div className="col-span-4 flex flex-col gap-8 max-lg:col-span-12">
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <FaRegUser className="text-[#b89000]" />
              <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Account Info</h3>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="text-slate-400">Total Orders</span>
                <span className="text-slate-900">{customer.orders_count}</span>
              </div>
              <div className="py-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span className="text-slate-400">Total Spent</span>
                <span className="text-[#b89000]">Rs. {Number(customer.total_spent || 0).toLocaleString()}</span>
              </div>
              <div className="py-4 space-y-2">
                <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest block">Last Known Location</span>
                <div className="flex items-start gap-2.5 text-xs font-bold text-slate-700">
                  <FaMapMarkerAlt className="text-slate-400 shrink-0 mt-0.5" size={12} />
                  <span>{customer.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Purchase History */}
        <div className="col-span-8 flex flex-col gap-8 max-lg:col-span-12">
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <FaShoppingCart className="text-[#b89000]" />
              <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Purchase History ({customerOrders.length})</h3>
            </div>

            {customerOrders.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl opacity-40">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">No Purchase History Found</span>
              </div>
            ) : (
              <div className="space-y-6">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 hover:border-[#FECD08]/20 transition-all flex flex-col gap-5"
                  >
                    {/* Order summary info bar */}
                    <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-slate-200/60">
                      <div className="flex items-center gap-4">
                        <Link
                          to={`/react-admin/orders/${order.id}`}
                          className="font-black text-xs text-slate-900 hover:text-[#b89000] transition-colors uppercase tracking-wider"
                        >
                          Order #{order.id}
                        </Link>
                        <span className="text-[0.65rem] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                          <FaCalendarAlt size={10} />
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-black text-xs text-slate-900">
                          Rs. {Number(order.total_price || 0).toLocaleString()}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[0.55rem] font-black uppercase tracking-wider ${
                          order.is_paid
                            ? "bg-green-500/10 border-green-500/20 text-green-500"
                            : "bg-[#FECD08]/10 border-[#FECD08]/20 text-[#b89000]"
                        }`}>
                          {order.is_paid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>

                    {/* Nested items list */}
                    <div className="space-y-3">
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0">
                              <img
                                src={cleanImageUrl(item.product?.image)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[0.7rem] font-bold text-slate-700 truncate">
                              {item.product?.title || "Product"}
                            </span>
                          </div>
                          <span className="text-[0.7rem] text-slate-400 font-mono shrink-0">
                            {item.quantity} x Rs. {Number(item.price).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
