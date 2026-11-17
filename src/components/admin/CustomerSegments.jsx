import React, { useState, useEffect } from "react";
import { FaSearch, FaUsers, FaChartPie, FaUserClock, FaHistory } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CustomerSegments = () => {
  const navigate = useNavigate();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/customers/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((customers) => {
        const total = customers.length || 1;
        const purchasedOnce = customers.filter((c) => c.orders_count >= 1).length;
        const purchasedMore = customers.filter((c) => c.orders_count > 1).length;
        const neverPurchased = customers.filter((c) => c.orders_count === 0).length;
        const emailSubscribers = Math.floor(total * 0.4);

        const generatedSegments = [
          { id: 1, name: "Purchased at least once", count: purchasedOnce, percent: ((purchasedOnce / total) * 100).toFixed(0) + "%", updated: "Just now", icon: <FaUsers /> },
          { id: 2, name: "Email Subscribers", count: emailSubscribers, percent: "40%", updated: "Just now", icon: <FaUserClock /> },
          { id: 3, name: "Abandoned checkouts (30d)", count: 0, percent: "0%", updated: "Just now", icon: <FaHistory /> },
          { id: 4, name: "Frequent Buyers", count: purchasedMore, percent: ((purchasedMore / total) * 100).toFixed(0) + "%", updated: "Just now", icon: <FaChartPie /> },
          { id: 5, name: "New Registered Users", count: neverPurchased, percent: ((neverPurchased / total) * 100).toFixed(0) + "%", updated: "Just now", icon: <FaUsers /> },
        ];
        setSegments(generatedSegments);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const getFilterType = (id) => {
    switch (id) {
      case 1: return "purchased_once";
      case 4: return "purchased_more";
      case 5: return "never_purchased";
      default: return "all";
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-[#FECD08] rounded-full animate-pulse shadow-[0_0_10px_#FECD08]"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-[#FECD08]/60">Segmentation</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Customer <span className="text-[#b89000]">Segments</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Classifying Customer Groups</p>
        </div>
        <button className="bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.6rem] uppercase tracking-[0.2em] transition-all hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] active:scale-95">Create Segment</button>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-full focus-within:border-orm-gold/50 transition-all">
              <FaSearch size={12} className="text-slate-500" />
              <input type="text" placeholder="Search segments..." className="bg-transparent border-none outline-none ml-3 w-full text-[0.7rem] font-bold text-slate-900 placeholder:text-slate-300" />
           </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Segments...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th width="50" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">
                     <input type="checkbox" className="accent-orm-gold" />
                  </th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Segment Name</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Customers</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {segments.map((seg) => (
                  <tr
                    key={seg.id}
                    onClick={() => navigate(`/react-admin/customers?segment=${getFilterType(seg.id)}`)}
                    className="group transition-all hover:bg-slate-100/50 cursor-pointer"
                  >
                    <td className="p-6">
                       <input type="checkbox" className="accent-orm-gold" onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#b89000] group-hover:bg-[#FECD08] group-hover:text-white transition-all duration-500">
                            {seg.icon}
                         </div>
                         <span className="font-bold text-slate-900 text-[0.85rem] uppercase tracking-tight group-hover:text-[#b89000] transition-colors">{seg.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-[0.8rem] font-black text-slate-900 tracking-tighter">{seg.percent}</span>
                          <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest">{seg.count} customers</span>
                       </div>
                    </td>
                    <td className="p-6 text-right">
                       <span className="text-[0.65rem] font-bold text-slate-700 uppercase tracking-widest">{seg.updated}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSegments;
