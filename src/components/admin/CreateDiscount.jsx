import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaTag,
  FaCalendarAlt,
  FaCheckCircle,
  FaSave,
  FaPercent,
  FaWallet,
  FaGlobe,
  FaBoxOpen,
  FaTags,
  FaLayerGroup,
  FaPalette,
  FaSearch,
  FaTimes,
  FaCheck,
} from "react-icons/fa";

const CATEGORIES = [
  "Brand",
  "Mototech",
  "Accessories",
  "Riding Gears",
  "Touring & Luggage",
  "Fuel Tank",
];

const CreateDiscount = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: "",
    valid_from: "",
    valid_to: "",
    minimum_purchase_amount: "0",
    applies_to: "all",
    products: [],
    categories: [],
    collections: [],
    variants: [],
  });

  const [allProducts, setAllProducts] = useState([]);
  const [allCollections, setAllCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Search & Filter states for selection
  const [productSearch, setProductSearch] = useState("");
  const [variantSearch, setVariantSearch] = useState("");
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

  // Helper to resolve image URL
  const resolveImageUrl = (img) => {
    if (!img) return null;
    const str = img.toString().trim();
    if (str.startsWith("http://") || str.startsWith("https://")) {
      return str;
    }
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    return `${baseUrl}${str.startsWith("/") ? "" : "/"}${str}`;
  };

  // Fetch initial catalog data: products and collections
  useEffect(() => {
    const token = localStorage.getItem("orm_admin_token");
    const headers = token ? { Authorization: `Token ${token}` } : {};

    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/`, { headers }).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/collections/`, { headers }).then((r) => r.json()),
    ])
      .then(([productsData, collectionsData]) => {
        setAllProducts(Array.isArray(productsData) ? productsData : []);
        setAllCollections(Array.isArray(collectionsData) ? collectionsData : []);
      })
      .catch((err) => console.error("Catalog load error:", err))
      .finally(() => setDataLoading(false));
  }, []);

  // Fetch coupon in edit mode
  useEffect(() => {
    if (isEditMode) {
      const token = localStorage.getItem("orm_admin_token");
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coupons/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const formatForInput = (isoString) => (isoString ? isoString.slice(0, 16) : "");
          setFormData({
            code: data.code || "",
            discount_percentage: data.discount_percentage ?? "",
            valid_from: formatForInput(data.valid_from),
            valid_to: formatForInput(data.valid_to),
            minimum_purchase_amount: data.minimum_purchase_amount || "0",
            applies_to: data.applies_to || "all",
            products: Array.isArray(data.products) ? data.products : [],
            categories: Array.isArray(data.categories) ? data.categories : [],
            collections: Array.isArray(data.collections) ? data.collections : [],
            variants: Array.isArray(data.variants) ? data.variants : [],
          });
        })
        .catch((err) => console.error("Coupon load error:", err));
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code: random });
  };

  // Toggle selection helpers
  const toggleProduct = (productId) => {
    setFormData((prev) => {
      const exists = prev.products.includes(productId);
      return {
        ...prev,
        products: exists
          ? prev.products.filter((pid) => pid !== productId)
          : [...prev.products, productId],
      };
    });
  };

  const toggleCategory = (catName) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(catName);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== catName)
          : [...prev.categories, catName],
      };
    });
  };

  const toggleCollection = (collId) => {
    setFormData((prev) => {
      const exists = prev.collections.includes(collId);
      return {
        ...prev,
        collections: exists
          ? prev.collections.filter((cid) => cid !== collId)
          : [...prev.collections, collId],
      };
    });
  };

  const toggleVariant = (variantId) => {
    setFormData((prev) => {
      const exists = prev.variants.includes(variantId);
      return {
        ...prev,
        variants: exists
          ? prev.variants.filter((vid) => vid !== variantId)
          : [...prev.variants, variantId],
      };
    });
  };

  // Filtered lists for UI selectors
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 20);
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [allProducts, productSearch]);

  const selectedProductsList = useMemo(() => {
    const idSet = new Set(formData.products);
    return allProducts.filter((p) => idSet.has(p.id));
  }, [allProducts, formData.products]);

  // Flattened variants for lookup
  const allVariantsMap = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => {
      if (Array.isArray(p.variants)) {
        p.variants.forEach((v) => {
          map.set(v.id, { ...v, productTitle: p.title, productThumb: p.image });
        });
      }
    });
    return map;
  }, [allProducts]);

  const selectedVariantsList = useMemo(() => {
    return formData.variants
      .map((vid) => allVariantsMap.get(vid))
      .filter(Boolean);
  }, [formData.variants, allVariantsMap]);

  const filteredVariantProducts = useMemo(() => {
    if (!variantSearch.trim()) return allProducts.slice(0, 20);
    const q = variantSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [allProducts, variantSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert("Please enter or generate a coupon code.");
      return;
    }
    if (!formData.discount_percentage) {
      alert("Please specify discount percentage.");
      return;
    }

    // Validation for scoped applications
    if (formData.applies_to === "products" && formData.products.length === 0) {
      alert("Please select at least one product for this discount.");
      return;
    }
    if (formData.applies_to === "categories" && formData.categories.length === 0) {
      alert("Please select at least one category for this discount.");
      return;
    }
    if (formData.applies_to === "collections" && formData.collections.length === 0) {
      alert("Please select at least one collection for this discount.");
      return;
    }
    if (formData.applies_to === "variants" && formData.variants.length === 0) {
      alert("Please select at least one product variant for this discount.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("orm_admin_token");
    const payload = {
      code: formData.code.trim().toUpperCase(),
      discount_percentage: parseInt(formData.discount_percentage, 10),
      minimum_purchase_amount: formData.minimum_purchase_amount || "0.00",
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
      valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      applies_to: formData.applies_to,
      products: formData.applies_to === "products" ? formData.products : [],
      categories: formData.applies_to === "categories" ? formData.categories : [],
      collections: formData.applies_to === "collections" ? formData.collections : [],
      variants: formData.applies_to === "variants" ? formData.variants : [],
    };

    try {
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coupons/${id}/`
        : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coupons/`;
      const method = isEditMode ? "PATCH" : "POST";
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(isEditMode ? "Discount Code Updated Successfully!" : "Discount Code Created Successfully!");
        navigate("/react-admin/discount");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Validation Error: ${JSON.stringify(errData)}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network or Server Error while saving discount.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this discount offer?")) return;
    const token = localStorage.getItem("orm_admin_token");
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/coupons/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      navigate("/react-admin/discount");
    } catch (e) {
      console.error(e);
      alert("Failed to delete discount.");
    }
  };

  return (
    <div className="space-y-10 animate-fadeInUp pb-20">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white shadow-sm backdrop-blur-3xl border border-slate-200 p-8 rounded-[2rem] sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/react-admin/discount")}
            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 transition-all hover:text-slate-900 hover:border-slate-300 active:scale-90"
          >
            <FaArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
              <span className="text-[0.55rem] font-black uppercase tracking-[0.4em] text-[#FECD08]/70">
                {isEditMode ? "Edit Discount" : "New Discount"}
              </span>
            </div>
            <h2 className="text-[1.8rem] font-black text-slate-900 uppercase tracking-tighter leading-none">
              {isEditMode ? "Edit" : "Create"} <span className="text-slate-900 font-heading">Discount</span>
            </h2>
          </div>
        </div>
        <div className="flex gap-4">
          {isEditMode && (
            <button
              type="button"
              className="px-8 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] border border-red-500/20 text-red-500/70 transition-all hover:bg-red-500/10 hover:text-red-500"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-10 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] transition-all flex items-center gap-3 hover:shadow-[0_10px_30px_rgba(228,44,67,0.3)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            <span className="relative z-10 flex items-center gap-3">
              {loading ? "Saving..." : "Save Discount"} <FaSave />
            </span>
            <div className="absolute inset-0 bg-black/10 translate-y-[100%] transition-transform duration-300 group-hover:translate-y-0"></div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CORE SPECS */}
        <div className="col-span-8 flex flex-col gap-8 max-lg:col-span-12">
          {/* DISCOUNT DEFINITION */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <FaTag className="text-[#b89000]" />
              <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Coupon Details</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
                  Discount Code
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-black tracking-widest uppercase outline-none focus:border-[#FECD08] transition-all"
                    placeholder="e.g. SUMMER2024"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-6 rounded-xl bg-slate-100 text-[#b89000] text-[0.6rem] font-black uppercase tracking-widest hover:bg-red-50 hover:border hover:border-red-200 transition-all"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
                    Discount Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discount_percentage"
                      min="1"
                      max="100"
                      value={formData.discount_percentage}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold outline-none focus:border-[#FECD08] transition-all"
                      placeholder="10"
                    />
                    <FaPercent className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
                    Minimum Purchase (Rs)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="minimum_purchase_amount"
                      min="0"
                      value={formData.minimum_purchase_amount}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold outline-none focus:border-[#FECD08] transition-all"
                      placeholder="0.00"
                    />
                    <FaWallet className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* APPLIES TO (TARGETED SELECTION) */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <FaBoxesIcon className="text-[#b89000]" />
                <div>
                  <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Applies To (Scope)</h3>
                  <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Choose what items qualify for this discount
                  </p>
                </div>
              </div>
            </div>

            {/* SCOPE SELECTOR TABS */}
            <div className="grid grid-cols-5 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              {[
                { id: "all", label: "All Products", desc: "Entire store", icon: FaGlobe },
                { id: "products", label: "Specific Products", desc: "Selected items", icon: FaBoxOpen },
                { id: "categories", label: "Categories", desc: "E.g. Riding Gears", icon: FaTags },
                { id: "collections", label: "Collections", desc: "Curated sets", icon: FaLayerGroup },
                { id: "variants", label: "Variants", desc: "Colors, sizes, SKUs", icon: FaPalette },
              ].map((scope) => {
                const Icon = scope.icon;
                const active = formData.applies_to === scope.id;
                return (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, applies_to: scope.id })}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      active
                        ? "border-[#FECD08] bg-red-500/5 shadow-sm ring-2 ring-[#FECD08]/30"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          active ? "bg-[#FECD08] text-[#212121] font-bold" : "bg-white text-slate-500 border border-slate-200"
                        }`}
                      >
                        <Icon size={12} />
                      </div>
                      {active && <FaCheck className="text-[#b89000]" size={10} />}
                    </div>
                    <div>
                      <div className={`text-[0.7rem] font-black uppercase tracking-wider ${active ? "text-[#b89000]" : "text-slate-800"}`}>
                        {scope.label}
                      </div>
                      <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest">
                        {scope.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SCOPE 1: ALL PRODUCTS */}
            {formData.applies_to === "all" && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4 text-slate-600">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-500">
                  <FaCheckCircle size={16} />
                </div>
                <div>
                  <h4 className="text-[0.7rem] font-black uppercase tracking-wider text-slate-900">
                    Store-wide Application
                  </h4>
                  <p className="text-[0.6rem] font-medium text-slate-500">
                    This coupon applies to every single product and variant in the customer's cart.
                  </p>
                </div>
              </div>
            )}

            {/* SCOPE 2: SPECIFIC PRODUCTS */}
            {formData.applies_to === "products" && (
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
                    Search & Select Products ({formData.products.length} Selected)
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="text"
                      placeholder="Search by title, SKU, or category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-slate-900 text-xs font-bold outline-none focus:border-[#FECD08] transition-all"
                    />
                  </div>
                </div>

                {/* PRODUCT SELECTION SCROLLER */}
                <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      No matching products found
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = formData.products.includes(p.id);
                      const imgUrl = resolveImageUrl(p.image);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? "bg-red-500/10 border-[#FECD08] shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {imgUrl ? (
                                <img src={imgUrl} alt={p.title} className="w-full h-full object-cover" />
                              ) : (
                                <FaBoxOpen className="text-slate-300" size={14} />
                              )}
                            </div>
                            <div>
                              <div className="text-[0.7rem] font-black text-slate-900 line-clamp-1">{p.title}</div>
                              <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-wider">
                                {p.category} {p.sku ? `• SKU: ${p.sku}` : ""} • Rs. {p.price}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-[#FECD08] border-[#FECD08] text-white"
                                : "bg-white border-slate-300 text-transparent"
                            }`}
                          >
                            <FaCheck size={10} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* SELECTED PRODUCTS CHIPS */}
                {selectedProductsList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[0.6rem] font-black uppercase tracking-widest text-slate-600">
                        Selected Products ({selectedProductsList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, products: [] })}
                        className="text-[0.55rem] font-black uppercase tracking-widest text-[#b89000] hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-100/60 rounded-xl border border-slate-200">
                      {selectedProductsList.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-[0.65rem] font-bold text-slate-800 shadow-sm"
                        >
                          <span className="max-w-[180px] truncate">{p.title}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProduct(p.id);
                            }}
                            className="text-slate-400 hover:text-[#b89000] ml-1"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCOPE 3: CATEGORIES */}
            {formData.applies_to === "categories" && (
              <div className="space-y-4 pt-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1 block">
                  Select Applicable Categories ({formData.categories.length} Selected)
                </label>
                <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = formData.categories.includes(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-red-500/10 border-[#FECD08] shadow-sm text-[#b89000]"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-[0.7rem] font-black uppercase tracking-wider">{cat}</span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-[#FECD08] border-[#FECD08] text-white"
                              : "bg-white border-slate-300 text-transparent"
                          }`}
                        >
                          <FaCheck size={9} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCOPE 4: COLLECTIONS */}
            {formData.applies_to === "collections" && (
              <div className="space-y-4 pt-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1 block">
                  Select Applicable Collections ({formData.collections.length} Selected)
                </label>
                {allCollections.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No collections found
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1 max-h-72 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50">
                    {allCollections.map((col) => {
                      const isSelected = formData.collections.includes(col.id);
                      const imgUrl = resolveImageUrl(col.image);
                      return (
                        <div
                          key={col.id}
                          onClick={() => toggleCollection(col.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-red-500/10 border-[#FECD08] shadow-sm"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {imgUrl ? (
                                <img src={imgUrl} alt={col.title} className="w-full h-full object-cover" />
                              ) : (
                                <FaLayerGroup className="text-slate-300" size={14} />
                              )}
                            </div>
                            <div>
                              <div className="text-[0.7rem] font-black text-slate-900">{col.title}</div>
                              <div className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-wider">
                                {col.category || "Collection"}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-[#FECD08] border-[#FECD08] text-white"
                                : "bg-white border-slate-300 text-transparent"
                            }`}
                          >
                            <FaCheck size={10} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SCOPE 5: VARIANTS */}
            {formData.applies_to === "variants" && (
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
                    1. Pick a Product to view its Variants
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="text"
                      placeholder="Search product with variants..."
                      value={variantSearch}
                      onChange={(e) => setVariantSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-slate-900 text-xs font-bold outline-none focus:border-[#FECD08] transition-all"
                    />
                  </div>
                </div>

                {/* PRODUCT CAROUSEL / LIST FOR VARIANT PICKING */}
                <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                  {filteredVariantProducts.map((p) => {
                    const isCurrent = selectedProductForVariant?.id === p.id;
                    const variantCount = Array.isArray(p.variants) ? p.variants.length : 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProductForVariant(p)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                          isCurrent
                            ? "bg-[#FECD08] text-[#212121] font-bold border-[#FECD08] shadow-sm"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[0.7rem] font-black line-clamp-1">{p.title}</span>
                        </div>
                        <span
                          className={`text-[0.55rem] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isCurrent ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {variantCount} Variants
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* SHOW VARIANTS OF SELECTED PRODUCT */}
                {selectedProductForVariant && (
                  <div className="space-y-3 p-4 bg-slate-100/70 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[0.6rem] font-black uppercase tracking-widest text-slate-700">
                        Variants for: {selectedProductForVariant.title}
                      </span>
                    </div>

                    {!selectedProductForVariant.variants || selectedProductForVariant.variants.length === 0 ? (
                      <div className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        This product does not have any variants defined
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                        {selectedProductForVariant.variants.map((v) => {
                          const isSelected = formData.variants.includes(v.id);
                          return (
                            <div
                              key={v.id}
                              onClick={() => toggleVariant(v.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? "bg-red-500/10 border-[#FECD08] shadow-sm"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {v.color_code && (
                                  <div
                                    className="w-4 h-4 rounded-full border border-slate-300"
                                    style={{ backgroundColor: v.color_code }}
                                  ></div>
                                )}
                                <div>
                                  <div className="text-[0.7rem] font-black text-slate-900">{v.color}</div>
                                  <div className="text-[0.55rem] font-bold text-slate-400">
                                    {v.sku ? `SKU: ${v.sku} • ` : ""}Rs. {v.price || selectedProductForVariant.price}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                  isSelected
                                    ? "bg-[#FECD08] border-[#FECD08] text-white"
                                    : "bg-white border-slate-300 text-transparent"
                                }`}
                              >
                                <FaCheck size={9} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* SELECTED VARIANTS CHIPS */}
                {selectedVariantsList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[0.6rem] font-black uppercase tracking-widest text-slate-600">
                        Selected Variants ({selectedVariantsList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, variants: [] })}
                        className="text-[0.55rem] font-black uppercase tracking-widest text-[#b89000] hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-100/60 rounded-xl border border-slate-200">
                      {selectedVariantsList.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-[0.65rem] font-bold text-slate-800 shadow-sm"
                        >
                          <span>
                            {v.productTitle} — <span className="text-[#b89000]">{v.color}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVariant(v.id);
                            }}
                            className="text-slate-400 hover:text-[#b89000] ml-1"
                          >
                            <FaTimes size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACTIVE WINDOW */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <FaCalendarAlt className="text-[#b89000]" />
              <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Active Dates</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="valid_from"
                  value={formData.valid_from}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold outline-none focus:border-[#FECD08] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="valid_to"
                  value={formData.valid_to}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold outline-none focus:border-[#FECD08] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="col-span-4 flex flex-col gap-8 max-lg:col-span-12">
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8 sticky top-32">
            <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 pb-4 border-b border-slate-200">
              Summary
            </h3>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                <div className="text-[0.5rem] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">
                  Coupon Code
                </div>
                <div
                  className={`text-xl font-black tracking-widest ${
                    formData.code ? "text-[#b89000]" : "text-slate-300 italic"
                  }`}
                >
                  {formData.code || "No code set"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <FaCheckCircle className="text-[#b89000] shrink-0" size={12} />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest">
                    {formData.discount_percentage ? `${formData.discount_percentage}% Discount` : "No value set"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <FaCheckCircle className="text-[#b89000] shrink-0" size={12} />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest">
                    {formData.applies_to === "all" && "Global Store Application"}
                    {formData.applies_to === "products" &&
                      (formData.products.length > 0
                        ? `Applied to ${formData.products.length} Products`
                        : "No Products Selected")}
                    {formData.applies_to === "categories" &&
                      (formData.categories.length > 0
                        ? `Applied to: ${formData.categories.join(", ")}`
                        : "No Categories Selected")}
                    {formData.applies_to === "collections" &&
                      (formData.collections.length > 0
                        ? `Applied to ${formData.collections.length} Collections`
                        : "No Collections Selected")}
                    {formData.applies_to === "variants" &&
                      (formData.variants.length > 0
                        ? `Applied to ${formData.variants.length} Variants`
                        : "No Variants Selected")}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <FaCheckCircle className="text-[#b89000] shrink-0" size={12} />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest">
                    {formData.minimum_purchase_amount > 0
                      ? `Min Purchase: Rs. ${formData.minimum_purchase_amount}`
                      : "No Minimum Purchase"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Fallback Icon wrapper
const FaBoxesIcon = ({ className }) => <FaLayerGroup className={className} />;

export default CreateDiscount;
