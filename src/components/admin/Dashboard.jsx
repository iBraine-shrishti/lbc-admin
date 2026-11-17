import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FaCalendarAlt,
  FaSyncAlt,
  FaBoxes,
  FaTags,
  FaBlog,
  FaQuestionCircle,
  FaShoppingCart,
  FaUsers,
  FaMoneyBillWave,
  FaList,
} from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/dashboard-stats/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
        <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Dashboard...</span>
      </div>
    );
  }

  // Format daily sales chart data
  const chartData =
    stats?.sales_chart?.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      sales: item.sales,
    })) || [];

  // Distribution chart of store catalog & content
  const contentDistribution = [
    { name: "Products", value: stats?.summary?.products_count || 0, color: "#FECD08" },
    { name: "Collections", value: stats?.summary?.collections_count || 0, color: "#3b82f6" },
    { name: "Coupons", value: stats?.summary?.coupons_count || 0, color: "#10b981" },
    { name: "Blogs", value: stats?.summary?.blogs_count || 0, color: "#f59e0b" },
    { name: "FAQs", value: stats?.summary?.faqs_count || 0, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-[#FECD08] rounded-full animate-pulse shadow-[0_0_10px_#FECD08]"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-[#FECD08]/60">System Analytics</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Dashboard <span className="text-[#b89000]">Overview</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest mt-2">Live metrics from system database</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="bg-white border border-slate-200 px-5 py-3 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-sm"
          >
            <FaSyncAlt className="text-[#b89000]" /> Refresh Stats
          </button>
        </div>
      </div>

      {/* STRATEGIC KPIS GRID */}
      <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-2">
        {[
          {
            label: "Total Sales",
            value: `Rs. ${Number(stats?.summary?.gross_sales || 0).toLocaleString()}`,
            icon: <FaMoneyBillWave className="text-[#b89000]" size={18} />,
            colorClass: "text-[#b89000]",
            link: "/react-admin/orders"
          },
          {
            label: "Total Orders",
            value: stats?.summary?.orders_count || 0,
            icon: <FaShoppingCart className="text-blue-500" size={18} />,
            colorClass: "text-slate-900",
            link: "/react-admin/orders"
          },
          {
            label: "Total Customers",
            value: stats?.summary?.customers_count || 0,
            icon: <FaUsers className="text-emerald-500" size={18} />,
            colorClass: "text-slate-900",
            link: "/react-admin/customers"
          },
          {
            label: "Fulfillment Rate",
            value: stats?.summary?.fulfilled_rate || "0%",
            icon: <FaList className="text-purple-500" size={18} />,
            colorClass: "text-slate-900",
            link: "/react-admin/orders"
          }
        ].map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => navigate(kpi.link)}
            className="group bg-white shadow-sm border border-slate-200 p-7 rounded-[2rem] transition-all duration-300 hover:border-[#FECD08]/20 hover:bg-slate-50/50 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-[0.25em]">{kpi.label}</span>
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                {kpi.icon}
              </div>
            </div>
            <div className={`text-2.5xl font-black tracking-tighter ${kpi.colorClass}`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* CATALOG & CONTENT MANAGEMENT STATS */}
      <div>
        <h3 className="text-[0.7rem] font-black text-slate-900 uppercase tracking-[0.3em] mb-5 px-1">Inventory & Content Quick Links</h3>
        <div className="grid grid-cols-5 gap-6 max-lg:grid-cols-3 max-md:grid-cols-2">
          {[
            { label: "Products", count: stats?.summary?.products_count || 0, link: "/react-admin/products", icon: <FaBoxes className="text-red-500" /> },
            { label: "Collections", count: stats?.summary?.collections_count || 0, link: "/react-admin/products/collections", icon: <FaList className="text-blue-500" /> },
            { label: "Discounts", count: stats?.summary?.coupons_count || 0, link: "/react-admin/discount", icon: <FaTags className="text-emerald-500" /> },
            { label: "Blog Posts", count: stats?.summary?.blogs_count || 0, link: "/react-admin/blog", icon: <FaBlog className="text-amber-500" /> },
            { label: "FAQs", count: stats?.summary?.faqs_count || 0, link: "/react-admin/faqs", icon: <FaQuestionCircle className="text-violet-500" /> },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.link)}
              className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#FECD08]/20 hover:bg-slate-50 transition-all duration-300 cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <div>
                <span className="block text-[0.55rem] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                <span className="text-lg font-black text-slate-900">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ANALYTICS GRID */}
      <div className="grid grid-cols-12 gap-8">
        {/* Sales Trend (Area Chart) */}
        <div className="col-span-8 bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] max-lg:col-span-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Total Sales History</h3>
              <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mt-1">Order sales breakdown by date</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-slate-900 tracking-tighter">Rs. {Number(stats?.summary?.gross_sales || 0).toLocaleString()}</div>
              <span className="text-[0.55rem] font-black text-[#b89000] uppercase tracking-widest">Aggregate Sales</span>
            </div>
          </div>

          <div className="h-[300px] w-full min-h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FECD08" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FECD08" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "12px", fontSize: "12px", color: "#fff" }} />
                  <Area type="monotone" dataKey="sales" stroke="#FECD08" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[0.6rem] font-black text-slate-300 uppercase tracking-widest border border-dashed border-slate-200 rounded-2xl">
                No Sales Data Registered Yet
              </div>
            )}
          </div>
        </div>

        {/* Catalog Distribution (Pie Chart) */}
        <div className="col-span-4 bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] max-lg:col-span-12">
          <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Content Distribution</h3>
          
          <div className="h-[200px] min-h-[200px] relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentDistribution}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {contentDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 tracking-tighter">
                {contentDistribution.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-[0.5rem] font-black text-slate-400 uppercase tracking-widest">Total Nodes</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {contentDistribution.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                </div>
                <span className="text-xs font-black text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="col-span-12 bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem]">
          <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Top Selling Products</h3>
          <div className="grid grid-cols-5 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
            {stats?.top_products?.map((p, idx) => {
              const maxRevenue = stats.top_products[0]?.revenue || 1;
              const revenuePct = Math.round((Number(p.revenue) / Number(maxRevenue)) * 100);

              return (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:border-[#FECD08]/20 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <span className="text-[0.55rem] font-black text-[#b89000] uppercase tracking-wider block mb-1">Rank #{idx + 1}</span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[2rem] uppercase tracking-tight">{p.product__title}</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-slate-500 text-[0.65rem] font-bold">
                      <span>Total Revenue</span>
                      <span className="text-slate-900 font-black">₹{Number(p.revenue).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-slate-500 text-[0.65rem] font-bold">
                      <span>Units Sold</span>
                      <span className="text-slate-900 font-black">{p.total_sold}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-orm-gold/50 to-orm-gold" style={{ width: `${revenuePct}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!stats?.top_products || stats.top_products.length === 0) && (
              <div className="col-span-5 py-12 text-center text-[0.65rem] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 rounded-2xl opacity-40">
                No Sales History Found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
