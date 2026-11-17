import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaSave,
  FaArrowLeft,
  FaImages,
  FaVideo,
  FaCube,
  FaCogs,
  FaTag,
  FaInfoCircle,
  FaTrash,
  FaPlus,
  FaPalette,
  FaCamera,
} from "react-icons/fa";

const cleanImageUrl = (path) => {
  if (!path) return "";
  const pathStr = path.toString().trim();
  if (pathStr.includes("http://") || pathStr.includes("https://") || pathStr.includes("http//") || pathStr.includes("https//")) {
    let clean = pathStr.startsWith("/") ? pathStr.slice(1) : pathStr;
    return clean.replace("https//", "https://").replace("http//", "http://");
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const cleanPath = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
  return `${apiBase}${cleanPath}`;
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["link", "clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "color",
  "background",
  "align",
  "link",
];

const AddProduct = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const token = localStorage.getItem("orm_admin_token");

  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    weight: "",
    category: "Accessories",
    collections: [],
    description: "",
    long_description: "",
    price: "",
    old_price: "",
    rating: 0.0,
    is_sale: false,
    video_url: "",
    instagram_reel: "",
    color: "",
    material: "",
    size: "",
    vendor: "lbcmoto.com",
    model_number: "",
    feature: "",
    specifications: "",
  });

  // Color Variants state
  const [variants, setVariants] = useState([]);
  const [imagePickerVariantIndex, setImagePickerVariantIndex] = useState(null);

  useEffect(() => {
    if (imagePickerVariantIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [imagePickerVariantIndex]);

  const [collections, setCollections] = useState([]);
  const [mainImage, setMainImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);

  const [mainPreview, setMainPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/collections/`)
      .then((res) => res.json())
      .then((data) => setCollections(data))
      .catch((err) => console.error("Error loading collections:", err));
  }, []);

  const [productId, setProductId] = useState(null);
  const [reviews, setReviews] = useState([]);

  const loadReviews = (prodId) => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reviews/?product=${prodId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => console.error("Error loading reviews:", err));
  };

  useEffect(() => {
    if (productId) {
      loadReviews(productId);
    }
  }, [productId]);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reviews/${reviewId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      if (res.ok) {
        alert("Review deleted successfully!");
        loadReviews(productId);
      } else {
        alert("Failed to delete review.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting review.");
    }
  };

  useEffect(() => {
    if (slug) {
      setIsEditMode(true);
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/${slug}/`)
        .then((res) => res.json())
        .then((data) => {
          setProductId(data.id);
          setFormData({
            title: data.title,
            slug: data.slug,
            category: data.category,
            collections: data.collections || [],
            description: data.description || "",
            long_description: data.long_description || "",
            price: data.price,
            old_price: data.old_price || "",
            rating: data.rating,
            is_sale: data.is_sale,
            weight: data.weight || "",
            video_url: data.video_url || "",
            instagram_reel: data.instagram_reel || "",
            color: data.color || "",
            material: data.material || "",
            size: data.size || "",
            vendor: data.vendor || "lbcmoto.com",
            model_number: data.model_number || "",
            feature: data.feature || "",
            specifications: data.specifications || "",
          });

          if (data.image) {
            setMainPreview(cleanImageUrl(data.image));
          }

          if (data.images && data.images.length > 0) {
            const existing = data.images.map((img) => ({
              id: img.id,
              url: cleanImageUrl(img.image),
              isExisting: true,
              color: img.color || "",
            }));
            setGalleryPreviews(existing);
          }

          // Populate variants from backend if available, or parse from color field
          if (data.variants && data.variants.length > 0) {
            setVariants(
              data.variants.map((v) => ({
                id: v.id,
                color: v.color || "",
                color_code: v.color_code || "",
                price: v.price != null ? v.price : "",
                stock_quantity: v.stock_quantity != null ? v.stock_quantity : 0,
                sku: v.sku || "",
                image_url: v.image ? cleanImageUrl(v.image) : "",
                image_file: null,
                selected: false,
              }))
            );
          } else if (data.color) {
            const parsedColors = data.color.split(",").map((c) => c.trim()).filter(Boolean);
            if (parsedColors.length > 0) {
              setVariants(
                parsedColors.map((cName) => {
                  const matchingImg = (data.images || []).find(
                    (img) => (img.color || "").trim().toLowerCase() === cName.toLowerCase()
                  );
                  return {
                    id: null,
                    color: cName,
                    color_code: "",
                    price: data.price || "",
                    stock_quantity: data.stock_quantity || 0,
                    sku: "",
                    image_url: matchingImg ? cleanImageUrl(matchingImg.image) : "",
                    image_file: null,
                    selected: false,
                  };
                })
              );
            }
          }
        })
        .catch((err) => console.error("Error fetching product:", err));
    }
  }, [slug]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      setMainPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryImages([...galleryImages, ...files]);

    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      isExisting: false,
    }));
    setGalleryPreviews([...galleryPreviews, ...newPreviews]);
  };

  const removeGalleryImage = async (index, imgObj) => {
    if (imgObj.isExisting) {
      const confirmDelete = window.confirm("Permanently delete image from server?");
      if (!confirmDelete) return;

      try {
        await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/product-images/${imgObj.id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
      } catch (err) {
        alert("Deletion failed");
      }
    } else {
      setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const updatedPreviews = [...galleryPreviews];
    const [draggedItem] = updatedPreviews.splice(sourceIndex, 1);
    updatedPreviews.splice(targetIndex, 0, draggedItem);
    setGalleryPreviews(updatedPreviews);
  };

  // Color Variant Actions
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: null,
        color: `Option ${prev.length + 1}`,
        color_code: "",
        price: formData.price || "",
        stock_quantity: 1,
        sku: "",
        image_url: "",
        image_file: null,
        selected: false,
      },
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleVariantImageFile = (index, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], image_file: file, image_url: previewUrl };
      return updated;
    });
    setImagePickerVariantIndex(null);
  };

  const handleVariantImageSelect = (index, url, file = null) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], image_url: url, image_file: file };
      return updated;
    });
    setImagePickerVariantIndex(null);
  };

  const handleSelectAllVariants = (checked) => {
    setVariants((prev) => prev.map((v) => ({ ...v, selected: checked })));
  };

  const handleSelectVariant = (index, checked) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: checked };
      return updated;
    });
  };

  const handleDeleteSelectedVariants = () => {
    if (!window.confirm("Remove selected variants?")) return;
    setVariants((prev) => prev.filter((v) => !v.selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key !== "slug" && key !== "collections") {
        data.append(key, formData[key]);
      }
    });

    if (formData.collections && formData.collections.length > 0) {
      formData.collections.forEach((id) => {
        data.append("collections", id);
      });
    }

    if (mainImage) data.append("image", mainImage);

    galleryImages.forEach((file) => {
      data.append("gallery_images", file);
    });

    if (isEditMode) {
      const existingIds = galleryPreviews.filter((p) => p.isExisting).map((p) => p.id);
      data.append("reordered_image_ids", JSON.stringify(existingIds));
    }

    // Attach structured color variants data & individual variant photos
    if (variants.length > 0) {
      const variantsPayload = variants.map((v) => ({
        id: v.id,
        color: v.color.trim(),
        color_code: v.color_code || null,
        price: v.price !== "" ? v.price : null,
        stock_quantity: parseInt(v.stock_quantity) || 0,
        sku: v.sku || null,
        image_url: (v.image_url && !v.image_url.startsWith("blob:")) ? v.image_url : null,
      }));
      data.append("variants_data", JSON.stringify(variantsPayload));

      variants.forEach((v, idx) => {
        if (v.image_file) {
          data.append(`variant_image_${idx}`, v.image_file);
        }
      });

      // Synchronize comma-separated colors and total stock for full backward compatibility
      data.set("color", variants.map((v) => v.color.trim()).filter(Boolean).join(", "));
      const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0);
      data.set("stock_quantity", totalStock);
    }

    try {
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/${isEditMode ? slug + "/" : ""}`;
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Token ${token}`,
        },
        body: data,
      });

      if (response.ok) {
        alert(isEditMode ? "Product Updated Successfully" : "Product Created Successfully");
        navigate("/react-admin/products");
      } else {
        try {
          const errData = await response.json();
          let errorMsg = "Error Saving Product:\n";
          Object.keys(errData).forEach((field) => {
            const fieldErrors = Array.isArray(errData[field]) ? errData[field] : [errData[field]];
            errorMsg += `\n• ${field.toUpperCase()}: ${fieldErrors.join(", ")}`;
          });
          alert(errorMsg);
        } catch (e) {
          alert("Error Saving Product. Please try again.");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Network error saving product.");
    } finally {
      setLoading(false);
    }
  };

  const priceVal = parseFloat(formData.price);
  const oldPriceVal = parseFloat(formData.old_price);
  const discountPercent = (priceVal && oldPriceVal && oldPriceVal > priceVal)
    ? Math.round(((oldPriceVal - priceVal) / oldPriceVal) * 100)
    : 0;

  return (
    <div className="space-y-10 animate-fadeInUp">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white shadow-sm backdrop-blur-3xl border border-slate-200 p-8 rounded-[2rem] sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button
            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 transition-all hover:text-slate-900 hover:border-slate-200 active:scale-90"
            onClick={() => navigate("/react-admin/products")}
          >
            <FaArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="w-2 h-2 bg-[#FECD08] rounded-full animate-pulse shadow-[0_0_10px_#FECD08]"></div>
               <span className="text-[0.55rem] font-black uppercase tracking-[0.4em] text-[#FECD08]/60">{isEditMode ? "Edit Product" : "New Product"}</span>
            </div>
            <h2 className="text-[1.8rem] font-black text-slate-900 uppercase tracking-tighter leading-none">
              {isEditMode ? "Update" : "Add"} <span className="text-[#b89000]">Product</span>
            </h2>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            className="px-8 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] border border-slate-200 text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
            onClick={() => navigate("/react-admin/products")}
          >
            Discard
          </button>
          <button
            className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-10 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] transition-all flex items-center gap-3 hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            <span className="relative z-10 flex items-center gap-3">{loading ? "Saving..." : "Save Product"} <FaSave /></span>
            <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
          </button>
        </div>
      </div>

      <form className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CORE SPECS */}
        <div className="col-span-8 flex flex-col gap-8 max-lg:col-span-12">
          {/* GENERAL INFO */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <FaInfoCircle className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Product Details</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                    placeholder="Enter product title..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Slug</label>
                  <input
                    type="text"
                    value={isEditMode ? formData.slug : "auto-generated"}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-500 text-sm font-mono tracking-tight outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Description</label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter product description with rich text, bold, tables..."
                  className="bg-white rounded-xl text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Big Description (Specs Section)</label>
                <ReactQuill
                  theme="snow"
                  value={formData.long_description}
                  onChange={(content) => setFormData((prev) => ({ ...prev, long_description: content }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Enter detailed long description, formatting, tables..."
                  className="bg-white rounded-xl text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* MEDIA UPLOADS */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <FaImages className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Media</h3>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* MAIN VISUAL */}
              <div className="space-y-4">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Main Image</label>
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-white border border-slate-200 group">
                  {mainPreview ? (
                    <>
                      <img src={mainPreview} alt="Preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <button
                        type="button"
                        className="absolute top-4 right-4 w-8 h-8 bg-slate-900/60 backdrop-blur-xl text-slate-900 rounded-lg flex items-center justify-center transition-all hover:bg-red-500"
                        onClick={() => { setMainImage(null); setMainPreview(null); }}
                      >
                        <FaTimes size={10} />
                      </button>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-100/50">
                      <FaCloudUploadAlt className="text-3xl text-[#FECD08]/40 mb-3" />
                      <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-slate-500">Upload Image</span>
                      <input type="file" onChange={handleMainImageChange} accept="image/*" hidden />
                    </label>
                  )}
                </div>
              </div>


            </div>

            {/* SECONDARY GALLERY */}
            <div className="space-y-4">
              <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Product Gallery (Drag to rearrange)</label>
              <div className="grid grid-cols-6 gap-4">
                {galleryPreviews.map((img, index) => {
                  const availableColors = formData.color ? formData.color.split(',').map(s => s.trim()).filter(Boolean) : [];
                  return (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="relative flex flex-col items-center border border-slate-200 bg-white rounded-xl p-2 group cursor-grab active:cursor-grabbing hover:border-[#FECD08]/40 transition-all shadow-sm"
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-50">
                        <img src={img.url} alt="Gallery" className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute top-1 left-1 bg-slate-900/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[0.5rem] font-bold text-white pointer-events-none uppercase tracking-widest opacity-80">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); removeGalleryImage(index, img); }}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                      
                      {/* Color Tag Selection */}
                      {availableColors.length > 0 && img.isExisting && (
                        <select
                          value={img.color || ""}
                          onChange={async (e) => {
                            const newColor = e.target.value;
                            const updated = galleryPreviews.map((p, idx) => idx === index ? { ...p, color: newColor } : p);
                            setGalleryPreviews(updated);
                            try {
                              await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/product-images/${img.id}/`, {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Token ${token}`,
                                    },
                                    body: JSON.stringify({ color: newColor || null }),
                                  });
                            } catch (err) {
                              console.error("Failed to update image color", err);
                            }
                          }}
                          className="w-full mt-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-[0.6rem] font-bold outline-none cursor-pointer focus:border-[#FECD08]/50"
                        >
                          <option value="">Tag Color</option>
                          {availableColors.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
                <label className="aspect-square flex flex-col items-center justify-center bg-slate-100/50 border border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-orm-gold/40 hover:bg-slate-100 transition-all text-slate-500 hover:text-[#b89000] mt-2">
                  <FaPlus size={16} />
                  <span className="text-[0.5rem] font-black uppercase mt-2">ADD</span>
                  <input type="file" multiple onChange={handleGalleryChange} accept="image/*" hidden />
                </label>
              </div>
            </div>

            {/* INSTAGRAM REEL LINK */}
            <div className="space-y-2 pt-6 border-t border-slate-100">
              <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Instagram Reel Link</label>
              <input
                type="url"
                name="instagram_reel"
                value={formData.instagram_reel}
                onChange={handleChange}
                placeholder="e.g. https://www.instagram.com/reel/C3_abc123/"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
              />
            </div>
          </div>

          {/* COLOR VARIANTS CARD */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FECD08]/10 text-[#b89000] flex items-center justify-center font-bold">
                  <FaPalette size={16} />
                </div>
                <div>
                  <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">
                    Variants ({variants.length})
                  </h3>
                  <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Manage colors, dedicated images, stock and variant pricing
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {variants.some((v) => v.selected) && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedVariants}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <FaTrash size={10} />
                    <span>Delete ({variants.filter((v) => v.selected).length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-4 py-2 bg-slate-900 hover:bg-[#FECD08] text-[#212121] font-bold rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                >
                  <FaPlus size={10} />
                  <span>Add variant</span>
                </button>
              </div>
            </div>

            {variants.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                <FaPalette className="mx-auto text-slate-300 text-2xl" />
                <div>
                  <p className="text-xs font-bold text-slate-700">No color variants created yet</p>
                  <p className="text-[0.6rem] text-slate-400 mt-1">
                    Click "Add variant" to set up individual colors with custom photos and separate inventory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3 py-1.5 bg-[#FECD08] text-[#212121] font-bold rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90"
                >
                  + Add First Variant
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[0.6rem] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={variants.length > 0 && variants.every((v) => v.selected)}
                          onChange={(e) => handleSelectAllVariants(e.target.checked)}
                          className="accent-[#FECD08] rounded"
                        />
                      </th>
                      <th className="py-3 px-4">Variant</th>
                      <th className="py-3 px-4 w-40">Price (₹)</th>
                      <th className="py-3 px-4 w-36">Available</th>
                      <th className="py-3 px-4 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variants.map((v, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${v.selected ? "bg-red-50/20" : ""}`}>
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={v.selected || false}
                            onChange={(e) => handleSelectVariant(idx, e.target.checked)}
                            className="accent-[#FECD08] rounded"
                          />
                        </td>

                        {/* Thumbnail + Variant Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setImagePickerVariantIndex(idx)}
                              title="Click to choose or upload variant image"
                              className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center group shrink-0 hover:border-[#FECD08] transition-all cursor-pointer"
                            >
                              {v.image_url ? (
                                <>
                                  <img
                                    src={cleanImageUrl(v.image_url)}
                                    alt={v.color}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <FaCamera size={12} />
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#b89000] transition-colors">
                                  <FaCamera size={14} />
                                  <span className="text-[0.45rem] font-bold mt-0.5 uppercase">Image</span>
                                </div>
                              )}
                            </button>

                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <input
                                type="text"
                                value={v.color}
                                onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                                placeholder="e.g. Matte Black"
                                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 text-xs font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                                required
                              />
                              <input
                                type="color"
                                value={v.color_code || "#000000"}
                                onChange={(e) => handleVariantChange(idx, "color_code", e.target.value)}
                                title="Pick swatch color"
                                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0.5 shrink-0"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={v.price !== null && v.price !== undefined ? v.price : ""}
                              onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                              placeholder={formData.price ? `${formData.price}` : "0"}
                              className="w-full bg-slate-50 border border-slate-200 pl-7 pr-3 py-2 rounded-xl text-slate-900 text-xs font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                            />
                          </div>
                        </td>

                        {/* Available Stock */}
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            value={v.stock_quantity !== undefined ? v.stock_quantity : 0}
                            onChange={(e) => handleVariantChange(idx, "stock_quantity", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 text-xs font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all text-center"
                          />
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Delete variant"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500">
                      <td colSpan={5} className="py-3 px-4 text-right">
                        <span className="font-medium">Total inventory at Shop location: </span>
                        <strong className="font-bold text-slate-900">
                          {variants.reduce((sum, v) => sum + (parseInt(v.stock_quantity) || 0), 0)} available
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* TECHNICAL SPECS */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <FaCogs className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Specifications</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Material Options (comma-separated)</label>
                  <input
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                    placeholder="e.g. silk + PU cushion, Leather"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Size Options (comma-separated)</label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                    placeholder="e.g. S, M, L, XL"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Vendor</label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                    placeholder="e.g. lbcmoto.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">SKU / Model Number</label>
                  <input
                    type="text"
                    name="model_number"
                    value={formData.model_number}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                    placeholder="e.g. CL3 or 31004"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Feature</label>
                  <input
                    type="text"
                    name="feature"
                    value={formData.feature}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                    placeholder="e.g. Sports Equipment"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Product Specs (Line Delimited)</label>
                <textarea
                  name="specifications"
                  value={formData.specifications}
                  rows="5"
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-mono outline-none focus:border-[#FECD08] transition-all no-scrollbar"
                  placeholder="MATERIAL: STEEL&#10;FINISH: MATTE&#10;COMPATIBILITY: THAR"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOGISTICS */}
        <div className="col-span-4 flex flex-col gap-8 max-lg:col-span-12">
          {/* CLASSIFICATION */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 pb-4 border-b border-slate-200">Organization</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Category</label>
                <select
                  name="category"
                  onChange={handleChange}
                  value={formData.category}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all appearance-none"
                >
                  <option value="Brand" className="bg-white text-slate-900">Brand</option>
                  <option value="Mototech" className="bg-white text-slate-900">Mototech</option>
                  <option value="Accessories" className="bg-white text-slate-900">Accessories</option>
                  <option value="Riding Gears" className="bg-white text-slate-900">Riding Gears</option>
                  <option value="Touring & Luggage" className="bg-white text-slate-900">Touring & Luggage</option>
                  <option value="Fuel Tank" className="bg-white text-slate-900">Fuel Tank</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Collections</label>
                <div className="max-h-[160px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 scrollbar-thin">
                  {collections.map((coll) => {
                    const isChecked = formData.collections?.includes(coll.id);
                    return (
                      <label key={coll.id} className="flex items-center gap-3 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={(e) => {
                            const newCols = e.target.checked
                              ? [...(formData.collections || []), coll.id]
                              : (formData.collections || []).filter(id => id !== coll.id);
                            setFormData({ ...formData, collections: newCols });
                          }}
                          className="accent-[#FECD08] rounded"
                        />
                        <span>{coll.title}</span>
                      </label>
                    );
                  })}
                  {collections.length === 0 && (
                    <span className="text-[0.6rem] font-black text-slate-400 uppercase tracking-wider block py-2 text-center">No Collections Available</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Weight</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g. 10kg"
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 group">
                <div className="flex flex-col">
                   <span className="text-[0.65rem] font-black text-slate-900 uppercase tracking-widest">Sale Status</span>
                   <span className="text-[0.5rem] font-bold text-slate-500 uppercase tracking-[0.2em]">Show on Sale</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="is_sale" checked={formData.is_sale} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/20 after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FECD08] peer-checked:after:bg-black"></div>
                </label>
              </div>
            </div>
          </div>

          {/* VALUATION */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-6 shadow-2xl shadow-[#FECD08]/5">
            <div className="flex items-center gap-4 mb-2">
               <FaTag className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Pricing</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Price (RS)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-[#FECD08]/5 border border-[#FECD08]/20 p-4 rounded-xl text-[#b89000] text-lg font-black tracking-tighter outline-none focus:bg-[#FECD08]/10 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Old Price (RS)</label>
                <input
                  type="number"
                  name="old_price"
                  value={formData.old_price}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 text-sm font-bold tracking-tight outline-none focus:border-slate-200 transition-all"
                />
              </div>
              {discountPercent > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between animate-fadeIn">
                  <span className="text-[0.55rem] font-black text-green-700 uppercase tracking-[0.2em] ml-1">Calculated Discount</span>
                  <span className="text-[0.8rem] font-black text-green-700">{discountPercent}% OFF</span>
                </div>
              )}
            </div>
          </div>

          {/* REVIEWS MANAGEMENT SECTION */}
          {isEditMode && (
            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-[2.5rem] mt-8 shadow-2xl shadow-[#FECD08]/5 animate-fadeIn space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-[0.75rem] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#FECD08] shadow-[0_0_8px_#FECD08]" /> Product Reviews ({reviews.length})
                </h3>
                <p className="text-[0.55rem] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage customer comments</p>
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
                {reviews.map((review) => (
                  <div key={review.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 flex justify-between items-start gap-3 hover:border-slate-300 transition-all">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.65rem] font-black text-slate-800 uppercase tracking-wider truncate max-w-[100px]">{review.name}</span>
                        <span className="text-[0.5rem] font-bold text-slate-400">({new Date(review.created_at).toLocaleDateString()})</span>
                        <div className="flex text-amber-500 text-[10px]">
                          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                        </div>
                      </div>
                      <p className="text-[0.7rem] text-slate-600 font-medium tracking-wide break-words leading-relaxed">{review.comment}</p>
                      
                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {review.images.map((img) => (
                            <div key={img.id} className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                              <img 
                                src={cleanImageUrl(img.image)} 
                                alt="review" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteReview(review.id)}
                      className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border border-red-500/20 active:scale-95"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                ))}

                {reviews.length === 0 && (
                  <div className="py-12 text-center text-[0.6rem] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 rounded-2xl opacity-40">
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* VARIANT IMAGE PICKER MODAL */}
      {imagePickerVariantIndex !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setImagePickerVariantIndex(null)}
          >
            <div
              className="bg-white rounded-[2rem] p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-200 animate-fadeIn my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Choose Variant Image ({variants[imagePickerVariantIndex]?.color || "Option"})
                  </h4>
                  <p className="text-[0.6rem] text-slate-400 mt-0.5">
                    Upload a new photo or select from existing product gallery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImagePickerVariantIndex(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer"
                >
                  <FaTimes size={12} />
                </button>
              </div>

              {/* Option 1: Upload from device */}
              <div className="space-y-2">
                <label className="text-[0.6rem] font-black text-slate-700 uppercase tracking-wider">
                  Upload New Image
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-[#FECD08] hover:bg-red-50/20 transition-all text-slate-500 hover:text-[#b89000]">
                  <FaCloudUploadAlt size={28} className="mb-2" />
                  <span className="text-xs font-bold">Browse device / Drop image</span>
                  <span className="text-[0.55rem] text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleVariantImageFile(imagePickerVariantIndex, e.target.files[0]);
                      }
                    }}
                    hidden
                  />
                </label>
              </div>

              {/* Option 2: Select from existing gallery */}
              {(mainPreview || galleryPreviews.length > 0) && (
                <div className="space-y-3">
                  <label className="text-[0.6rem] font-black text-slate-700 uppercase tracking-wider">
                    Or select from Product Gallery
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-56 overflow-y-auto p-1 scrollbar-thin">
                    {mainPreview && (
                      <button
                        type="button"
                        onClick={() => handleVariantImageSelect(imagePickerVariantIndex, mainPreview, mainImage || null)}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-[#FECD08] focus:border-[#FECD08] transition-all group cursor-pointer"
                      >
                        <img src={cleanImageUrl(mainPreview)} alt="Main" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[0.45rem] font-bold py-0.5 uppercase tracking-wider text-center">
                          Main
                        </span>
                      </button>
                    )}
                    {galleryPreviews.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleVariantImageSelect(imagePickerVariantIndex, p.url, p.file || null)}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-[#FECD08] focus:border-[#FECD08] transition-all group cursor-pointer"
                      >
                        <img src={cleanImageUrl(p.url)} alt={`Gallery ${pIdx}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[0.45rem] font-bold py-0.5 uppercase tracking-wider text-center">
                          Gallery #{pIdx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Remove current image option */}
              {variants[imagePickerVariantIndex]?.image_url && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      handleVariantChange(imagePickerVariantIndex, "image_url", "");
                      handleVariantChange(imagePickerVariantIndex, "image_file", null);
                      setImagePickerVariantIndex(null);
                    }}
                    className="text-xs text-red-500 hover:underline font-bold cursor-pointer"
                  >
                    Remove variant image
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AddProduct;
