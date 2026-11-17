import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaShoppingBag,
  FaUser,
  FaSearch,
  FaTrash,
  FaPlus,
  FaMinus,
  FaTag,
  FaCheckCircle,
  FaBox,
  FaCreditCard,
  FaExclamationCircle,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import { lookupPincode } from "../../utils/addressLookup";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CreateOrder = () => {
  const navigate = useNavigate();

  // Customer Form State
  const [customerInfo, setCustomerInfo] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null);

  const handleZipCodeChange = async (e) => {
    const rawVal = e.target.value;
    const numeric = rawVal.replace(/\D/g, "").slice(0, 6);
    setCustomerInfo((prev) => ({ ...prev, zip_code: numeric }));

    if (numeric.length === 6) {
      setPincodeLoading(true);
      setPincodeStatus({ message: "Fetching City & State...", success: null });
      const res = await lookupPincode(numeric);
      setPincodeLoading(false);
      if (res.success) {
        setCustomerInfo((prev) => ({
          ...prev,
          city: res.city || prev.city,
          state: res.state || prev.state,
        }));
        setPincodeStatus({
          success: true,
          message: `${res.city}, ${res.state}`,
        });
      } else {
        setPincodeStatus({
          success: false,
          message: res.error || "Pincode not found",
        });
      }
    } else {
      setPincodeStatus(null);
    }
  };

  // Items State (each item has product_id, title, image, base_price, item_discount_type, item_discount_val, price, quantity, color, size, material)
  const [items, setItems] = useState([]);

  // Order-level Discount & Financials State
  const [discountType, setDiscountType] = useState("fixed"); // "fixed" or "percentage"
  const [discountValue, setDiscountValue] = useState("");
  const [shippingFee, setShippingFee] = useState("0");
  const [isPaid, setIsPaid] = useState(true);
  const [status, setStatus] = useState("Processing");
  const [customNote, setCustomNote] = useState("");

  // Product Search State
  const [productQuery, setProductQuery] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Customer Prefill Search
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Search Products Debounce
  useEffect(() => {
    if (!productQuery.trim()) {
      setProductSearchResults([]);
      setShowProductDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      const token = localStorage.getItem("orm_admin_token");
      fetch(`${BASE_URL}/api/products/?search=${encodeURIComponent(productQuery)}`, {
        headers: { Authorization: `Token ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setProductSearchResults(Array.isArray(data) ? data : []);
          setShowProductDropdown(true);
        })
        .catch((err) => console.error(err))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [productQuery]);

  // Search Customers Debounce
  useEffect(() => {
    if (!customerQuery.trim()) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      const token = localStorage.getItem("orm_admin_token");
      fetch(`${BASE_URL}/api/customers/?search=${encodeURIComponent(customerQuery)}`, {
        headers: { Authorization: `Token ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const resArray = Array.isArray(data) ? data : data.results || [];
          setCustomerResults(resArray);
          setShowCustomerDropdown(true);
        })
        .catch((err) => console.error(err));
    }, 300);

    return () => clearTimeout(timer);
  }, [customerQuery]);

  // Add Product to Order Items
  // Add Product to Order Items (Supports Base Product or Specific Variant)
  const handleAddProduct = (prod, variant = null) => {
    const cleanImg = variant?.image
      ? (variant.image.startsWith("http") ? variant.image : `${BASE_URL}${variant.image}`)
      : (prod.image?.startsWith("http") ? prod.image : `${BASE_URL}${prod.image}`);

    const baseP = variant
      ? (parseFloat(variant.price) || parseFloat(prod.price) || 0)
      : (parseFloat(prod.price) || 0);

    const variantColor = variant ? (variant.color || "") : (prod.color || "");

    const existingIndex = items.findIndex(
      (it) => it.product_id === prod.id && it.color === variantColor
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          title: prod.title,
          image: cleanImg,
          base_price: baseP,
          base_product_price: parseFloat(prod.price) || 0,
          item_discount_type: "fixed", // "fixed" or "percent"
          item_discount_val: "",
          price: baseP, // Final effective unit price charged
          quantity: 1,
          color: variantColor,
          size: prod.size || "",
          material: prod.material || "",
          variants: prod.variants || [],
        },
      ]);
    }

    setProductQuery("");
    setShowProductDropdown(false);
  };

  // Change variant from select dropdown in table
  const handleSelectVariantForItem = (index, selectedColor) => {
    const updated = [...items];
    const it = updated[index];
    const v = (it.variants || []).find((varItem) => varItem.color === selectedColor);
    if (v) {
      it.color = v.color;
      const newBase = parseFloat(v.price) || it.base_price;
      it.base_price = newBase;
      const numVal = parseFloat(it.item_discount_val) || 0;
      let discAmt = 0;
      if (it.item_discount_type === "percent") {
        discAmt = (newBase * numVal) / 100;
      } else {
        discAmt = numVal;
      }
      it.price = Math.max(0, newBase - discAmt);
      if (v.image) {
        it.image = v.image.startsWith("http") ? v.image : `${BASE_URL}${v.image}`;
      }
    } else {
      it.color = "";
      const newBase = parseFloat(it.base_product_price || it.base_price);
      it.base_price = newBase;
      it.price = newBase;
    }
    setItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Update Per-Item Discount
  const handleUpdateItemDiscount = (index, type, valStr) => {
    const updated = [...items];
    const item = updated[index];
    item.item_discount_type = type;
    item.item_discount_val = valStr;

    const numVal = parseFloat(valStr) || 0;
    const baseP = parseFloat(item.base_price) || 0;
    let discAmt = 0;

    if (type === "percent") {
      discAmt = (baseP * numVal) / 100;
    } else {
      discAmt = numVal;
    }

    const finalP = Math.max(0, baseP - discAmt);
    item.price = finalP;
    setItems(updated);
  };

  // Update Item Price Directly
  const handleUpdateItemPrice = (index, value) => {
    const updated = [...items];
    const val = parseFloat(value);
    updated[index].price = isNaN(val) || val < 0 ? 0 : val;
    setItems(updated);
  };

  // Update Item Variant / Quantity
  const handleUpdateItemField = (index, field, value) => {
    const updated = [...items];
    if (field === "quantity") {
      const val = parseInt(value, 10);
      updated[index].quantity = isNaN(val) || val < 1 ? 1 : val;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const [prefilledCustomerName, setPrefilledCustomerName] = useState("");

  // Prefill Customer
  const handleSelectCustomer = async (c) => {
    const nameStr = (c.full_name || `${c.first_name || ""} ${c.last_name || ""}`).trim() || c.username || "";
    const cleanZip = String(c.zip_code || "").trim();
    setCustomerInfo({
      full_name: nameStr,
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      zip_code: cleanZip,
    });
    setPrefilledCustomerName(nameStr || c.email);
    setCustomerQuery("");
    setShowCustomerDropdown(false);

    if (cleanZip && cleanZip.length === 6) {
      if (c.city && c.state) {
        setPincodeStatus({ success: true, message: `${c.city}, ${c.state}` });
      } else {
        setPincodeLoading(true);
        const res = await lookupPincode(cleanZip);
        setPincodeLoading(false);
        if (res.success) {
          setCustomerInfo((prev) => ({
            ...prev,
            city: prev.city || res.city,
            state: prev.state || res.state,
          }));
          setPincodeStatus({ success: true, message: `${res.city}, ${res.state}` });
        }
      }
    } else {
      setPincodeStatus(null);
    }
  };

  // Financial Calculations
  const subtotal = items.reduce(
    (acc, item) => acc + (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1),
    0
  );

  let orderDiscountAmount = 0;
  const numDiscountVal = parseFloat(discountValue) || 0;
  if (discountType === "percentage") {
    orderDiscountAmount = (subtotal * numDiscountVal) / 100;
  } else {
    orderDiscountAmount = numDiscountVal;
  }
  if (orderDiscountAmount > subtotal) orderDiscountAmount = subtotal;
  if (orderDiscountAmount < 0) orderDiscountAmount = 0;

  const numShipping = parseFloat(shippingFee) || 0;
  const grandTotal = Math.max(0, subtotal - orderDiscountAmount + numShipping);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!customerInfo.full_name.trim()) {
      setErrorMsg("Please enter customer's full name.");
      return;
    }
    if (!customerInfo.email.trim()) {
      setErrorMsg("Please enter customer's email address.");
      return;
    }
    if (!customerInfo.phone.trim()) {
      setErrorMsg("Please enter customer's phone number.");
      return;
    }
    if (!customerInfo.address.trim()) {
      setErrorMsg("Please enter delivery address.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Please add at least one product to the custom order.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("orm_admin_token");

    const payload = {
      full_name: customerInfo.full_name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
      city: customerInfo.city || "N/A",
      state: customerInfo.state || "N/A",
      zip_code: customerInfo.zip_code || "000000",
      total_price: grandTotal.toFixed(2),
      discount_amount: orderDiscountAmount.toFixed(2),
      is_paid: isPaid,
      status: status,
      custom_note: customNote.trim(),
      items: items.map((it) => {
        const baseP = parseFloat(it.base_price) || parseFloat(it.price) || 0;
        const finalP = parseFloat(it.price) || 0;
        const disc = Math.max(0, baseP - finalP);
        return {
          product_id: it.product_id,
          quantity: it.quantity,
          original_price: baseP.toFixed(2),
          discount_amount: disc.toFixed(2),
          price: finalP.toFixed(2),
          color: it.color,
          size: it.size,
          material: it.material,
        };
      }),
    };

    try {
      const res = await fetch(`${BASE_URL}/api/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdOrder = await res.json();
        alert(`Custom Order #${createdOrder.id} Created Successfully!`);
        navigate("/react-admin/orders");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to create custom order. Check form inputs.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error creating custom order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp max-w-[1300px] mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center gap-6 flex-wrap">
        <div>
          <Link
            to="/react-admin/orders"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#b89000] transition-colors mb-3"
          >
            <FaArrowLeft size={10} /> Back to Orders
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full animate-pulse ring-2 ring-[#f59e0b]/20 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-[#f59e0b] font-heading">
              Manual Fulfillment
            </span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">
            Create <span className="text-[#f59e0b] font-heading">Custom Order</span>
          </h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">
            Fill customer details, apply per-product discounts, and configure payment status
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/react-admin/orders")}
            className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-[#c82237] active:scale-95 shadow-lg flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Order...
              </>
            ) : (
              <>
                <FaCheckCircle /> Create Order
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider animate-fadeInUp">
          <FaExclamationCircle className="text-red-500 text-base shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT COLUMN: CUSTOMER & PRODUCTS (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* CARD 1: CUSTOMER DETAILS */}
          <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FECD08]/10 text-[#b89000] flex items-center justify-center">
                  <FaUser />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Customer Details</h3>
                  <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                    Enter buyer credentials & shipping destination
                  </span>
                </div>
              </div>

              {/* Quick Prefill Search */}
              <div className="relative">
                <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold w-[240px] focus-within:border-[#FECD08] transition-colors">
                  <FaSearch className="text-slate-400 mr-2 shrink-0" size={10} />
                  <input
                    type="text"
                    placeholder="Search existing customer..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[260px] overflow-y-auto divide-y divide-slate-100">
                    {customerResults.map((c) => (
                      <div
                        key={c.id || c.email}
                        onClick={() => handleSelectCustomer(c)}
                        className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-slate-900 uppercase group-hover:text-[#b89000] transition-colors">
                            {c.full_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username}
                          </p>
                          {c.orders_count > 0 && (
                            <span className="text-[0.6rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {c.orders_count} orders
                            </span>
                          )}
                        </div>
                        <p className="text-[0.65rem] font-medium text-slate-500 mt-0.5">{c.email}</p>
                        {(c.phone || c.city) && (
                          <div className="flex items-center gap-3 text-[0.6rem] text-slate-400 mt-1 font-bold">
                            {c.phone && <span>📞 {c.phone}</span>}
                            {c.city && <span>📍 {c.city}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PREFILLED BADGE */}
            {prefilledCustomerName && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold animate-fadeInUp">
                <span className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500 shrink-0" />
                  Details auto-filled for <strong>{prefilledCustomerName}</strong> (Name, Phone, Address, City, State, Zip)
                </span>
                <button
                  type="button"
                  onClick={() => setPrefilledCustomerName("")}
                  className="text-emerald-600 hover:text-emerald-900 text-xs font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerInfo.full_name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] transition-all"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98203 37222"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Delivery Address *
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, apartment, flat no, landmark..."
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] transition-all"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={customerInfo.city}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] transition-all"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  State *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={customerInfo.state}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] transition-all"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500">
                    Zip / Pincode *
                  </label>
                  {pincodeLoading && (
                    <span className="text-[0.6rem] font-bold text-amber-500 flex items-center gap-1.5 animate-pulse">
                      <FaSpinner className="animate-spin" size={10} /> Fetching City & State...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 400001 (auto-fetches City & State)"
                  value={customerInfo.zip_code}
                  onChange={handleZipCodeChange}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] transition-all"
                />
                {pincodeStatus && (
                  <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    pincodeStatus.success 
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                      : "bg-red-50 border border-red-200 text-red-600"
                  }`}>
                    {pincodeStatus.success ? <FaCheck size={11} className="text-emerald-500 shrink-0" /> : <span className="text-red-500 font-black shrink-0">!</span>}
                    <span>{pincodeStatus.success ? `Auto-fetched: ${pincodeStatus.message}` : pincodeStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: PRODUCTS & PER-PRODUCT DISCOUNTS */}
          <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FECD08]/10 text-[#b89000] flex items-center justify-center">
                  <FaBox />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Order Items & Per-Product Discounts</h3>
                  <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                    Add products & give different individual discounts per item
                  </span>
                </div>
              </div>
            </div>

            {/* Product Picker Search Bar */}
            <div className="relative">
              <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus-within:border-[#FECD08] transition-all">
                <FaSearch className="text-slate-400 mr-3 shrink-0" size={14} />
                <input
                  type="text"
                  placeholder="Search catalog to add products..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-900 placeholder:text-slate-400"
                />
                {isSearching && (
                  <div className="w-4 h-4 border-2 border-[#FECD08] border-t-transparent rounded-full animate-spin shrink-0"></div>
                )}
              </div>

              {/* Product Results Dropdown */}
              {showProductDropdown && productSearchResults.length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[460px] overflow-y-auto divide-y divide-slate-100">
                  {productSearchResults.map((prod) => {
                    const cleanImg = prod.image?.startsWith("http")
                      ? prod.image
                      : `${BASE_URL}${prod.image}`;
                    const hasVariants = prod.variants && prod.variants.length > 0;
                    const queryLower = productQuery.trim().toLowerCase();
                    const matchingVariants = hasVariants && queryLower
                      ? prod.variants.filter((v) =>
                          (v.color || "").toLowerCase().includes(queryLower) ||
                          (v.sku || "").toLowerCase().includes(queryLower)
                        )
                      : [];

                    return (
                      <div key={prod.id} className="divide-y divide-slate-100">
                        {/* Parent Product Header */}
                        <div
                          onClick={() => handleAddProduct(prod)}
                          className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group bg-white"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={cleanImg}
                              alt={prod.title}
                              className="w-10 h-10 object-contain rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate uppercase group-hover:text-[#b89000] transition-colors">
                                {prod.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[0.65rem] font-bold text-slate-400 uppercase">
                                  Stock: {prod.stock_quantity || 0} units
                                </span>
                                {hasVariants && (
                                  <span className="text-[0.62rem] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                    {prod.variants.length} Variants Available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0 ml-3">
                            <span className="text-xs font-black text-slate-900">
                              Rs. {Number(prod.price).toLocaleString()}
                            </span>
                            <span className="text-[0.62rem] font-bold bg-slate-800 group-hover:bg-[#FECD08] text-[#212121] font-bold px-2.5 py-1 rounded-lg transition-colors">
                              + Add Base
                            </span>
                          </div>
                        </div>

                        {/* Variants List */}
                        {hasVariants && (
                          <div className="bg-slate-50/70 p-3 flex flex-col gap-1.5 border-t border-slate-100">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">
                                Variants ({prod.variants.length}):
                              </span>
                              {matchingVariants.length > 0 && (
                                <span className="text-[0.6rem] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  🎯 {matchingVariants.length} matched "{productQuery}"
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {prod.variants.map((v) => {
                                const vImg = v.image?.startsWith("http")
                                  ? v.image
                                  : v.image
                                  ? `${BASE_URL}${v.image}`
                                  : cleanImg;
                                const isMatch =
                                  queryLower &&
                                  ((v.color || "").toLowerCase().includes(queryLower) ||
                                    (v.sku || "").toLowerCase().includes(queryLower));

                                return (
                                  <div
                                    key={v.id}
                                    onClick={() => handleAddProduct(prod, v)}
                                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                      isMatch
                                        ? "bg-emerald-50/90 border border-emerald-300 hover:bg-emerald-100 shadow-sm"
                                        : "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img
                                        src={vImg}
                                        alt={v.color}
                                        className="w-8 h-8 object-contain rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-slate-900 truncate">
                                            {v.color}
                                          </span>
                                          {isMatch && (
                                            <span className="text-[0.55rem] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-white">
                                              MATCH
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[0.62rem] font-semibold text-slate-400 block">
                                          Stock: {v.stock_quantity ?? "0"} units
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <span className="text-xs font-black text-slate-900">
                                        Rs. {Number(v.price || prod.price).toLocaleString()}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddProduct(prod, v);
                                        }}
                                        className="text-[0.62rem] font-bold bg-[#FECD08] hover:bg-[#c9253a] text-white px-2 py-0.5 rounded-md transition-colors"
                                      >
                                        + Add
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Items Table */}
            {items.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <FaShoppingBag className="mx-auto text-slate-300 text-3xl mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No products added yet. Use search above to select products.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500">Product</th>
                      <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500">Variant</th>
                      <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 text-right">Catalog Price</th>
                      <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 w-[180px]">Product Discount</th>
                      <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 w-[120px] text-right">Final Unit Price</th>
                      <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 w-[90px] text-center">Qty</th>
                      <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 text-right">Line Total</th>
                      <th className="py-3 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const lineTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1);
                      const isDiscounted = item.base_price > item.price;
                      const savingPerUnit = item.base_price - item.price;

                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          {/* Product Info */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-10 h-10 object-contain bg-slate-100 rounded-lg border border-slate-200 shrink-0"
                              />
                              <span className="text-xs font-bold text-slate-900 uppercase line-clamp-1 max-w-[150px]">
                                {item.title}
                              </span>
                            </div>
                          </td>

                          {/* Variant Inputs */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1.5 min-w-[130px]">
                              {item.variants && item.variants.length > 0 ? (
                                <select
                                  value={item.color || ""}
                                  onChange={(e) => handleSelectVariantForItem(index, e.target.value)}
                                  className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] shadow-sm max-w-[160px]"
                                >
                                  <option value="">Base Product (Rs. {Number(item.base_product_price || item.base_price).toLocaleString()})</option>
                                  {item.variants.map((v) => (
                                    <option key={v.id} value={v.color}>
                                      {v.color} - Rs. {Number(v.price).toLocaleString()} ({v.stock_quantity ?? 0} in stock)
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Color"
                                  value={item.color}
                                  onChange={(e) => handleUpdateItemField(index, "color", e.target.value)}
                                  className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[0.68rem] font-bold w-24 outline-none"
                                />
                              )}
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  placeholder="Size"
                                  value={item.size}
                                  onChange={(e) => handleUpdateItemField(index, "size", e.target.value)}
                                  className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[0.65rem] font-bold w-14 outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Material"
                                  value={item.material}
                                  onChange={(e) => handleUpdateItemField(index, "material", e.target.value)}
                                  className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[0.65rem] font-bold w-16 outline-none"
                                />
                              </div>
                            </div>
                          </td>

                          {/* Catalog Price */}
                          <td className="py-3 px-3 text-right">
                            <span className={`text-xs font-bold ${isDiscounted ? "line-through text-slate-400" : "text-slate-800"}`}>
                              Rs. {Number(item.base_price).toLocaleString()}
                            </span>
                          </td>

                          {/* Per-Product Discount Inputs */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemDiscount(index, "fixed", item.item_discount_val)}
                                  className={`px-1.5 py-0.5 rounded text-[0.6rem] font-black ${
                                    item.item_discount_type === "fixed" ? "bg-[#FECD08] text-[#212121] font-bold" : "text-slate-500"
                                  }`}
                                >
                                  Rs
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemDiscount(index, "percent", item.item_discount_val)}
                                  className={`px-1.5 py-0.5 rounded text-[0.6rem] font-black ${
                                    item.item_discount_type === "percent" ? "bg-[#FECD08] text-[#212121] font-bold" : "text-slate-500"
                                  }`}
                                >
                                  %
                                </button>
                              </div>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Disc"
                                value={item.item_discount_val}
                                onChange={(e) => handleUpdateItemDiscount(index, item.item_discount_type, e.target.value)}
                                className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] w-20"
                              />
                            </div>
                            {isDiscounted && (
                              <span className="text-[0.6rem] font-black text-emerald-600 block mt-0.5">
                                Save Rs. {Number(savingPerUnit.toFixed(2)).toLocaleString()}/unit
                              </span>
                            )}
                          </td>

                          {/* Final Unit Price Input */}
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-black text-slate-900 text-right outline-none focus:border-[#FECD08] w-24"
                            />
                          </td>

                          {/* Quantity Stepper */}
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemField(index, "quantity", item.quantity - 1)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold"
                              >
                                <FaMinus size={7} />
                              </button>
                              <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemField(index, "quantity", item.quantity + 1)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold"
                              >
                                <FaPlus size={7} />
                              </button>
                            </div>
                          </td>

                          {/* Line Total */}
                          <td className="py-3 px-3 text-right text-xs font-black text-slate-900">
                            Rs. {lineTotal.toLocaleString()}
                          </td>

                          {/* Remove Item */}
                          <td className="py-3 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-[#b89000] transition-colors p-1"
                            >
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FINANCIALS & ORDER STATUS (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* CARD 3: ADDITIONAL CART DISCOUNT & SUMMARY */}
          <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#FECD08]/10 text-[#b89000] flex items-center justify-center">
                <FaTag />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Order Summary & Extra Discount</h3>
                <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                  Overall cart reduction & shipping
                </span>
              </div>
            </div>

            {/* Extra Cart-level Discount Section */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Additional Cart Discount
                </span>
                {/* Toggle Type */}
                <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-black transition-all ${
                      discountType === "fixed" ? "bg-[#FECD08] text-[#212121] font-bold shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Fixed (Rs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`px-2.5 py-1 rounded-lg text-[0.65rem] font-black transition-all ${
                      discountType === "percentage" ? "bg-[#FECD08] text-[#212121] font-bold shadow-sm" : "text-slate-600"
                    }`}
                  >
                    % Percent
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={discountType === "percentage" ? "e.g. 5 (%) extra" : "e.g. 100 (Rs) extra"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                />
              </div>
            </div>

            {/* Shipping Fee Input */}
            <div>
              <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Shipping Fee (Rs)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-bold">
              <div className="flex justify-between text-slate-600">
                <span>Items Total ({items.length} items):</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              {orderDiscountAmount > 0 && (
                <div className="flex justify-between text-[#b89000]">
                  <span>Extra Cart Discount:</span>
                  <span>- Rs. {orderDiscountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee:</span>
                <span>+ Rs. {numShipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 text-base font-black pt-3 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-[#b89000]">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* CARD 4: PAYMENT & FULFILLMENT SETTINGS */}
          <div className="bg-white shadow-sm border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#FECD08]/10 text-[#b89000] flex items-center justify-center">
                <FaCreditCard />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Payment & Status</h3>
                <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                  Configure order payment status
                </span>
              </div>
            </div>

            {/* Payment Status Toggle */}
            <div>
              <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-2">
                Payment Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaid(true)}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                    isPaid
                      ? "bg-green-500 text-white border-green-500 shadow-md"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <FaCheckCircle /> Paid
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaid(false)}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                    !isPaid
                      ? "bg-amber-500 text-white border-amber-500 shadow-md"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Pending / Unpaid
                </button>
              </div>
            </div>

            {/* Order Status */}
            <div>
              <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-2">
                Fulfillment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
              >
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Custom Order Note */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500">
                  Custom Order Note
                </label>
                <span className="text-[0.55rem] font-black uppercase tracking-wider text-[#b89000] bg-[#FECD08]/10 px-2 py-0.5 rounded-md">
                  Prints on Invoice
                </span>
              </div>
              <textarea
                rows="3"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Add special instructions, terms, bank reference, or customer notes (printed on the PDF invoice)..."
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] placeholder:text-slate-400 resize-none transition-all"
              />
              <p className="text-[0.6rem] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">
                Only for custom orders • Automatically included on customer invoice
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
