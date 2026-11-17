import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaPrint,
  FaEllipsisH,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaFilePdf,
  FaReceipt,
  FaBoxOpen,
  FaUser,
  FaMap,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaMinus,
  FaSearch,
  FaTag,
  FaPercentage,
  FaCheckCircle,
  FaUndo,
  FaShoppingBag,
  FaTruck,
  FaWhatsapp,
  FaCopy,
  FaCheck,
  FaSyncAlt,
  FaExternalLinkAlt,
  FaSpinner,
} from "react-icons/fa";
import { lookupPincode } from "../../utils/addressLookup";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editOrderDiscountType, setEditOrderDiscountType] = useState("fixed"); // "fixed" or "percent"
  const [editOrderDiscountVal, setEditOrderDiscountVal] = useState("0");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Product Search State for Adding Products during Edit
  const [productQuery, setProductQuery] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isPushingShipway, setIsPushingShipway] = useState(false);
  const [isSendingInvoiceEmail, setIsSendingInvoiceEmail] = useState(false);

  // Custom Note State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Customer Edit State
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerSaveError, setCustomerSaveError] = useState("");
  const [copiedField, setCopiedField] = useState(null);
  const [customerPincodeLoading, setCustomerPincodeLoading] = useState(false);
  const [customerPincodeStatus, setCustomerPincodeStatus] = useState(null);

  const handleCustomerZipCodeChange = async (e) => {
    const rawVal = e.target.value;
    const numeric = rawVal.replace(/\D/g, "").slice(0, 6);
    setCustomerFormData((prev) => ({ ...prev, zip_code: numeric }));

    if (numeric.length === 6) {
      setCustomerPincodeLoading(true);
      setCustomerPincodeStatus({ message: "Checking PIN code...", success: null });
      const res = await lookupPincode(numeric);
      setCustomerPincodeLoading(false);
      if (res.success) {
        setCustomerFormData((prev) => ({
          ...prev,
          city: res.city || prev.city,
          state: res.state || prev.state,
        }));
        setCustomerPincodeStatus({
          success: true,
          message: `${res.city}, ${res.state}`,
        });
      } else {
        setCustomerPincodeStatus({
          success: false,
          message: res.error || "Pincode not found",
        });
      }
    } else {
      setCustomerPincodeStatus(null);
    }
  };

  const handleStartEditCustomer = () => {
    if (!order) return;
    setCustomerFormData({
      full_name: order.full_name || "",
      email: order.email || "",
      phone: order.phone || "",
      address: order.address || "",
      city: order.city || "",
      state: order.state || "",
      zip_code: order.zip_code || "",
    });
    setCustomerPincodeStatus(order.city && order.state ? { success: true, message: `${order.city}, ${order.state}` } : null);
    setCustomerSaveError("");
    setIsEditingCustomer(true);
  };

  const handleCancelEditCustomer = () => {
    setIsEditingCustomer(false);
    setCustomerSaveError("");
  };

  const handleSaveCustomer = async () => {
    if (!order) return;
    setIsSavingCustomer(true);
    setCustomerSaveError("");
    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(customerFormData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update customer details");
      }
      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      setIsEditingCustomer(false);
    } catch (err) {
      console.error(err);
      setCustomerSaveError(err.message || "Failed to save customer details");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleCopyText = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Shipway Live Tracking State
  const [tracking, setTracking] = useState(null);
  const [isFetchingTracking, setIsFetchingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const fetchTrackingDetails = async () => {
    if (!id) return;
    setIsFetchingTracking(true);
    setTrackingError("");
    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${id}/tracking/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTracking(data);
        if (data.current_order_status) {
          setOrder((prev) => (prev ? { ...prev, status: data.current_order_status } : prev));
        }
      } else {
        setTrackingError("Could not retrieve live tracking data from Shipway.");
      }
    } catch (err) {
      console.error("Error fetching Shipway tracking:", err);
      setTrackingError("Error connecting to Shipway service.");
    } finally {
      setIsFetchingTracking(false);
    }
  };

  // Push / Sync Order to Shipway
  const handlePushToShipway = async () => {
    if (!order) return;
    setIsPushingShipway(true);
    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/push-to-shipway/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Shipway Sync Success: ${data.message || "Order successfully synced with Shipway!"}`);
        fetchTrackingDetails();
      } else {
        alert(`Shipway Sync Notice: ${data.message || "Could not push to Shipway."}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error syncing order with Shipway.");
    } finally {
      setIsPushingShipway(false);
    }
  };

  // Fetch Order
  const fetchOrderDetails = () => {
    const token = localStorage.getItem("orm_admin_token");
    fetch(`${BASE_URL}/api/orders/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch order");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchTrackingDetails();
  }, [id]);

  // Product Catalog Search Debounce
  useEffect(() => {
    if (!productQuery.trim()) {
      setProductSearchResults([]);
      setShowProductDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingProducts(true);
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
        .finally(() => setIsSearchingProducts(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [productQuery]);

  // Download Invoice
  const handleDownloadInvoice = () => {
    const token = localStorage.getItem("orm_admin_token") || "";
    window.open(`${BASE_URL}/api/invoice/${id}/?token=${token}`, "_blank");
    setShowPrintMenu(false);
  };

  // Send Invoice to Mail
  const handleSendInvoiceEmail = async () => {
    if (!order) return;
    const customerEmail = order.email;
    if (!customerEmail) {
      alert("This order does not have a customer email address. Please edit customer details to provide an email first.");
      return;
    }

    if (!window.confirm(`Send official invoice PDF to ${customerEmail}?`)) {
      return;
    }

    setIsSendingInvoiceEmail(true);
    setShowPrintMenu(false);
    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/send-invoice-email/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ email: customerEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || `Invoice email sent successfully to ${customerEmail}!`);
      } else {
        alert(`Failed to send invoice: ${data.message || "Unknown server error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error while sending invoice email.");
    } finally {
      setIsSendingInvoiceEmail(false);
    }
  };

  // Save Custom Order Note
  const handleSaveNote = async () => {
    setIsSavingNote(true);
    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ custom_note: noteText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setIsEditingNote(false);
        alert("Custom Order Note updated successfully! It will appear on the invoice.");
      } else {
        alert("Failed to update custom note.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while updating note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Status Change
  const handleStatusChange = async (newStatus) => {
    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        alert(`Order status updated to ${newStatus}`);
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating order status.");
    }
  };

  // Delete / Soft Delete Order
  const handleDeleteOrder = async () => {
    if (!window.confirm(`Are you sure you want to delete Order #${order.id}? It will be moved to the Deleted log.`)) {
      return;
    }

    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || `Order #${order.id} moved to Deleted log successfully.`);
        navigate("/react-admin/orders");
      } else {
        alert("Failed to delete order.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting order.");
    }
  };

  // Restore Order
  const handleRestoreOrder = async () => {
    if (!window.confirm(`Restore Order #${order.id} back to active orders?`)) return;
    const token = localStorage.getItem("orm_admin_token");
    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/restore/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setOrder((prev) => ({ ...prev, is_deleted: false, deleted_at: null, deleted_by: null }));
        alert(data.message || `Order #${order.id} restored successfully.`);
      } else {
        alert("Failed to restore order.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to restore order.");
    }
  };

  // --- EDITING CONTROLLERS ---
  const handleStartEdit = () => {
    if (!order) return;
    setIsEditing(true);
    setSaveError("");

    const initialEditItems = (order.items || []).map((it) => {
      const origP =
        parseFloat(it.original_price) ||
        parseFloat(it.product?.price) ||
        parseFloat(it.price) ||
        0;
      const curPrice = parseFloat(it.price) || 0;
      const discAmt = parseFloat(it.discount_amount) || Math.max(0, origP - curPrice);

      return {
        id: it.id,
        product_id: it.product?.id,
        product: it.product,
        quantity: it.quantity || 1,
        original_price: origP,
        price: curPrice,
        discount_type: "fixed",
        discount_val: discAmt > 0 ? discAmt.toFixed(2) : "",
        discount_amount: discAmt,
        color: it.color || "",
        size: it.size || "",
        material: it.material || "",
      };
    });

    setEditItems(initialEditItems);
    setEditOrderDiscountType("fixed");
    setEditOrderDiscountVal(
      order.discount_amount ? parseFloat(order.discount_amount).toString() : "0"
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError("");
    setProductQuery("");
    setShowProductDropdown(false);
  };

  const handleEditQty = (index, delta) => {
    const updated = [...editItems];
    const newQty = Math.max(1, (parseInt(updated[index].quantity, 10) || 1) + delta);
    updated[index].quantity = newQty;
    setEditItems(updated);
  };

  const handleEditQtyDirect = (index, value) => {
    const updated = [...editItems];
    const val = parseInt(value, 10);
    updated[index].quantity = isNaN(val) || val < 1 ? 1 : val;
    setEditItems(updated);
  };

  const handleEditItemDiscount = (index, type, valStr) => {
    const updated = [...editItems];
    const item = updated[index];
    item.discount_type = type;
    item.discount_val = valStr;

    const numVal = parseFloat(valStr) || 0;
    const baseP = parseFloat(item.original_price) || 0;
    let discAmt = 0;

    if (type === "percent") {
      discAmt = (baseP * numVal) / 100;
    } else {
      discAmt = numVal;
    }

    discAmt = Math.min(baseP, Math.max(0, discAmt));
    item.discount_amount = discAmt;
    item.price = Math.max(0, baseP - discAmt);
    setEditItems(updated);
  };

  const handleEditItemPriceDirect = (index, valStr) => {
    const updated = [...editItems];
    const item = updated[index];
    const val = parseFloat(valStr);
    const newPrice = isNaN(val) || val < 0 ? 0 : val;
    const baseP = parseFloat(item.original_price) || 0;

    item.price = newPrice;
    const disc = Math.max(0, baseP - newPrice);
    item.discount_amount = disc;
    item.discount_val = disc > 0 ? disc.toFixed(2) : "";
    item.discount_type = "fixed";
    setEditItems(updated);
  };

  const handleRemoveEditItem = (index) => {
    if (editItems.length <= 1) {
      alert("An order must have at least one product. To delete the whole order, use Delete Order.");
      return;
    }
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleAddProductToEdit = (prod, variant = null) => {
    const cleanImg = variant?.image
      ? (variant.image.startsWith("http") ? variant.image : `${BASE_URL}${variant.image}`)
      : (prod.image?.startsWith("http") ? prod.image : `${BASE_URL}${prod.image}`);

    const baseP = variant
      ? (parseFloat(variant.price) || parseFloat(prod.price) || 0)
      : (parseFloat(prod.price) || 0);

    const variantColor = variant ? (variant.color || "") : (prod.color || "");

    const existingIndex = editItems.findIndex(
      (it) => it.product_id === prod.id && (it.color || "") === variantColor
    );

    if (existingIndex > -1) {
      const updated = [...editItems];
      updated[existingIndex].quantity += 1;
      setEditItems(updated);
    } else {
      setEditItems([
        ...editItems,
        {
          id: null, // New item
          product_id: prod.id,
          product: {
            id: prod.id,
            title: prod.title,
            image: cleanImg,
            price: prod.price,
            sku: variant ? (variant.sku || variant.color) : (prod.model_number || prod.sku || prod.id),
          },
          quantity: 1,
          original_price: baseP,
          price: baseP,
          discount_type: "fixed",
          discount_val: "",
          discount_amount: 0,
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

  // Live calculations for Edit Mode
  const editCatalogSubtotal = editItems.reduce(
    (acc, it) => acc + (parseFloat(it.original_price) || parseFloat(it.price) || 0) * (parseInt(it.quantity, 10) || 1),
    0
  );
  const editChargedSubtotal = editItems.reduce(
    (acc, it) => acc + (parseFloat(it.price) || 0) * (parseInt(it.quantity, 10) || 1),
    0
  );
  const editItemDiscountsTotal = Math.max(0, editCatalogSubtotal - editChargedSubtotal);

  let editOrderDiscountAmt = 0;
  const numOrderDisc = parseFloat(editOrderDiscountVal) || 0;
  if (editOrderDiscountType === "percent") {
    editOrderDiscountAmt = (editChargedSubtotal * numOrderDisc) / 100;
  } else {
    editOrderDiscountAmt = numOrderDisc;
  }
  if (editOrderDiscountAmt > editChargedSubtotal) editOrderDiscountAmt = editChargedSubtotal;
  if (editOrderDiscountAmt < 0) editOrderDiscountAmt = 0;

  const editGrandTotal = Math.max(0, editChargedSubtotal - editOrderDiscountAmt);
  const editTotalSavings = editItemDiscountsTotal + editOrderDiscountAmt;

  // Save Order Changes to Backend
  const handleSaveOrderItems = async () => {
    setIsSaving(true);
    setSaveError("");
    const token = localStorage.getItem("orm_admin_token");

    const payload = {
      items: editItems.map((it) => ({
        id: it.id,
        product_id: it.product_id,
        quantity: it.quantity,
        original_price: parseFloat(it.original_price || it.price).toFixed(2),
        price: parseFloat(it.price).toFixed(2),
        discount_amount: parseFloat(it.discount_amount || 0).toFixed(2),
        color: it.color || "",
        size: it.size || "",
        material: it.material || "",
      })),
      discount_amount: editOrderDiscountAmt.toFixed(2),
      total_price: editGrandTotal.toFixed(2),
    };

    try {
      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/edit-items/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setIsEditing(false);
        alert("Order items, quantities, and discounts successfully updated!");
      } else {
        const errData = await res.json();
        setSaveError(errData.detail || errData.error || "Failed to update order items.");
      }
    } catch (err) {
      console.error(err);
      setSaveError("Network error while updating order.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/image/placeholder.png";
    const pathStr = imagePath.toString().trim();
    if (pathStr.includes("http://") || pathStr.includes("https://") || pathStr.includes("http//") || pathStr.includes("https//")) {
      let clean = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;
      return clean.replace("https//", "https://").replace("http//", "http://");
    }
    const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
    return `${BASE_URL}${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-t-2 border-[#FECD08] rounded-full animate-spin mb-4"></div>
        <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Accessing Briefing...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-40 text-slate-500 font-black uppercase tracking-widest">
        Entry Not Found
      </div>
    );
  }

  // --- Display Calculations ---
  const orderItemsList = order.items || [];
  const displayCatalogSubtotal = orderItemsList.reduce((acc, it) => {
    const orig = parseFloat(it.original_price) || parseFloat(it.product?.price) || parseFloat(it.price) || 0;
    return acc + orig * (it.quantity || 1);
  }, 0);

  const displayChargedItemsSubtotal = orderItemsList.reduce((acc, it) => {
    return acc + (parseFloat(it.price) || 0) * (it.quantity || 1);
  }, 0);

  const displayItemDiscountsTotal = Math.max(0, displayCatalogSubtotal - displayChargedItemsSubtotal);
  const displayOrderDiscountAmt = parseFloat(order.discount_amount) || 0;
  const displayTotalSavings = displayItemDiscountsTotal + displayOrderDiscountAmt;

  // Check if order has overall discount and items don't have separate item discounts
  const orderHasOnlyOverallDiscount = displayOrderDiscountAmt > 0 && displayItemDiscountsTotal === 0;
  const overallDiscountRatio =
    orderHasOnlyOverallDiscount && displayCatalogSubtotal > 0
      ? (displayOrderDiscountAmt / displayCatalogSubtotal) * 100
      : 0;

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {order.is_deleted && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-red-600">
                This Order is Marked as Deleted (Audit Log Preserved)
              </div>
              <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Deleted {order.deleted_at ? new Date(order.deleted_at).toLocaleString() : ''} {order.deleted_by ? `by ${order.deleted_by}` : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestoreOrder}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <FaUndo size={11} /> Restore Order
          </button>
        </div>
      )}
      {/* HEADER BAR */}
      <div className="flex justify-between items-start gap-6 flex-wrap">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              const savedPage = sessionStorage.getItem("admin_orders_page");
              if (savedPage && parseInt(savedPage) > 1) {
                navigate(`/react-admin/orders?page=${savedPage}`);
              } else {
                navigate("/react-admin/orders");
              }
            }}
            className="text-slate-700 text-[0.65rem] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:text-[#b89000] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <FaArrowLeft /> Back to Orders
          </button>
          <div className="flex items-center gap-6">
            <h1 className="text-[2.8rem] font-black text-slate-900 uppercase tracking-tighter leading-none">
              #{order.id}
            </h1>
            <div className="flex gap-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                  order.is_paid
                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                    : "bg-[#FECD08]/10 border-[#FECD08]/20 text-[#b89000]"
                }`}
              >
                <div
                  className={`w-1 h-1 rounded-full ${
                    order.is_paid ? "bg-green-500" : "bg-[#FECD08]"
                  } animate-pulse`}
                ></div>
                <span className="text-[0.55rem] font-black uppercase tracking-widest">
                  {order.is_paid ? "Paid" : "Unpaid"}
                </span>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
                  order.status === "Delivered"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : order.status === "Shipped"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : order.status === "Cancelled"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    order.status === "Delivered"
                      ? "bg-emerald-500"
                      : order.status === "Shipped"
                      ? "bg-blue-500"
                      : order.status === "Cancelled"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                ></div>
                <select
                  value={order.status || "Processing"}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-transparent text-[0.55rem] font-black uppercase tracking-widest outline-none cursor-pointer text-current"
                >
                  <option value="Processing" className="text-slate-900 bg-white">Processing</option>
                  <option value="Shipped" className="text-slate-900 bg-white">Shipped</option>
                  <option value="Delivered" className="text-slate-900 bg-white">Delivered</option>
                  <option value="Cancelled" className="text-slate-900 bg-white">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-[0.2em]">
            {formatDate(order.created_at)}
          </p>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          {/* EDIT BUTTON IN HEADER */}
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="bg-[#FECD08] text-[#212121] font-bold px-6 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#c92439] flex items-center gap-2 shadow-sm active:scale-95"
            >
              <FaEdit size={12} /> Edit Items & Discounts
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="bg-slate-100 border border-slate-300 text-slate-700 px-5 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-200 flex items-center gap-2"
              >
                <FaTimes size={10} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOrderItems}
                disabled={isSaving}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-emerald-700 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave size={12} /> Save Changes
                  </>
                )}
              </button>
            </div>
          )}

          {/* PUSH TO SHIPWAY BUTTON */}
          <button
            type="button"
            onClick={handlePushToShipway}
            disabled={isPushingShipway}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
            title="Push / Sync this order to Shipway for courier and shipping label generation"
          >
            {isPushingShipway ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Syncing...
              </>
            ) : (
              <>
                <FaTruck size={12} /> Push to Shipway
              </>
            )}
          </button>

          {/* SEND INVOICE TO MAIL BUTTON */}
          <button
            type="button"
            onClick={handleSendInvoiceEmail}
            disabled={isSendingInvoiceEmail}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
            title={`Send official invoice PDF to ${order.email || 'customer'}`}
          >
            {isSendingInvoiceEmail ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <FaEnvelope size={12} /> Send Invoice to Mail
              </>
            )}
          </button>

          {order.is_deleted ? (
            <button
              type="button"
              onClick={handleRestoreOrder}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-emerald-600 hover:text-white flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FaUndo size={10} /> Restore Order
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeleteOrder}
              className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#FECD08] hover:text-white flex items-center gap-2"
            >
              <FaTrash size={10} /> Delete Order
            </button>
          )}

          <div className="relative">
            <button
              className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-xl text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-700 flex items-center gap-3 transition-all hover:bg-white/[0.06] hover:text-slate-900"
              onClick={() => setShowPrintMenu(!showPrintMenu)}
            >
              <FaPrint className="text-[#b89000]" /> Print Order
            </button>

            {showPrintMenu && (
              <div className="absolute top-[120%] right-0 w-[240px] bg-white shadow-sm/90 backdrop-blur-3xl border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-fadeInUp">
                <button
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-[0.65rem] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
                  onClick={handleDownloadInvoice}
                >
                  <FaFilePdf className="text-red-500" /> Download Invoice
                </button>
                <button
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-[0.65rem] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
                  onClick={handleSendInvoiceEmail}
                >
                  <FaEnvelope className="text-emerald-500" /> Send Invoice to Mail
                </button>
                <button
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-[0.65rem] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
                  onClick={() => window.print()}
                >
                  <FaReceipt className="text-[#b89000]" /> Print Page
                </button>
              </div>
            )}
          </div>

          <button className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 transition-all hover:text-slate-900">
            <FaEllipsisH />
          </button>
        </div>
      </div>

      {/* ERROR ALERT IF SAVING FAILED */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
          <FaTimes className="text-red-500 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* OVERALL ORDER DISCOUNT BANNER (If present) */}
      {order.discount_amount > 0 && !isEditing && (
        <div className="bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border border-rose-200 p-5 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FECD08]/10 text-[#b89000] flex items-center justify-center">
              <FaTag size={14} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Order-Level Discount Applied:{" "}
                <span className="text-[#b89000]">Rs. {Number(order.discount_amount).toLocaleString()}</span>
              </p>
              <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                {overallDiscountRatio > 0
                  ? `Overall discount of ~${overallDiscountRatio.toFixed(1)}% off applied across this order.`
                  : "Deducted directly from order grand total."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-xs font-black text-[#b89000] hover:underline uppercase tracking-wider"
          >
            Adjust Discount →
          </button>
        </div>
      )}

      {/* CUSTOMER PROFILE SECTION (BIGGER & PROMINENT AT TOP) */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        <div className="p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FECD08]/10 border border-[#FECD08]/20 text-[#b89000] flex items-center justify-center">
              <FaUser size={16} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[0.9rem] font-black text-slate-900 uppercase tracking-[0.2em]">
                  Customer Profile
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[0.55rem] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Customer
                </span>
              </div>
              <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Shipping Destination & Contact Information
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditingCustomer ? (
              <button
                type="button"
                onClick={handleStartEditCustomer}
                className="flex items-center gap-2 bg-slate-100 hover:bg-[#FECD08] hover:text-white text-slate-700 px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-wider transition-all border border-slate-200"
              >
                <FaEdit size={11} /> Edit Customer Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEditCustomer}
                  disabled={isSavingCustomer}
                  className="bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-wider hover:bg-slate-200"
                >
                  <FaTimes size={10} className="inline mr-1" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomer}
                  disabled={isSavingCustomer}
                  className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[0.6rem] font-black uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSavingCustomer ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave size={11} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {customerSaveError && (
          <div className="mx-8 mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <FaTimes className="text-red-500 shrink-0" />
            <span>{customerSaveError}</span>
          </div>
        )}

        {!isEditingCustomer ? (
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* COLUMN 1: CUSTOMER IDENTITY */}
            <div className="flex flex-col justify-between space-y-5 md:pr-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/10 via-rose-500/10 to-[#FECD08]/20 border border-[#FECD08]/30 flex items-center justify-center text-[#b89000] font-black text-2xl uppercase shadow-md shrink-0">
                  {order.full_name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-snug break-words">
                    {order.full_name || "Valued Customer"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[0.6rem] font-black uppercase tracking-widest text-[#b89000] bg-[#FECD08]/10 border border-[#FECD08]/20 px-2.5 py-0.5 rounded-md">
                      Registered Buyer
                    </span>
                    <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-wider">
                      Order #{order.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-[0.65rem] font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">Gateway</span>
                  <span className="text-slate-900 font-black uppercase">{order.payment_gateway || "Online / Direct"}</span>
                </div>
                {order.transaction_id && (
                  <div className="flex justify-between items-center text-[0.65rem] font-bold">
                    <span className="text-slate-500 uppercase tracking-wider">Txn Ref</span>
                    <span className="text-slate-700 font-mono text-[0.6rem] truncate max-w-[150px]" title={order.transaction_id}>
                      {order.transaction_id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[0.65rem] font-bold">
                  <span className="text-slate-500 uppercase tracking-wider">Payment Status</span>
                  <span className={`font-black uppercase ${order.is_paid ? "text-emerald-600" : "text-[#b89000]"}`}>
                    {order.is_paid ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMN 2: CONTACT DETAILS */}
            <div className="space-y-5 pt-6 md:pt-0 md:px-6">
              <h4 className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                <FaEnvelope className="text-[#b89000]" size={11} /> Contact Information
              </h4>

              <div className="space-y-3">
                {/* Email Box */}
                <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[0.55rem] font-black uppercase tracking-widest text-slate-500 block mb-0.5">
                        Email Address
                      </span>
                      <a
                        href={`mailto:${order.email}`}
                        className="text-xs font-bold text-slate-900 hover:text-[#b89000] transition-colors truncate block"
                        title={order.email}
                      >
                        {order.email || "No email provided"}
                      </a>
                    </div>
                    {order.email && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSendInvoiceEmail}
                          disabled={isSendingInvoiceEmail}
                          className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                          title="Send Invoice to this Email"
                        >
                          <FaEnvelope size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(order.email, 'email')}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#b89000] hover:border-[#FECD08]/30 transition-all shrink-0"
                          title="Copy Email"
                        >
                          {copiedField === 'email' ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone Box with WhatsApp & Call */}
                <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[0.55rem] font-black uppercase tracking-widest text-slate-500 block mb-0.5">
                        Phone Number
                      </span>
                      <a
                        href={`tel:${order.phone}`}
                        className="text-xs font-bold text-slate-900 hover:text-[#b89000] transition-colors truncate block"
                      >
                        {order.phone || "No phone provided"}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {order.phone && (
                        <>
                          <a
                            href={`https://wa.me/91${order.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                            title="Chat on WhatsApp"
                          >
                            <FaWhatsapp size={12} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyText(order.phone, 'phone')}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#b89000] hover:border-[#FECD08]/30 transition-all"
                            title="Copy Phone"
                          >
                            {copiedField === 'phone' ? <FaCheck size={11} className="text-emerald-500" /> : <FaCopy size={11} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: SHIPPING ADDRESS & MAP */}
            <div className="space-y-5 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div>
                <h4 className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2 mb-3">
                  <FaMapMarkerAlt className="text-[#b89000]" size={11} /> Shipping Address
                </h4>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 text-xs text-slate-700">
                  <p className="font-black text-slate-900 uppercase tracking-tight">
                    {order.full_name}
                  </p>
                  <p className="font-semibold text-slate-600 leading-relaxed uppercase">
                    {order.address || "No street address"}
                  </p>
                  <p className="font-bold text-slate-800 uppercase">
                    {order.city ? `${order.city}, ` : ""}{order.state || ""}{order.zip_code ? ` - ${order.zip_code}` : ""}
                  </p>
                  <p className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest pt-1">
                    Country: India
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address || ''}, ${order.city || ''}, ${order.state || ''} ${order.zip_code || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-[#FECD08] hover:text-white border border-slate-200 text-slate-700 text-[0.65rem] font-black uppercase tracking-wider transition-all shadow-sm"
                >
                  <FaMap size={11} /> View on Google Maps
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT CUSTOMER FORM */
          <div className="p-8 bg-slate-50/50">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <FaEdit className="text-[#b89000]" /> Edit Customer & Shipping Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerFormData.full_name}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, full_name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                  placeholder="Customer Full Name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="text"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                  placeholder="Phone number"
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider">
                  Street Address
                </label>
                <textarea
                  rows={2}
                  value={customerFormData.address}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                  placeholder="Street / Flat / Locality"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  value={customerFormData.city}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                  placeholder="City"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  value={customerFormData.state}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, state: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                  placeholder="State"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[0.65rem] font-black text-slate-500 uppercase tracking-wider">
                    PIN / ZIP Code
                  </label>
                  {customerPincodeLoading && (
                    <span className="text-[0.6rem] font-bold text-amber-500 flex items-center gap-1 animate-pulse">
                      <FaSpinner className="animate-spin" size={9} /> Fetching...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={customerFormData.zip_code}
                  onChange={handleCustomerZipCodeChange}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08]"
                  placeholder="6-digit PIN Code (auto-fetches City & State)"
                />
                {customerPincodeStatus && (
                  <div className={`mt-1.5 px-2.5 py-1 rounded-lg text-[0.65rem] font-bold flex items-center gap-1.5 ${
                    customerPincodeStatus.success 
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                      : "bg-red-50 border border-red-200 text-red-600"
                  }`}>
                    {customerPincodeStatus.success ? <FaCheck size={9} className="text-emerald-500 shrink-0" /> : <span className="text-red-500 font-black shrink-0">!</span>}
                    <span>{customerPincodeStatus.success ? `Auto-fetched: ${customerPincodeStatus.message}` : customerPincodeStatus.message}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancelEditCustomer}
                disabled={isSavingCustomer}
                className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs uppercase hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                disabled={isSavingCustomer}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSavingCustomer ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheckCircle size={13} /> Save Customer Information
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SHIPWAY LIVE DELIVERY & SHIPMENT TRACKING CARD */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        {/* Card Header */}
        <div className="p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shadow-sm">
              <FaTruck size={16} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[0.9rem] font-black text-slate-900 uppercase tracking-[0.2em]">
                  Live Delivery & Courier Tracking
                </h3>
                {tracking?.synced ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[0.55rem] font-black uppercase tracking-wider border ${
                      tracking.computed_order_status === "Delivered"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : tracking.computed_order_status === "Shipped"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        tracking.computed_order_status === "Delivered"
                          ? "bg-emerald-500"
                          : tracking.computed_order_status === "Shipped"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                    ></span>
                    {tracking.shipment_status || "Active in Shipway"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[0.55rem] font-black uppercase tracking-wider">
                    Not Synced
                  </span>
                )}
              </div>
              <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Real-time courier telemetry & fulfillment sync via Shipway
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tracking?.shipway_admin_url && (
              <a
                href={tracking.shipway_admin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-wider transition-all border border-slate-200 shadow-sm"
              >
                Shipway Portal <FaExternalLinkAlt size={9} />
              </a>
            )}
            <button
              type="button"
              onClick={fetchTrackingDetails}
              disabled={isFetchingTracking}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
              title="Refresh live status directly from Shipway API"
            >
              <FaSyncAlt
                size={10}
                className={isFetchingTracking ? "animate-spin" : ""}
              />
              {isFetchingTracking ? "Updating..." : "Refresh Live Status"}
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-8">
          {isFetchingTracking && !tracking ? (
            <div className="flex items-center justify-center py-8 gap-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Connecting to Shipway API...</span>
            </div>
          ) : tracking?.synced ? (
            <div className="space-y-6">
              {/* Telemetry Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 1. Courier Partner */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.25em] block">
                    Assigned Courier
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                      <FaTruck size={13} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-black text-slate-900 text-sm tracking-tight truncate uppercase"
                        title={tracking.carrier || "Courier Pending"}
                      >
                        {tracking.carrier || "Carrier Pending Allocation"}
                      </p>
                      {tracking.carrier_code && (
                        <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">
                          Network: {tracking.carrier_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. AWB Tracking Number */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.25em] block">
                    AWB Tracking Number
                  </span>
                  {tracking.awb ? (
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                          {tracking.awb}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(tracking.awb, "awb")}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all shrink-0 shadow-sm"
                          title="Copy AWB Number"
                        >
                          {copiedField === "awb" ? (
                            <FaCheck size={11} className="text-emerald-500" />
                          ) : (
                            <FaCopy size={11} />
                          )}
                        </button>
                      </div>
                      {tracking.direct_tracking_url && (
                        <a
                          href={tracking.direct_tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[0.6rem] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider mt-1 hover:underline"
                        >
                          Track on Courier Site <FaExternalLinkAlt size={8} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      AWB Pending Generation
                    </p>
                  )}
                </div>

                {/* 3. Live Movement & Location */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.25em] block">
                    Live Telemetry Location
                  </span>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 text-xs uppercase tracking-tight truncate">
                      {tracking.delivered_to
                        ? `Hub: ${tracking.delivered_to}`
                        : tracking.destination
                        ? `Destination: ${tracking.destination}`
                        : "Origin Dispatch Location"}
                    </p>
                    <div className="flex items-center gap-2 text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">
                      <span>{tracking.origin || "Origin Hub"}</span>
                      <span>→</span>
                      <span>{tracking.destination || order.city || "Destination"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Manifest / Specifications */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                  <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.25em] block">
                    Shipment Specifications
                  </span>
                  <div className="space-y-1 text-xs font-bold text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[0.6rem] uppercase tracking-wider">Shipway ID:</span>
                      <span className="font-mono text-slate-900">#{tracking.shipway_order_id}</span>
                    </div>
                    {tracking.weight && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-[0.6rem] uppercase tracking-wider">Weight:</span>
                        <span className="text-slate-900">{(parseFloat(tracking.weight) / 1000).toFixed(2)} KG</span>
                      </div>
                    )}
                    {tracking.pickup_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-[0.6rem] uppercase tracking-wider">Pickup Date:</span>
                        <span className="text-slate-900 text-[0.65rem] truncate max-w-[130px]">{tracking.pickup_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Sync Information Footer */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-800">
                    Fulfillment Status automatically synced with Shipway:{" "}
                    <span className="font-black text-indigo-700 uppercase">
                      {tracking.computed_order_status} ({tracking.shipment_status})
                    </span>
                  </span>
                </div>
                <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">
                  Auto-sync active every 10 min
                </span>
              </div>
            </div>
          ) : (
            /* Not Synced State */
            <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <FaTruck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Shipment Not Yet Synced to Shipway
                  </h4>
                  <p className="text-[0.65rem] font-bold text-amber-700 uppercase tracking-widest mt-0.5">
                    Click "Push to Shipway" above to assign a courier partner and generate shipping labels.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePushToShipway}
                disabled={isPushingShipway}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[0.6rem] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isPushingShipway ? "Pushing..." : "Push to Shipway Now"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. ORDER ITEMS & PAYMENT SUMMARY (BELOW CUSTOMER PROFILE) */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: ORDER ITEMS (CARGO MANIFEST) */}
        <div className="col-span-8 space-y-8 max-lg:col-span-12">
          {/* CARGO MANIFEST */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <FaBoxOpen className="text-[#b89000]" />
                <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">
                  Order Items ({isEditing ? editItems.length : order.items.length})
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 bg-[#FECD08] hover:bg-[#c92439] text-white px-4 py-2 rounded-xl text-[0.6rem] font-black uppercase tracking-wider transition-all shadow-sm"
                  >
                    <FaEdit size={11} /> Edit Quantities & Discounts
                  </button>
                ) : (
                  <span className="text-[0.6rem] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                    Editing Mode Active
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[0.55rem] font-black uppercase tracking-widest">
                  <FaTruck size={9} /> Shipway ME-{order.id}
                </span>
              </div>
            </div>

            {/* --- MODE 1: DISPLAY MODE (READ-ONLY WITH DETAILED DISCOUNT BREAKDOWN) --- */}
            {!isEditing ? (
              <div className="divide-y divide-slate-100">
                {order.items.map((item, index) => {
                  const origPrice =
                    parseFloat(item.original_price) ||
                    parseFloat(item.product?.price) ||
                    parseFloat(item.price) ||
                    0;
                  const chargedPrice = parseFloat(item.price) || 0;
                  const itemDiscount =
                    parseFloat(item.discount_amount) || Math.max(0, origPrice - chargedPrice);
                  const isItemDiscounted = itemDiscount > 0 || origPrice > chargedPrice;
                  const itemDiscountPercent =
                    origPrice > 0 ? ((itemDiscount / origPrice) * 100).toFixed(1) : 0;
                  const lineTotal = chargedPrice * (item.quantity || 1);
                  const lineSavings = itemDiscount * (item.quantity || 1);

                  // If order has an overall discount, calculate effective proportional share
                  const effectiveUnitDiscountWithOrder =
                    orderHasOnlyOverallDiscount && origPrice > 0
                      ? (origPrice * (overallDiscountRatio / 100))
                      : 0;

                  return (
                    <div
                      key={item.id || index}
                      className="flex items-center p-8 gap-8 group transition-all hover:bg-slate-50 flex-wrap sm:flex-nowrap"
                    >
                      <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl overflow-hidden group-hover:border-[#FECD08]/30 transition-all duration-500 flex-shrink-0 p-2">
                        <img
                          src={getImageUrl(item.product?.image)}
                          alt={item.product?.title}
                          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-[0.9rem] uppercase tracking-tight mb-1 group-hover:text-[#b89000] transition-colors truncate">
                          {item.product?.title}
                        </p>
                        <p className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                          SKU: {item.sku || item.product?.model_number || item.product?.sku || item.product?.id}
                        </p>
                        {(item.color || item.size || item.material) && (
                          <div className="flex gap-x-3 gap-y-1 flex-wrap text-[0.6rem] uppercase tracking-wider font-bold text-slate-500 mt-1.5">
                            {item.color && (
                              <div>
                                Color: <span className="text-[#b89000]">{item.color}</span>
                              </div>
                            )}
                            {item.size && (
                              <div>
                                Size: <span className="text-[#b89000]">{item.size}</span>
                              </div>
                            )}
                            {item.material && (
                              <div>
                                Material: <span className="text-[#b89000]">{item.material}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PRODUCT DISCOUNT BADGES */}
                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          {isItemDiscounted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[0.6rem] font-black uppercase tracking-wider">
                              <FaTag size={8} />
                              Discount: -Rs. {Number(itemDiscount).toLocaleString()} ({itemDiscountPercent}% off)
                            </span>
                          ) : effectiveUnitDiscountWithOrder > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[0.6rem] font-bold uppercase tracking-wider">
                              <FaTag size={8} />
                              Order Discount: ~{overallDiscountRatio.toFixed(1)}% off (-Rs. {effectiveUnitDiscountWithOrder.toFixed(2)}/unit)
                            </span>
                          ) : (
                            <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">
                              No product discount
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PRICE & TOTAL COLUMN */}
                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        {/* Catalog Price with Strikethrough if discounted */}
                        {isItemDiscounted && (
                          <div className="text-[0.65rem] font-bold text-slate-400 line-through">
                            Catalog: Rs. {Number(origPrice).toLocaleString()}
                          </div>
                        )}

                        {/* Charged Price x Quantity */}
                        <div className="text-[0.75rem] font-black text-slate-800 uppercase tracking-tight">
                          ₹{Number(chargedPrice).toLocaleString()}{" "}
                          <span className="text-slate-400 font-normal">×</span>{" "}
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-black text-slate-900 border border-slate-200">
                            {item.quantity}
                          </span>
                        </div>

                        {/* Line Total */}
                        <div className="text-[1.05rem] font-black text-slate-900 tracking-tight">
                          Rs. {Number(lineTotal).toLocaleString()}
                        </div>

                        {/* Line Savings if discounted */}
                        {lineSavings > 0 && (
                          <span className="text-[0.6rem] font-black text-emerald-600 uppercase tracking-wider">
                            Save Rs. {Number(lineSavings).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- MODE 2: INTERACTIVE EDIT MODE (EDIT QUANTITIES, DISCOUNTS, ADD PRODUCTS) --- */
              <div className="p-8 space-y-8 animate-fadeInUp">
                {/* Search Bar to Add More Products */}
                <div className="relative">
                  <label className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-500 mb-2">
                    Add Product to this Order
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-300 px-4 py-3 rounded-xl focus-within:border-[#FECD08] transition-all">
                    <FaSearch className="text-slate-400 mr-3 shrink-0" size={14} />
                    <input
                      type="text"
                      placeholder="Search catalog by title to add products..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-xs font-bold text-slate-900 placeholder:text-slate-400"
                    />
                    {isSearchingProducts && (
                      <div className="w-4 h-4 border-2 border-[#FECD08] border-t-transparent rounded-full animate-spin shrink-0"></div>
                    )}
                  </div>

                  {/* Search Autocomplete Dropdown */}
                  {showProductDropdown && productSearchResults.length > 0 && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[440px] overflow-y-auto divide-y divide-slate-100">
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
                              onClick={() => handleAddProductToEdit(prod)}
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
                                        {prod.variants.length} Variants
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
                                <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
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
                                        onClick={() => handleAddProductToEdit(prod, v)}
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
                                              handleAddProductToEdit(prod, v);
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

                {/* Editable Items Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500">
                          Product
                        </th>
                        <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 text-right">
                          Catalog Price
                        </th>
                        <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 w-[190px]">
                          Product Discount
                        </th>
                        <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 w-[130px] text-right">
                          Final Unit Price
                        </th>
                        <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 w-[120px] text-center">
                          Quantity
                        </th>
                        <th className="py-3 px-3 text-[0.6rem] font-black uppercase tracking-wider text-slate-500 text-right">
                          Line Total
                        </th>
                        <th className="py-3 px-2 text-center w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editItems.map((item, index) => {
                        const lineTotal =
                          (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1);
                        const isDisc = item.original_price > item.price;
                        const savingPerUnit = Math.max(0, item.original_price - item.price);

                        return (
                          <tr key={item.id || index} className="hover:bg-slate-50/50">
                            {/* Product Info */}
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getImageUrl(item.product?.image)}
                                  alt={item.product?.title}
                                  className="w-10 h-10 object-contain bg-slate-100 rounded-lg border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-900 uppercase line-clamp-1 max-w-[180px]">
                                    {item.product?.title}
                                  </span>
                                  <span className="text-[0.6rem] font-medium text-slate-400 uppercase">
                                    SKU: {item.sku || item.product?.model_number || item.product?.sku || item.product?.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Catalog Price */}
                            <td className="py-4 px-3 text-right">
                              <span
                                className={`text-xs font-bold ${
                                  isDisc ? "line-through text-slate-400" : "text-slate-800"
                                }`}
                              >
                                Rs. {Number(item.original_price).toLocaleString()}
                              </span>
                            </td>

                            {/* Per-Product Discount Controls */}
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-1.5">
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditItemDiscount(index, "fixed", item.discount_val)
                                    }
                                    className={`px-2 py-0.5 rounded text-[0.6rem] font-black ${
                                      item.discount_type === "fixed"
                                        ? "bg-[#FECD08] text-[#212121] font-bold"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    Rs
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditItemDiscount(index, "percent", item.discount_val)
                                    }
                                    className={`px-2 py-0.5 rounded text-[0.6rem] font-black ${
                                      item.discount_type === "percent"
                                        ? "bg-[#FECD08] text-[#212121] font-bold"
                                        : "text-slate-500"
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
                                  value={item.discount_val}
                                  onChange={(e) =>
                                    handleEditItemDiscount(
                                      index,
                                      item.discount_type,
                                      e.target.value
                                    )
                                  }
                                  className="bg-slate-50 border border-slate-300 px-2 py-1 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] w-20"
                                />
                              </div>
                              {isDisc && (
                                <span className="text-[0.6rem] font-black text-emerald-600 block mt-1">
                                  Save Rs. {savingPerUnit.toFixed(2)}/unit
                                </span>
                              )}
                            </td>

                            {/* Final Unit Price Input */}
                            <td className="py-4 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleEditItemPriceDirect(index, e.target.value)}
                                className="bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-black text-slate-900 text-right outline-none focus:border-[#FECD08] w-24"
                              />
                            </td>

                            {/* Quantity Stepper */}
                            <td className="py-4 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditQty(index, -1)}
                                  disabled={item.quantity <= 1}
                                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold disabled:opacity-30"
                                >
                                  <FaMinus size={8} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleEditQtyDirect(index, e.target.value)}
                                  className="w-12 text-center text-xs font-black bg-slate-50 border border-slate-300 rounded-lg py-1 outline-none focus:border-[#FECD08]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleEditQty(index, 1)}
                                  className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold"
                                >
                                  <FaPlus size={8} />
                                </button>
                              </div>
                            </td>

                            {/* Line Total */}
                            <td className="py-4 px-3 text-right">
                              <span className="text-xs font-black text-slate-900">
                                Rs. {Number(lineTotal.toFixed(2)).toLocaleString()}
                              </span>
                            </td>

                            {/* Remove Item */}
                            <td className="py-4 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveEditItem(index)}
                                title="Remove item"
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
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

                {/* Order-Level Discount Controls */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex items-center justify-between gap-6 flex-wrap">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                      Order-Level Discount
                    </h4>
                    <p className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                      Additional discount applied across the entire order
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-white p-0.5 rounded-lg border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditOrderDiscountType("fixed")}
                        className={`px-3 py-1 rounded text-xs font-black ${
                          editOrderDiscountType === "fixed"
                            ? "bg-[#FECD08] text-[#212121] font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        Rs Fixed
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditOrderDiscountType("percent")}
                        className={`px-3 py-1 rounded text-xs font-black ${
                          editOrderDiscountType === "percent"
                            ? "bg-[#FECD08] text-[#212121] font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        % Percent
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editOrderDiscountVal}
                      onChange={(e) => setEditOrderDiscountVal(e.target.value)}
                      placeholder="0.00"
                      className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-[#FECD08] w-28 text-right"
                    />
                  </div>
                </div>

                {/* Action Buttons inside Edit Mode */}
                <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOrderItems}
                    disabled={isSaving}
                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle size={14} /> Save Order Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="p-8 bg-slate-50 border-t border-slate-200 text-right flex justify-between items-center">
              <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                Items count: {isEditing ? editItems.length : order.items.length} products
              </span>
              <button className="bg-slate-100 border border-slate-200 text-slate-500 px-8 py-3 rounded-xl font-black text-[0.6rem] uppercase tracking-[0.2em] transition-all hover:bg-[#FECD08] hover:text-white hover:border-orm-gold">
                Mark as Fulfilled
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FINANCIAL SETTLEMENT & INTERNAL NOTES */}
        <div className="col-span-4 space-y-8 max-lg:col-span-12">
          {/* FINANCIAL SETTLEMENT / PAYMENT SUMMARY */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">
                Payment Summary
              </h3>
              {isEditing && (
                <span className="text-[0.6rem] font-black text-amber-600 uppercase tracking-wider bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Live Preview
                </span>
              )}
            </div>

            <div className="p-8 space-y-4">
              {/* Catalog Subtotal */}
              <div className="flex justify-between text-[0.7rem] font-bold text-slate-700 uppercase tracking-widest">
                <span>
                  Items Base Subtotal (
                  {isEditing ? editItems.length : order.items.length} items)
                </span>
                <span className="text-slate-900">
                  Rs.{" "}
                  {Number(
                    (isEditing ? editCatalogSubtotal : displayCatalogSubtotal).toFixed(2)
                  ).toLocaleString()}
                </span>
              </div>

              {/* Product Level Discounts */}
              {(isEditing ? editItemDiscountsTotal : displayItemDiscountsTotal) > 0 && (
                <div className="flex justify-between text-[0.7rem] font-bold text-emerald-600 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <FaTag size={10} /> Product Discounts
                  </span>
                  <span>
                    - Rs.{" "}
                    {Number(
                      (isEditing ? editItemDiscountsTotal : displayItemDiscountsTotal).toFixed(2)
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Order Level Discount */}
              {(isEditing ? editOrderDiscountAmt : displayOrderDiscountAmt) > 0 && (
                <div className="flex justify-between text-[0.7rem] font-bold text-[#b89000] uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <FaPercentage size={10} /> Order Discount
                  </span>
                  <span>
                    - Rs.{" "}
                    {Number(
                      (isEditing ? editOrderDiscountAmt : displayOrderDiscountAmt).toFixed(2)
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Total Discount Saved Highlight */}
              {(isEditing ? editTotalSavings : displayTotalSavings) > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs font-black text-emerald-700 uppercase tracking-wider">
                  <span>Total Savings On Order</span>
                  <span>
                    - Rs.{" "}
                    {Number(
                      (isEditing ? editTotalSavings : displayTotalSavings).toFixed(2)
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-[0.7rem] font-bold text-slate-700 uppercase tracking-widest">
                <span>Shipping</span>
                <span className="text-slate-900">Rs. 0.00</span>
              </div>

              <div className="flex justify-between text-[0.7rem] font-bold text-slate-700 uppercase tracking-widest">
                <span>Tax (Included)</span>
                <span className="text-slate-900">Rs. 0.00</span>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.3em]">
                  Total Amount
                </span>
                <span className="text-2xl font-black text-[#b89000] tracking-tighter">
                  Rs.{" "}
                  {Number(
                    (isEditing ? editGrandTotal : order.total_price)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[0.55rem] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Payment Status
                </span>
                <span className="text-[0.8rem] font-bold text-slate-900 tracking-tight">
                  {order.is_paid ? "Paid in Full" : "Payment Pending / Unpaid"}
                </span>
              </div>
              {!order.is_paid && (
                <button
                  type="button"
                  onClick={async () => {
                    const token = localStorage.getItem("orm_admin_token");
                    try {
                      const res = await fetch(`${BASE_URL}/api/orders/${order.id}/`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Token ${token}`,
                        },
                        body: JSON.stringify({ is_paid: true }),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setOrder(updated);
                        alert("Order marked as Paid!");
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.6rem] uppercase tracking-[0.2em] transition-all hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)]"
                >
                  Accept Payment
                </button>
              )}
            </div>
          </div>

          {/* CUSTOM ORDER NOTE / INVOICE INSTRUCTIONS */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">
                  Order Notes
                </h3>
                <span className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                  Printed on Customer Invoice
                </span>
              </div>
              {!isEditingNote ? (
                <button
                  type="button"
                  onClick={() => {
                    setNoteText(order?.custom_note || "");
                    setIsEditingNote(true);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-[#FECD08] hover:text-white rounded-lg text-slate-600 text-[0.6rem] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Edit Note
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-600 text-[0.6rem] font-bold uppercase transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[0.6rem] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isSavingNote ? "Saving..." : "Save Note"}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
              {isEditingNote ? (
                <div className="space-y-3">
                  <textarea
                    rows="4"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter special instructions, terms, bank reference, or custom notes (will appear on invoice)..."
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FECD08] placeholder:text-slate-400 resize-none transition-all"
                  />
                  <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-wider">
                    Tip: Any notes saved here will immediately reflect on the downloadable and emailable PDF invoice.
                  </p>
                </div>
              ) : order?.custom_note ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {order.custom_note}
                  </p>
                </div>
              ) : (
                <p className="text-[0.65rem] font-bold text-slate-400 italic uppercase tracking-widest">
                  No custom note for this order
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
