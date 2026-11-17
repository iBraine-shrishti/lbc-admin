import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaSave, FaImage, FaPlus, FaPenNib, FaGlobe, FaEye } from "react-icons/fa";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

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

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const token = localStorage.getItem("orm_admin_token");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_published: true,
    category: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog-categories/`)
      .then((res) => res.json())
      .then((data) => setCategories(data));

    if (isEdit) {
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog/${id}/`)
        .then((res) => res.json())
        .then((data) => {
          setFormData({
            title: data.title,
            content: data.content,
            is_published: data.is_published,
            category: data.category || "",
          });
          if (data.image)
            setPreview(cleanImageUrl(data.image));
        });
    }
  }, [id, isEdit]);

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog-categories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ name: newCatName }),
    });
    const newCat = await res.json();
    setCategories([...categories, newCat]);
    setFormData({ ...formData, category: newCat.id });
    setNewCatName("");
    setShowAddCat(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("content", formData.content);
    data.append("is_published", formData.is_published ? "True" : "False");
    if (formData.category) data.append("category", formData.category);
    if (imageFile) data.append("image", imageFile);

    const url = isEdit
      ? `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog/${id}/`
      : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog/`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      await fetch(url, {
        method,
        headers: {
          Authorization: `Token ${token}`,
        },
        body: data,
      });
      alert("Blog Post Saved Successfully");
      navigate("/react-admin/blog");
    } catch (err) {
      alert("Error Saving Blog Post");
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <div className="space-y-10 animate-fadeInUp pb-20">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white shadow-sm backdrop-blur-3xl border border-slate-200 p-8 rounded-[2rem] sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link
            to="/react-admin/blog"
            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 transition-all hover:text-slate-900 hover:border-slate-200 active:scale-90"
          >
            <FaArrowLeft />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
               <span className="text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">{isEdit ? "Edit Post" : "New Post"}</span>
            </div>
            <h2 className="text-[1.8rem] font-black text-slate-900 uppercase tracking-tighter leading-none">
              {isEdit ? "Update" : "Publish"} <span className="text-slate-900 font-heading">Post</span>
            </h2>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            className="px-8 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] border border-slate-200 text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
            onClick={() => navigate("/react-admin/blog")}
          >
            Discard
          </button>
          <button
            className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-10 py-4 rounded-xl font-black text-[0.65rem] uppercase tracking-[0.2em] transition-all flex items-center gap-3 hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            <span className="relative z-10 flex items-center gap-3">{loading ? "Saving..." : "Publish Post"} <FaSave /></span>
            <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
          </button>
        </div>
      </div>

      <form className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONTENT */}
        <div className="col-span-8 flex flex-col gap-8 max-lg:col-span-12">
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <FaPenNib className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Post Content</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Post Title</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter post title..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.55rem] font-black text-slate-700 uppercase tracking-[0.3em] ml-1">Content</label>
                <div className="rich-editor-dark">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    style={{ height: "400px", marginBottom: "60px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONFIG */}
        <div className="col-span-4 flex flex-col gap-8 max-lg:col-span-12">
          {/* VISUAL CACHE */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4 mb-2">
               <FaImage className="text-[#b89000]" />
               <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Featured Image</h3>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-white border border-slate-200 group">
              {preview ? (
                <img src={preview} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                   <FaGlobe size={32} className="mb-3 opacity-20" />
                   <span className="text-[0.5rem] font-black uppercase tracking-widest">No image attached</span>
                </div>
              )}
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  setImageFile(e.target.files[0]);
                  setPreview(URL.createObjectURL(e.target.files[0]));
                }}
              />
            </div>
          </div>

          {/* CLASSIFICATIONS */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Category</h3>
                <button
                  type="button"
                  className="w-6 h-6 bg-[#FECD08]/10 text-[#b89000] rounded-md flex items-center justify-center hover:bg-[#FECD08] hover:text-white transition-all"
                  onClick={() => setShowAddCat(!showAddCat)}
                >
                  <FaPlus size={10} />
                </button>
             </div>

             {showAddCat && (
                <div className="flex gap-2 animate-fadeInUp">
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-900 text-[0.7rem] font-bold outline-none focus:border-[#FECD08]"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name..."
                  />
                  <button type="button" onClick={handleAddCategory} className="bg-[#FECD08] text-[#212121] font-bold px-4 rounded-lg text-[0.6rem] font-black uppercase">Add</button>
                </div>
             )}

             <select
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-900 text-sm font-bold tracking-tight outline-none focus:border-[#FECD08] transition-all appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="" className="bg-white text-slate-900">Select Category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id} className="bg-white text-slate-900">{cat.name}</option>)}
             </select>
          </div>

          {/* VISIBILITY */}
          <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-8 rounded-[2rem] space-y-6">
            <h3 className="text-[0.8rem] font-black text-slate-900 uppercase tracking-[0.2em]">Visibility</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 group">
                <div className="flex flex-col">
                   <span className="text-[0.65rem] font-black text-slate-900 uppercase tracking-widest">Public</span>
                   <span className="text-[0.5rem] font-bold text-slate-500 uppercase tracking-[0.2em]">Visible to visitors</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/20 after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FECD08] peer-checked:after:bg-black"></div>
                </label>
              </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditBlog;
