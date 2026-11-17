import React, { useState, useEffect } from "react";
import { FaPlus, FaImage, FaLayerGroup } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/collections/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setCollections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Collections Error:", err);
        setLoading(false);
      });
  }, []);

  const getImageUrl = (collection) => {
    if (collection.image) {
      const pathStr = collection.image.toString().trim();
      if (pathStr.includes("http://") || pathStr.includes("https://") || pathStr.includes("http//") || pathStr.includes("https//")) {
        let clean = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;
        return clean.replace("https//", "https://").replace("http//", "http://");
      }
      return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${pathStr.startsWith("/") ? pathStr : "/" + pathStr}`;
    }
    if (collection.first_product_image) {
      const firstPath = collection.first_product_image.toString().trim();
      if (firstPath.includes("http://") || firstPath.includes("https://") || firstPath.includes("http//") || firstPath.includes("https//")) {
        let clean = firstPath.startsWith("/") ? firstPath.slice(1) : firstPath;
        return clean.replace("https//", "https://").replace("http//", "http://");
      }
      return `${import.meta.env.VITE_API_URL || "http://localhost:8000"}${firstPath.startsWith("/") ? firstPath : "/" + firstPath}`;
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">Organization</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">All <span className="text-slate-900 font-heading">Collections</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Managing {collections.length} Product Groups</p>
        </div>

        <Link
          to="/react-admin/products/collections/new"
          className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] hover:-translate-y-1"
        >
          <span className="relative z-10 flex items-center gap-2"><FaPlus size={10} /> Create Collection</span>
          <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
        </Link>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        {/* TAB BAR */}
        <div className="p-6 border-b border-slate-200 flex items-center bg-slate-50">
           <div className="flex gap-2">
              <button className="px-6 py-2 rounded-full text-[0.6rem] font-black uppercase tracking-widest bg-[#FECD08] text-[#212121] font-bold shadow-md shadow-[#FECD08]/20 transition-all">All Collections</button>
           </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Collections...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th width="50" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">
                     <input type="checkbox" className="accent-orm-gold" />
                  </th>
                  <th width="100" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Visual</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Collection Name</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Product Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {collections.length > 0 ? (
                  collections.map((col) => (
                    <tr
                      key={col.id}
                      onClick={() => navigate(`/react-admin/products/collections/${col.id}`)}
                      className="group transition-all hover:bg-slate-100/50 cursor-pointer"
                    >
                      <td className="p-6">
                         <input type="checkbox" className="accent-orm-gold" onClick={(e) => e.stopPropagation()} />
                      </td>
                      <td className="p-6">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl overflow-hidden group-hover:border-[#FECD08]/30 transition-all duration-500 flex items-center justify-center">
                          {getImageUrl(col) ? (
                            <img src={getImageUrl(col)} alt={col.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <FaLayerGroup className="text-slate-300 text-xl" />
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="font-bold text-slate-900 text-[0.9rem] uppercase tracking-tight group-hover:text-[#b89000] transition-colors">{col.title}</span>
                        <div className="text-[0.5rem] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">ID: 00{col.id}</div>
                      </td>
                      <td className="p-6 text-right">
                        <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[0.6rem] font-black text-slate-500 uppercase tracking-widest group-hover:text-[#b89000] group-hover:border-orm-gold/40 transition-all">
                          {col.product_count || 0} products
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-20 text-center">
                       <div className="space-y-4">
                          <p className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-300">No collections found</p>
                          <Link to="/react-admin/products/collections/new" className="text-[#b89000] text-[0.65rem] font-black uppercase tracking-widest hover:underline">Create First Collection &rarr;</Link>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collections;
