import React, { useState, useEffect } from "react";
import { FaTrash, FaPlus, FaLayerGroup, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const BlogCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog-categories/`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog-categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setNewCatName("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this classification?")) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog-categories/${id}/`, {
        method: "DELETE",
      });
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
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
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Blog <span className="text-slate-900 font-heading">Categories</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Structuring Blog Content</p>
        </div>
        <Link to="/react-admin/blog" className="text-slate-700 text-[0.6rem] font-black uppercase tracking-widest hover:text-[#b89000] transition-colors flex items-center gap-2">
           <FaArrowLeft /> Back to Posts
        </Link>
      </div>

      {/* INPUT BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-6 rounded-[2rem] flex gap-4 items-center">
        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl focus-within:border-orm-gold/50 transition-all">
           <input
            type="text"
            placeholder="Enter category name..."
            className="w-full bg-transparent border-none outline-none text-slate-900 text-[0.8rem] font-bold placeholder:text-slate-300"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
        </div>
        <button
          onClick={handleAddCategory}
          className="bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-2xl font-black text-[0.65rem] uppercase tracking-widest transition-all hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] active:scale-95"
        >
          <FaPlus className="inline mr-2" /> Add Category
        </button>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Categories...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th width="80" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">ID</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Category Name</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="group transition-all hover:bg-slate-100/50">
                    <td className="p-6">
                      <span className="font-mono text-[0.7rem] text-slate-500 tracking-tighter">#{cat.id}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#b89000]"><FaLayerGroup size={12} /></div>
                         <span className="font-bold text-slate-900 text-[0.9rem] uppercase tracking-tight group-hover:text-[#b89000] transition-colors">{cat.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 active:scale-90"
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                   <tr>
                     <td colSpan="3" className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-[0.6rem]">No categories defined</td>
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

export default BlogCategories;
