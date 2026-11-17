import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaStar,
  FaExternalLinkAlt,
  FaFire,
  FaSave,
  FaCheckCircle,
} from "react-icons/fa";

const cleanImageUrl = (path) => {
  if (!path) return "";
  const pathStr = path.toString().trim();
  if (
    pathStr.includes("http://") ||
    pathStr.includes("https://") ||
    pathStr.includes("http//") ||
    pathStr.includes("https//")
  ) {
    let clean = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;
    return clean.replace("https//", "https://").replace("http//", "http://");
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
  return `${apiBase}${cleanPath}`;
};

const TopSellingAdmin = () => {
  const [topCollection, setTopCollection] = useState(null);
  const [assignedProducts, setAssignedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const token = localStorage.getItem("orm_admin_token");
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchData();
  }, []);

  const parseSlugsFromDescription = (desc) => {
    if (!desc) return [];
    try {
      const parsed = JSON.parse(desc);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all collections to find "Top Selling Items"
      const colRes = await fetch(`${apiBase}/api/collections/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const colData = await colRes.json();
      let targetCol = colData.find(
        (c) => c.title.toLowerCase() === "top selling items" || c.title.toLowerCase() === "top selling"
      );

      // If collection doesn't exist, create it via POST
      if (!targetCol) {
        const createRes = await fetch(`${apiBase}/api/collections/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            title: "Top Selling Items",
            category: "Accessories",
            description: "[]",
          }),
        });
        targetCol = await createRes.json();
      }
      setTopCollection(targetCol);

      // 2. Fetch all products
      const prodRes = await fetch(`${apiBase}/api/products/`);
      const prodData = await prodRes.json();
      setAllProducts(prodData);

      // 3. Filter products assigned to this collection and sort by stored order
      if (targetCol) {
        const orderedSlugs = parseSlugsFromDescription(targetCol.description);
        const assigned = prodData.filter((p) => p.collections?.includes(targetCol.id));

        const sortedAssigned = assigned.sort((a, b) => {
          const indexA = orderedSlugs.indexOf(a.slug);
          const indexB = orderedSlugs.indexOf(b.slug);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        setAssignedProducts(sortedAssigned);
      }
    } catch (err) {
      console.error("Error loading Top Selling data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to persist ordered slugs into Collection description
  const saveCollectionOrder = async (updatedList, colId) => {
    const targetId = colId || topCollection?.id;
    if (!targetId) return;
    const orderedSlugs = updatedList.map((p) => p.slug);
    try {
      await fetch(`${apiBase}/api/collections/${targetId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          description: JSON.stringify(orderedSlugs),
        }),
      });
      setStatusMessage("Saved & Synced to Storefront!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (err) {
      console.error("Error saving collection order:", err);
    }
  };

  // Add product to Top Selling collection
  const handleAddProduct = async (product) => {
    if (!topCollection) return;
    setActionLoading(true);
    try {
      const currentCols = product.collections || [];
      if (!currentCols.includes(topCollection.id)) {
        const updatedCols = [...currentCols, topCollection.id];
        const res = await fetch(`${apiBase}/api/products/${product.slug}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ collections: updatedCols }),
        });
        if (res.ok) {
          const updatedProd = await res.json();
          const newList = [...assignedProducts, updatedProd];
          setAssignedProducts(newList);
          setAllProducts((prev) =>
            prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
          );
          setSearchQuery("");
          await saveCollectionOrder(newList, topCollection.id);
        }
      }
    } catch (err) {
      console.error("Error adding product to Top Selling:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove product from Top Selling collection
  const handleRemoveProduct = async (product) => {
    if (!topCollection) return;
    const confirmRemove = window.confirm(
      `Remove "${product.title}" from Top Selling Items?`
    );
    if (!confirmRemove) return;

    setActionLoading(true);
    try {
      const currentCols = product.collections || [];
      const updatedCols = currentCols.filter((cId) => cId !== topCollection.id);
      const res = await fetch(`${apiBase}/api/products/${product.slug}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ collections: updatedCols }),
      });
      if (res.ok) {
        const newList = assignedProducts.filter((p) => p.id !== product.id);
        setAssignedProducts(newList);
        setAllProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, collections: updatedCols } : p
          )
        );
        await saveCollectionOrder(newList, topCollection.id);
      }
    } catch (err) {
      console.error("Error removing product from Top Selling:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reorder assigned products in UI state and save order
  const handleMove = async (index, direction) => {
    const newItems = [...assignedProducts];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setAssignedProducts(newItems);
    await saveCollectionOrder(newItems);
  };

  // Search filter for unassigned products
  const searchResults = searchQuery.trim()
    ? allProducts.filter(
        (p) =>
          (p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !assignedProducts.some((ap) => ap.id === p.id)
      )
    : [];

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-[#FECD08] rounded-full animate-pulse shadow-[0_0_10px_#FECD08]"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-[#b89000]">
              Homepage Manager
            </span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none flex items-center gap-3">
            Top Selling <span className="text-[#b89000]">Items</span> <FaFire className="text-[#b89000] text-2xl" />
          </h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Control the exact products and order displayed in the Top Selling section on the Storefront Homepage
          </p>
        </div>

        <div className="flex items-center gap-4">
          {statusMessage && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-1.5 animate-fadeIn">
              <FaCheckCircle /> {statusMessage}
            </span>
          )}
          <a
            href="https://lbcmoto.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[0.65rem] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all"
          >
            View Storefront <FaExternalLinkAlt size={10} />
          </a>
        </div>
      </div>

      {/* SEARCH AND ADD PRODUCT BAR */}
      <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">
            Add Product to Top Selling
          </h3>
          <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">
            {assignedProducts.length} Products Assigned
          </span>
        </div>

        <div className="relative">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product by title or SKU to add..."
              className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchQuery.trim() !== "" && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto p-2 space-y-1">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No matching unassigned products found
                </div>
              ) : (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={cleanImageUrl(p.image)}
                        alt={p.title}
                        className="w-12 h-12 object-contain bg-slate-100 rounded-lg p-1"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[0.65rem] text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-700 font-bold">
                            ₹{parseFloat(p.price).toLocaleString("en-IN")}
                          </span>
                          <span>•</span>
                          <span className="uppercase tracking-wider">{p.category}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddProduct(p)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-[#FECD08] text-[#212121] font-bold rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      <FaPlus size={10} /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* HOMEPAGE LAYOUT MAP (ASSIGNED PRODUCTS) */}
      <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-[0.85rem] font-black text-slate-900 uppercase tracking-[0.2em]">
              Homepage Display Order
            </h3>
            <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mt-1">
              Position #1 is featured on the Left. Positions #2–5 appear in the 2×2 Right Grid. Use Move buttons to reorder!
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            Loading Top Selling Items...
          </div>
        ) : assignedProducts.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-2xl border border-slate-200">
            No products assigned to Top Selling Items. Use the search bar above to add products!
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT FEATURED POSITION (#1) */}
            <div className="col-span-5 max-lg:col-span-12 flex flex-col">
              <div className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-[#b89000] mb-3 flex items-center gap-2">
                <FaStar /> Position #1 — Main Left Featured Card
              </div>
              {assignedProducts[0] ? (
                <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between h-full border border-slate-800 relative group">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => handleMove(0, 1)}
                      disabled={assignedProducts.length <= 1}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all disabled:opacity-30"
                      title="Move down"
                    >
                      <FaArrowDown size={12} />
                    </button>
                    <button
                      onClick={() => handleRemoveProduct(assignedProducts[0])}
                      className="w-8 h-8 rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-all"
                      title="Remove from Top Selling"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>

                  <div className="h-60 flex items-center justify-center p-4 bg-slate-950 rounded-xl mb-4">
                    <img
                      src={cleanImageUrl(assignedProducts[0].image)}
                      alt={assignedProducts[0].title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <span className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-[#b89000] block mb-1">
                      Featured Spot
                    </span>
                    <h4 className="text-sm font-bold line-clamp-2 mb-2">
                      {assignedProducts[0].title}
                    </h4>
                    <div className="text-base font-black text-white">
                      ₹{parseFloat(assignedProducts[0].price).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* RIGHT GRID POSITIONS (#2 – #5) */}
            <div className="col-span-7 max-lg:col-span-12 space-y-3">
              <div className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">
                Positions #2 to #5 — Right 2×2 Grid
              </div>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                {assignedProducts.slice(1, 5).map((p, idx) => {
                  const actualIdx = idx + 1;
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative group hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-slate-200 text-slate-800 text-[0.6rem] font-black rounded-lg uppercase tracking-wider">
                          Spot #{actualIdx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMove(actualIdx, -1)}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all"
                            title="Move Up"
                          >
                            <FaArrowUp size={10} />
                          </button>
                          <button
                            onClick={() => handleMove(actualIdx, 1)}
                            disabled={actualIdx >= assignedProducts.length - 1}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all disabled:opacity-30"
                            title="Move Down"
                          >
                            <FaArrowDown size={10} />
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(p)}
                            className="w-7 h-7 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"
                            title="Remove"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      </div>

                      <div className="h-28 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center mb-3">
                        <img
                          src={cleanImageUrl(p.image)}
                          alt={p.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-1">
                          {p.title}
                        </h4>
                        <div className="text-xs font-black text-slate-900">
                          ₹{parseFloat(p.price).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {assignedProducts.length < 5 &&
                  [...Array(Math.max(0, 5 - assignedProducts.length))].map((_, i) => (
                    <div
                      key={i}
                      className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 min-h-[180px]"
                    >
                      <FaPlus size={16} />
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider">
                        Empty Spot #{assignedProducts.length + i + 1}
                      </span>
                      <span className="text-[0.55rem] text-slate-400">
                        Use search above to assign product
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopSellingAdmin;
