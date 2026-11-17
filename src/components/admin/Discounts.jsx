import React, { useState, useEffect } from "react";
import { FaPlus, FaSearch, FaTag, FaTrash, FaTicketAlt, FaClock, FaCheckCircle, FaExclamationCircle, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const Discounts = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, itemsPerPage]);

  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coupons/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setCoupons(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const getStatus = (coupon) => {
    const now = new Date();
    const start = new Date(coupon.valid_from);
    const end = new Date(coupon.valid_to);
    if (!coupon.active) return "Inactive";
    if (now.getTime() > end.getTime()) return "Expired";
    if (now.getTime() < start.getTime()) return "Scheduled";
    return "Active";
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this discount code?")) return;
    const token = localStorage.getItem("orm_admin_token");
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coupons/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${token}` },
    });
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStatus(c);
    if (activeTab === "All") return matchesSearch;
    return matchesSearch && status === activeTab;
  });

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">Promotions</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">All <span className="text-slate-900 font-heading">Discounts</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Managing {coupons.length} Discount Coupons</p>
        </div>

        <Link to="/react-admin/discounts/new" className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] hover:-translate-y-1">
          <span className="relative z-10 flex items-center gap-2"><FaPlus size={10} /> Create Discount</span>
          <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
        </Link>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        {/* TAB BAR */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
           <div className="flex gap-2">
              {["All", "Active", "Scheduled", "Expired"].map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-2 rounded-full text-[0.6rem] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? "bg-[#FECD08] text-[#212121] font-bold shadow-md shadow-[#FECD08]/20" 
                      : "text-slate-500 hover:text-slate-500 hover:bg-slate-100"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
           </div>
           <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl w-[300px] focus-within:border-orm-gold/50 transition-all">
              <FaSearch size={12} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Search codes..." 
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
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Discounts...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th width="40" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">
                     <input type="checkbox" className="accent-orm-gold" />
                  </th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Code</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Status</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Discount Value</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Usage</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = filteredCoupons.slice(indexOfFirstItem, indexOfLastItem);
                  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

                  return (
                    <>
                      {currentItems.length > 0 ? (
                        currentItems.map((c) => {
                          const status = getStatus(c);
                          return (
                            <tr
                              key={c.id}
                              onClick={() => navigate(`/react-admin/discounts/${c.id}`)}
                              className="group transition-all hover:bg-slate-100/50 cursor-pointer"
                            >
                              <td className="p-6">
                                 <input type="checkbox" className="accent-orm-gold" onClick={(e) => e.stopPropagation()} />
                              </td>
                              <td className="p-6">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#b89000]"><FaTicketAlt size={12} /></div>
                                     <span className="font-mono font-black text-slate-900 text-[0.9rem] tracking-widest">{c.code}</span>
                                  </div>
                                  <div className="text-[0.55rem] font-bold uppercase tracking-wider text-slate-400 pl-11">
                                    {c.applies_to === 'products' ? `Target: ${c.products?.length || 0} Products` :
                                     c.applies_to === 'categories' ? `Target: ${(c.categories || []).join(', ') || 'Categories'}` :
                                     c.applies_to === 'collections' ? `Target: ${c.collections?.length || 0} Collections` :
                                     c.applies_to === 'variants' ? `Target: ${c.variants?.length || 0} Variants` :
                                     'Target: Store-wide'}
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                                  status === "Active" ? "bg-green-500/10 border-green-500/20 text-green-500" : 
                                  status === "Expired" ? "bg-red-500/10 border-red-500/20 text-red-500" : 
                                  "bg-[#FECD08]/10 border-[#FECD08]/20 text-[#b89000]"
                                }`}>
                                   <div className={`w-1 h-1 rounded-full ${status === "Active" ? "bg-green-500 animate-pulse" : status === "Expired" ? "bg-red-500" : "bg-[#FECD08]"}`}></div>
                                   <span className="text-[0.55rem] font-black uppercase tracking-widest">{status}</span>
                                </div>
                              </td>
                              <td className="p-6">
                                <span className="font-black text-slate-900 text-[0.85rem] tracking-tighter">{c.discount_percentage}% OFF</span>
                              </td>
                              <td className="p-6">
                                <span className="text-[0.7rem] font-bold text-slate-700 uppercase tracking-widest">0 USES</span>
                              </td>
                              <td className="p-6 text-right">
                                <button
                                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 active:scale-90"
                                  onClick={(e) => handleDelete(e, c.id)}
                                >
                                  <FaTrash size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-20 text-center">
                             <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-300">No discounts found</span>
                          </td>
                        </tr>
                      )}

                      {/* PAGINATION BLOCK */}
                      {filteredCoupons.length > 0 && (
                        <tr>
                          <td colSpan="6" className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCoupons.length)} of {filteredCoupons.length} entries
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
                                    onClick={(e) => { e.stopPropagation(); setCurrentPage(1); }}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="First Page"
                                  >
                                    <FaAngleDoubleLeft size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
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
                                      onClick={(e) => { e.stopPropagation(); setCurrentPage(pageNum); }}
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
                                    onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                                    className="p-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                    title="Next Page"
                                  >
                                    <FaChevronRight size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={(e) => { e.stopPropagation(); setCurrentPage(totalPages); }}
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

export default Discounts;
