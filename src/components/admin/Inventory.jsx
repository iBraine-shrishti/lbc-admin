import React, { useState, useEffect } from "react";
import { FaSearch, FaSave, FaCubes, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaFileExcel } from "react-icons/fa";
import { exportInventoryToExcel } from "../../utils/exportInventoryExcel";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [changes, setChanges] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/image/placeholder.png";
    const pathStr = imagePath.toString().trim();
    if (pathStr.includes("http://") || pathStr.includes("https://") || pathStr.includes("http//") || pathStr.includes("https//")) {
      let clean = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;
      return clean.replace("https//", "https://").replace("http//", "http://");
    }
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
    return `${apiBase}${cleanPath}`;
  };

  const handleStockChange = (id, value) => {
    const newValue = parseInt(value) || 0;
    setChanges((prev) => ({ ...prev, [id]: { stock_quantity: newValue } }));
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_quantity: newValue } : p)),
    );
  };

  const saveStock = async (product) => {
    const productId = product.id;
    const productSlug = product.slug;
    if (!changes[productId]) return;

    const token = localStorage.getItem("orm_admin_token");
    if (!token) {
      alert("Auth Error: Re-login Required");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/${productSlug}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(changes[productId]),
      });

      if (response.ok) {
        alert("Stock Updated Successfully");
        const newChanges = { ...changes };
        delete newChanges[productId];
        setChanges(newChanges);
      } else {
        alert("Stock Update Failed");
      }
    } catch (error) {
      alert("Connection Error");
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      // Ensure any unsaved edits on screen are reflected in the export
      const productsToExport = products.map((p) => ({
        ...p,
        stock_quantity: changes[p.id]?.stock_quantity ?? p.stock_quantity,
      }));
      await exportInventoryToExcel(productsToExport);
    } catch (error) {
      console.error("Export Excel error:", error);
      alert("Failed to export Excel file. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm),
  );

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">Stock Management</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Product <span className="text-slate-900 font-heading">Inventory</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Managing Stock Quantities</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-[320px] focus-within:border-[#FECD08]/40 transition-all">
            <FaSearch className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by ID or title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-[0.7rem] font-bold text-slate-900 placeholder:text-slate-400 tracking-tight" 
            />
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading || products.length === 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[0.7rem] uppercase tracking-wider shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Download complete inventory and variant stock report as Excel"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FaFileExcel className="text-white text-sm" />
                <span>Export Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Scanning Inventory...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th width="80" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Image</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Product Name</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">ID</th>
                  <th align="center" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-center">Update Stock</th>
                  <th width="120" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-center">In Stock</th>
                  <th width="80" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
                  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

                  return (
                    <>
                      {currentItems.length > 0 ? (
                        currentItems.map((p) => {
                          const stock = changes[p.id]?.stock_quantity ?? p.stock_quantity;
                          return (
                            <tr key={p.id} className="group transition-all hover:bg-slate-100/50">
                              <td className="p-6">
                                <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white group-hover:border-[#FECD08]/30 transition-all duration-500">
                                  <img src={getImageUrl(p.image)} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                </div>
                              </td>
                              <td className="p-6">
                                <span className="font-bold text-slate-900 text-[0.8rem] uppercase tracking-tight group-hover:text-[#b89000] transition-colors block">{p.title}</span>
                                <span className="text-[0.5rem] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">PATH: /{p.slug}</span>
                              </td>
                              <td className="p-6">
                                <span className="font-mono text-[0.65rem] text-slate-700 tracking-widest bg-slate-100 px-2 py-1 rounded-md">ID-{p.id}</span>
                              </td>
                              <td className="p-6 text-center">
                                <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-orm-gold/50 transition-all">
                                   <input
                                    type="number"
                                    className="w-[100px] bg-transparent p-3 text-center font-black text-[0.9rem] text-slate-900 outline-none"
                                    value={stock}
                                    onChange={(e) => handleStockChange(p.id, e.target.value)}
                                  />
                                </div>
                              </td>
                              <td className="p-6 text-center">
                                <div className="flex flex-col items-center gap-1">
                                   <span className={`text-[0.7rem] font-black ${stock > 0 ? "text-[#b89000]" : "text-red-500"} tracking-tight`}>{stock} Items</span>
                                   {stock === 0 && <FaExclamationTriangle className="text-red-500 text-[0.6rem] animate-pulse" />}
                                </div>
                              </td>
                              <td className="p-6 text-right">
                                {changes[p.id] ? (
                                  <button
                                    className="w-10 h-10 bg-[#FECD08] text-[#212121] font-bold rounded-xl flex items-center justify-center transition-all hover:shadow-[0_0_20px_rgba(251,176,59,0.3)] active:scale-90 animate-fadeInUp"
                                    onClick={() => saveStock(p)}
                                  >
                                    <FaSave size={14} />
                                  </button>
                                ) : (
                                  <div className="w-10 h-10 flex items-center justify-center text-slate-900/5">
                                     <FaSave size={14} />
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-20 text-center">
                             <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-300">No products found</span>
                          </td>
                        </tr>
                      )}

                      {/* PAGINATION BLOCK */}
                      {filteredProducts.length > 0 && (
                        <tr>
                          <td colSpan="6" className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} entries
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

export default Inventory;
