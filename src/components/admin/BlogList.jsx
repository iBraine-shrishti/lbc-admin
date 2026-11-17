import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaPenNib,
  FaGlobe,
  FaFileAlt,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";

const BlogList = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog/`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this field report permanently?")) return;
    const token = localStorage.getItem("orm_admin_token");
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/blog/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    setPosts(posts.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-[#f59e0b] rounded-full animate-pulse ring-2 ring-[#f59e0b]/20 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-[#f59e0b] font-heading">Content Management</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Blog <span className="text-[#f59e0b] font-heading">Posts</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Managing Website Articles and Updates</p>
        </div>

        <Link to="/react-admin/blog/new" className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(251,176,59,0.3)] hover:-translate-y-1">
          <span className="relative z-10 flex items-center gap-2"><FaPlus size={10} /> Add Post</span>
          <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
        </Link>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-10 h-10 border-t-2 border-orm-gold rounded-full animate-spin mb-4"></div>
               <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading Posts...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Image</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Post Title</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Author</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Status</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Date</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = posts.slice(indexOfFirstItem, indexOfLastItem);
                  const totalPages = Math.ceil(posts.length / itemsPerPage);

                  return (
                    <>
                      {currentItems.length > 0 ? (
                        currentItems.map((post) => (
                          <tr key={post.id} className="group transition-all hover:bg-slate-100/50">
                            <td className="p-6">
                              <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white group-hover:border-[#FECD08]/30 transition-all duration-500">
                                {post.image ? (
                                  <img src={post.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300"><FaGlobe /></div>
                                )}
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="font-bold text-slate-900 text-[0.85rem] uppercase tracking-tight group-hover:text-[#b89000] transition-colors block truncate max-w-[300px]">{post.title}</span>
                              <span className="text-[0.5rem] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">ID: {post.id}</span>
                            </td>
                            <td className="p-6">
                              <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest">{post.author_name || "Admin"}</span>
                            </td>
                            <td className="p-6">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${post.is_published ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                                 <div className={`w-1 h-1 rounded-full ${post.is_published ? "bg-green-500 animate-pulse" : "bg-white/40"}`}></div>
                                 <span className="text-[0.55rem] font-black uppercase tracking-widest">{post.is_published ? "Published" : "Draft"}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="text-[0.65rem] font-bold text-slate-700 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex justify-end gap-2">
                                <Link
                                  to={`/react-admin/blog/edit/${post.id}`}
                                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-[#FECD08] hover:text-white active:scale-90"
                                >
                                  <FaEdit size={14} />
                                </Link>
                                <button
                                  className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 active:scale-90"
                                  onClick={() => handleDelete(post.id)}
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-20 text-center">
                             <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-300">No posts found</span>
                          </td>
                        </tr>
                      )}

                      {/* PAGINATION BLOCK */}
                      {posts.length > 0 && (
                        <tr>
                          <td colSpan="6" className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, posts.length)} of {posts.length} entries
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

export default BlogList;
