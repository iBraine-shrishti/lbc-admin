import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSearch,
  FaTimes,
  FaLayerGroup,
  FaBoxOpen,
  FaTrash,
  FaMicrochip,
  FaImage,
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

const EditCollection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreateMode = id === "new";

  const [collection, setCollection] = useState({ title: "", category: "Brand", description: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("orm_admin_token");

  useEffect(() => {
    if (!isCreateMode) {
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/collections/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setCollection(data);
          if (data.image) {
            setImagePreview(cleanImageUrl(data.image));
          }
        })
        .catch((err) => console.error(err));
    }

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/`)
      .then((res) => res.json())
      .then((data) => {
        setAllProducts(data);
        if (!isCreateMode) {
          const inCollection = data.filter((p) => p.collections?.includes(parseInt(id)));
          setProducts(inCollection);
        }
      });
  }, [id, isCreateMode, token]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let url = isCreateMode
        ? `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/collections/`
        : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/collections/${id}/`;
      let method = isCreateMode ? "POST" : "PATCH";

      const payload = new FormData();
      payload.append("title", collection.title);
      payload.append("category", collection.category);
      payload.append("description", collection.description || "");
      if (imageFile) {
        payload.append("image", imageFile);
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Token ${token}`,
        },
        body: payload,
      });

      if (response.ok) {
        const savedCol = await response.json();
        if (isCreateMode && products.length > 0) {
          for (const p of products) {
            const currentCols = p.collections || [];
            if (!currentCols.includes(savedCol.id)) {
              const newCols = [...currentCols, savedCol.id];
              await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/${p.slug}/`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${token}`,
                },
                body: JSON.stringify({ collections: newCols }),
              });
            }
          }
        }
        alert("Collection Saved Successfully");
        navigate("/react-admin/products/collections");
      } else {
        try {
          const errData = await response.json();
          let errorMsg = "Error Saving Collection:\n";
          Object.keys(errData).forEach((field) => {
            const fieldErrors = Array.isArray(errData[field]) ? errData[field] : [errData[field]];
            errorMsg += `\n• ${field.toUpperCase()}: ${fieldErrors.join(", ")}`;
          });
          alert(errorMsg);
        } catch (e) {
          alert("Error Saving Collection. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this collection? Products inside this collection will not be deleted, but they will be unassigned from this collection.");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/collections/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        alert("Collection Deleted Successfully");
        navigate("/react-admin/products/collections");
      } else {
        alert("Failed to delete collection. Ensure you have the permissions.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async (productObj) => {
    const colId = parseInt(id);
    if (!isCreateMode) {
      const currentCols = productObj.collections || [];
      if (!currentCols.includes(colId)) {
        const newCols = [...currentCols, colId];
        await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/${productObj.slug}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ collections: newCols }),
        });
        productObj.collections = newCols;
      }
    }
    setProducts([...products, productObj]);
    setSearch("");
  };

  const removeFromCollection = async (productObj) => {
    const colId = parseInt(id);
    if (!isCreateMode) {
      const currentCols = productObj.collections || [];
      const newCols = currentCols.filter((cId) => cId !== colId);
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/products/${productObj.slug}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ collections: newCols }),
      });
      productObj.collections = newCols;
    }
    setProducts(products.filter((p) => p.id !== productObj.id));
  };

  const searchResults = allProducts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fadeInUp pb-20">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white shadow-sm backdrop-blur-3xl border border-slate-200 p-8 rounded-[2rem] sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link
            to="/react-admin/products/collections"
            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 transition-all hover:text-slate-900 hover:border-slate-200 active:scale-90"
          >
            <FaArrowLeft />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
               <span className="text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">{isCreateMode ? "New Collection" : "Edit Collection"}</span>
            </div>
            <h2 className="text-[1.8rem] font-black text-slate-900 uppercase tracking-tighter leading-none">
              {isCreateMode ? "Create" : "Update"} <span className="text-slate-900 font-heading">Collection</span>
            </h2>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            className="px-8 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] border border-slate-200 text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-10 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] transition-all flex items-center gap-3 hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            onClick={handleSave}
            disabled={loading}
          >
            <span className="relative z-10 flex items-center gap-3">{loading ? "Saving..." : "Save Collection"} <FaSave /></span>
            <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
          </button>
          {!isCreateMode && (
            <button
              className="px-8 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] bg-red-500/10 border border-red-500/20 text-red-500 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Collection
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CORE DEFINITION */}
        <div className="col-span-7 flex flex-col gap-8 max-lg:col-span-12">
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <FaLayerGroup className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Collection Details</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Title</label>
                <input
                  type="text"
                  value={collection.title}
                  onChange={(e) => setCollection({ ...collection, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                  placeholder="e.g. Summer Collection"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Navbar Category</label>
                <select
                  value={collection.category || "Brand"}
                  onChange={(e) => setCollection({ ...collection, category: e.target.value })}
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
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Collection Image</label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  {imagePreview ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
                      <FaImage size={18} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="collection-image-input"
                    />
                    <label
                      htmlFor="collection-image-input"
                      className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-lg text-[0.6rem] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:border-slate-300 cursor-pointer transition-colors"
                    >
                      Choose Image File
                    </label>
                    <p className="text-[0.55rem] text-slate-300 font-bold uppercase tracking-wider mt-2">Max Size: 5MB (JPG/PNG/WEBP)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Description</label>
                <textarea
                  name="description"
                  rows="6"
                  value={collection.description}
                  onChange={(e) => setCollection({ ...collection, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-medium leading-relaxed outline-none focus:border-[#FECD08] transition-all no-scrollbar"
                  placeholder="Enter collection description..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UNIT ASSIGNMENT */}
        <div className="col-span-5 flex flex-col gap-8 max-lg:col-span-12">
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <FaBoxOpen className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Products in Collection</h3>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus-within:border-orm-gold/50 transition-all">
                  <FaSearch className="text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none ml-3 w-full text-[0.75rem] font-bold text-slate-900 placeholder:text-slate-300 tracking-tight"
                  />
                </div>
                
                {search && (
                  <div className="absolute top-[120%] left-0 w-full bg-white shadow-lg backdrop-blur-3xl border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto p-2 no-scrollbar animate-fadeInUp">
                    {searchResults.map((p) => {
                      const isAdded = products.some((existing) => existing.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            isAdded
                              ? "opacity-60 cursor-not-allowed bg-slate-50"
                              : "cursor-pointer hover:bg-slate-100 group"
                          }`}
                          onClick={() => !isAdded && addToCollection(p)}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                              <img src={cleanImageUrl(p.image)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[0.7rem] font-bold text-slate-500 group-hover:text-[#b89000] transition-colors truncate">{p.title}</span>
                          </div>
                          {isAdded && (
                            <span className="text-[0.55rem] bg-slate-200 text-slate-500 font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                              Added
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {searchResults.length === 0 && <div className="p-4 text-center text-[0.6rem] font-black uppercase text-slate-500">No products found</div>}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Assigned Products ({products.length})</label>
                <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-[#FECD08]/20 transition-all">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img src={cleanImageUrl(p.image)} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <span className="block text-[0.7rem] font-bold text-slate-900 uppercase tracking-tight truncate">{p.title}</span>
                         <span className="text-[0.5rem] font-black text-slate-300 uppercase tracking-widest">ID: {p.id}</span>
                      </div>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                        onClick={() => removeFromCollection(p)}
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl opacity-20">
                       <FaLayerGroup size={24} className="mb-3" />
                       <span className="text-[0.55rem] font-black uppercase tracking-widest">No products</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCollection;
