import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFileExport,
  FaFileExcel,
  FaSort,
  FaUser,
  FaMapMarkerAlt,
  FaUsers,
  FaShieldAlt,
  FaChessKing,
  FaTimes,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import { exportCustomersToExcel } from "../../utils/exportCustomersExcel";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchParams] = useSearchParams();
  const segmentFilter = searchParams.get("segment");

  const handleDeleteCustomer = async (e, customerEmail, customerName) => {
    e.stopPropagation();
    const displayName = customerName || customerEmail;
    if (!window.confirm(`Are you sure you want to delete customer '${displayName}' (${customerEmail})? This action cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/customers/delete/${encodeURIComponent(customerEmail)}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.email.toLowerCase() !== customerEmail.toLowerCase()));
        alert(`Customer '${displayName}' deleted successfully.`);
      } else {
        alert("Failed to delete customer. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer.");
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, segmentFilter, itemsPerPage]);

  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    
    // Fetch Customers
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/customers/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const emailLower = (c.email || "").toLowerCase();
    if (emailLower.includes("admin") || emailLower === "admin@lbcmoto.com") {
      return false;
    }

    const matchesSearch =
      (c.first_name + " " + c.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailLower.includes(searchTerm.toLowerCase());

    let matchesSegment = true;
    if (segmentFilter === "purchased_once") matchesSegment = c.orders_count >= 1;
    if (segmentFilter === "purchased_more") matchesSegment = c.orders_count > 1;
    if (segmentFilter === "never_purchased") matchesSegment = c.orders_count === 0;

    return matchesSearch && matchesSegment;
  });

  const realCustomers = customers.filter((c) => !c.email?.toLowerCase().includes("admin") && c.email?.toLowerCase() !== "admin@lbcmoto.com");
  const totalSpent = realCustomers.reduce((acc, c) => acc + Number(c.total_spent || 0), 0);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const isFiltered = (searchTerm.trim() !== "" || Boolean(segmentFilter));
      const listToExport = isFiltered ? filteredCustomers : realCustomers;
      const filterLabel = isFiltered
        ? `${segmentFilter ? `Segment: ${segmentFilter.replace("_", " ")}` : "Filtered"}${searchTerm.trim() ? ` (Search: "${searchTerm.trim()}")` : ""}`
        : "All Customers";
      await exportCustomersToExcel(listToExport, filterLabel);
    } catch (err) {
      console.error("Export customers error:", err);
      alert("Failed to export customers to Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">User Management</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Global <span className="text-slate-900 font-heading">Customers</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">
            {segmentFilter ? `Segment: ${segmentFilter.replace("_", " ")}` : `Overseeing ${realCustomers.length} Customers`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading || realCustomers.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[0.7rem] uppercase tracking-wider shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download complete customers directory and customer insights as Excel"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FaFileExcel className="text-white text-sm" />
                <span>Export Customers</span>
              </>
            )}
          </button>
          <button className="bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.6rem] uppercase tracking-[0.2em] transition-all hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] active:scale-95">Add Customer</button>
        </div>
      </div>

      {/* STRATEGIC KPIS */}
      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
        {[
          { label: "Total Customers", value: realCustomers.length, icon: <FaUsers />, trend: "Active Users" },
          { label: "Total Spent", value: `Rs. ${totalSpent.toLocaleString()}`, icon: <FaChessKing />, trend: "LTV" },
          { label: "Subscribers", value: Math.min(realCustomers.length, (realCustomers.length / 2).toFixed(0)), icon: <FaShieldAlt />, trend: "Marketing Opt-in" },
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

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        {/* FILTER BAR */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
           <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-[440px] focus-within:border-orm-gold/50 transition-all">
              <FaSearch size={12} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none ml-3 w-full text-[0.7rem] font-bold text-slate-900 placeholder:text-slate-300 tracking-tight" 
              />
           </div>
           <button className="bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-xl text-[0.6rem] font-black uppercase tracking-widest text-slate-700 flex items-center gap-3 hover:text-slate-900 transition-all">
              <FaSort /> Sort
           </button>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Customers...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th width="50" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">
                     <input type="checkbox" className="accent-orm-gold" />
                  </th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Customer</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Status</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Location</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Orders</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Total Spent</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
                  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

                  return (
                    <>
                      {currentItems.length > 0 ? (
                        currentItems.map((cust) => (
                          <tr
                            key={cust.id}
                            className="group transition-all hover:bg-slate-100/50 cursor-pointer"
                            onClick={() => navigate(`/react-admin/customers/${cust.email}`)}
                          >
                            <td className="p-6" onClick={(e) => e.stopPropagation()}>
                               <input type="checkbox" className="accent-orm-gold" />
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#FECD08]/10 border border-[#FECD08]/20 flex items-center justify-center text-[#b89000] font-black text-sm uppercase shadow-lg shadow-[#FECD08]/5">
                                  {cust.first_name ? cust.first_name[0] : <FaUser size={12} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 text-[0.8rem] uppercase tracking-tight leading-none mb-1 group-hover:text-[#b89000] transition-colors">
                                    {cust.first_name} {cust.last_name}
                                  </span>
                                  <span className="text-[0.6rem] font-medium text-slate-500">{cust.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${cust.id % 2 === 0 ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                                 <div className={`w-1 h-1 rounded-full ${cust.id % 2 === 0 ? "bg-green-500" : "bg-white/40"} animate-pulse`}></div>
                                 <span className="text-[0.55rem] font-black uppercase tracking-widest">{cust.id % 2 === 0 ? "Subscribed" : "Guest"}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2 text-slate-500 text-[0.7rem] font-bold">
                                <FaMapMarkerAlt size={10} className="text-slate-500" /> {cust.location}
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[0.6rem] font-black text-slate-500 uppercase tracking-widest">
                                {cust.orders_count} orders
                              </span>
                            </td>
                            <td className="p-6 text-right">
                              <span className="font-black text-slate-900 text-[0.85rem] tracking-tighter">Rs. {Number(cust.total_spent || 0).toLocaleString()}</span>
                            </td>
                            <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomer(e, cust.email, `${cust.first_name || ""} ${cust.last_name || ""}`.trim())}
                                title="Delete Customer"
                                className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-[#FECD08] hover:text-white transition-all shadow-sm"
                              >
                                <FaTrash size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-20 text-center">
                             <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-300">No customers found</span>
                          </td>
                        </tr>
                      )}

                      {/* PAGINATION BLOCK */}
                      {filteredCustomers.length > 0 && (
                        <tr>
                          <td colSpan="7" className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Show</span>
                                  <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                      setItemsPerPage(Number(e.target.value));
                                      setCurrentPage(1);
                                    }}
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
                                    onClick={() => setCurrentPage(1)}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="First Page"
                                  >
                                    <FaAngleDoubleLeft size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                                      onClick={() => setCurrentPage(pageNum)}
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
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="Next Page"
                                  >
                                    <FaChevronRight size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
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

export default Customers;
