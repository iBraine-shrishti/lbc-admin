import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSaleStatus, setSelectedSaleStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSaleStatus, itemsPerPage]);

  const categoryOptions = [
    { label: "All Categories", value: "All" },
    { label: "Brand", value: "Brand" },
    { label: "Mototech", value: "Mototech" },
    { label: "Accessories", value: "Accessories" },
    { label: "Riding Gears", value: "Riding Gears" },
    { label: "Touring & Luggage", value: "Touring & Luggage" },
    { label: "Fuel Tank", value: "Fuel Tank" },
  ];

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setLoading(false);
      });
  }, []);

  // --- FILTER LOGIC ---
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSale =
      selectedSaleStatus === "All"
        ? true
        : selectedSaleStatus === "On Sale"
          ? product.is_sale === true
          : product.is_sale === false;

    return matchesSearch && matchesCategory && matchesSale;
  });

  // --- DELETE LOGIC ---
  const handleDelete = async (slug, id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const token = localStorage.getItem("orm_admin_token");
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/${slug}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Token ${token}`,
            },
          },
        );
        if (response.ok) {
          setProducts(products.filter((product) => product.id !== id));
        } else {
          alert("Failed to delete. The product might have dependencies.");
        }
      } catch (error) {
        alert("Server Error");
      }
    }
  };

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

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">Inventory Management</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">All <span className="text-slate-900 font-heading">Products</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Managing {filteredProducts.length} Products</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-[240px] focus-within:border-orm-gold/50 transition-all">
            <FaSearch className="text-slate-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none ml-3 w-full text-[0.75rem] font-bold text-slate-900 placeholder:text-slate-300 tracking-tight"
            />
          </div>

          <select
            className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-500 text-[0.7rem] font-bold outline-none focus:border-[#FECD08] cursor-pointer transition-all"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-slate-900">{opt.label}</option>
            ))}
          </select>

          <select
            className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-500 text-[0.7rem] font-bold outline-none focus:border-[#FECD08] cursor-pointer transition-all"
            value={selectedSaleStatus}
            onChange={(e) => setSelectedSaleStatus(e.target.value)}
          >
            <option value="All" className="bg-white text-slate-900">All Status</option>
            <option value="On Sale" className="bg-white text-slate-900">On Sale</option>
            <option value="Regular" className="bg-white text-slate-900">Regular</option>
          </select>

          <Link to="/react-admin/add-product" className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-6 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] hover:-translate-y-1">
            <span className="relative z-10 flex items-center gap-2"><FaPlus size={10} /> Add Product</span>
            <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
          </Link>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Products...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Image</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Product Information</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Category</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Inventory</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Price</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Status</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Actions</th>
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
                        currentItems.map((product) => (
                          <tr key={product.id} className="group transition-all hover:bg-slate-100/50">
                            <td className="p-6">
                              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white group-hover:border-[#FECD08]/30 transition-all duration-500">
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.title}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-slate-900 text-[0.85rem] tracking-tight group-hover:text-[#b89000] transition-colors">{product.title}</span>
                                <span className="text-[0.5rem] font-black text-slate-500 uppercase tracking-[0.2em]">URL: /{product.slug}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[0.6rem] font-black text-slate-500 uppercase tracking-widest">{product.category}</span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                 <div className={`w-1.5 h-1.5 rounded-full ${product.stock_quantity > 0 ? "bg-green-500" : "bg-red-500"} animate-pulse`}></div>
                                 <span className={`text-[0.65rem] font-bold ${product.stock_quantity > 0 ? "text-slate-500" : "text-red-500/60 uppercase tracking-widest"}`}>
                                   {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                                 </span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="font-black text-slate-900 text-[0.8rem] tracking-tighter">Rs. {Number(product.price).toLocaleString()}</span>
                            </td>
                            <td className="p-6">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${product.is_sale ? "bg-[#FECD08]/10 border-[#FECD08]/20 text-[#b89000]" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                                 <div className={`w-1 h-1 rounded-full ${product.is_sale ? "bg-[#FECD08]" : "bg-white/40"}`}></div>
                                 <span className="text-[0.55rem] font-black uppercase tracking-widest">{product.is_sale ? "On Sale" : "Regular"}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="flex justify-end gap-2">
                                <button
                                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-[#FECD08] hover:text-white active:scale-90"
                                  onClick={() => navigate(`/react-admin/edit-product/${product.slug}`)}
                                >
                                  <FaEdit size={14} />
                                </button>
                                <button
                                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 active:scale-90"
                                  onClick={() => handleDelete(product.slug, product.id)}
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-20 text-center">
                             <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-300">No products found</span>
                          </td>
                        </tr>
                      )}

                      {/* PAGINATION BLOCK */}
                      {filteredProducts.length > 0 && (
                        <tr>
                          <td colSpan="7" className="p-6 bg-slate-50 border-t border-slate-100">
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
          </div>
        ) }
      </div>
    </div>
  );
};

export default AllProducts;
