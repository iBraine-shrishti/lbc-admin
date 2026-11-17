import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaPlus, FaTrash, FaEdit, FaTimes, FaQuestionCircle, FaCheck, FaExclamationCircle } from "react-icons/fa";

const FAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    product: ""
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const token = localStorage.getItem("orm_admin_token");

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch FAQs
      const faqsRes = await fetch(`${BASE_URL}/api/faqs/`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        }
      });
      if (faqsRes.ok) {
        const faqsData = await faqsRes.json();
        setFaqs(Array.isArray(faqsData) ? faqsData : []);
      }

      // Fetch Products (for FAQ linking dropdown)
      const productsRes = await fetch(`${BASE_URL}/api/products/`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        }
      });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      }

    } catch (err) {
      console.error("Error loading FAQs data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormData({ question: "", answer: "", product: "" });
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      product: faq.product || ""
    });
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  const handleDelete = async (faqId) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/faqs/${faqId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        }
      });
      if (res.ok) {
        alert("FAQ deleted successfully!");
        loadData();
      } else {
        alert("Failed to delete FAQ.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error deleting FAQ.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      setErrorMsg("Please fill out both the question and answer.");
      return;
    }
    setSubmitLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const url = editingFaq 
        ? `${BASE_URL}/api/faqs/${editingFaq.id}/`
        : `${BASE_URL}/api/faqs/`;
      const method = editingFaq ? "PATCH" : "POST";

      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        product: formData.product || null
      };

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(editingFaq ? "FAQ updated successfully!" : "FAQ created successfully!");
        setTimeout(() => {
          setIsModalOpen(false);
          loadData();
        }, 1000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save FAQ. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Network error saving FAQ.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-20 font-sans">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full animate-pulse ring-2 ring-slate-900/20"></div>
            <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-slate-900 font-heading">Product Help</span>
          </div>
          <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tighter leading-none">Frequently Asked <span className="text-slate-900 font-heading">Questions</span></h2>
          <p className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest mt-2">Managing {faqs.length} Collapsible Help Items</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="group relative overflow-hidden bg-[#FECD08] text-[#212121] font-bold px-8 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-[0.2em] transition-all flex items-center gap-2 hover:shadow-[0_10px_30px_rgba(228,44,67,0.2)] hover:-translate-y-1"
        >
          <span className="relative z-10 flex items-center gap-2"><FaPlus size={10} /> Create FAQ</span>
          <div className="absolute inset-0 bg-white translate-y-[100%] transition-transform duration-500 group-hover:translate-y-0"></div>
        </button>
      </div>

      {/* TABLE BOX */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-[2rem] overflow-hidden">
        {/* TAB BAR */}
        <div className="p-6 border-b border-slate-200 flex items-center bg-slate-50">
           <div className="flex gap-2">
              <span className="px-6 py-2 rounded-full text-[0.6rem] font-black uppercase tracking-widest bg-[#FECD08] text-[#212121] font-bold shadow-md shadow-[#FECD08]/20">Active Q&A List</span>
           </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center">
               <div className="w-8 h-8 border-t-2 border-[#FECD08] rounded-full animate-spin mb-4"></div>
               <span className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-slate-500">Loading FAQs...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th width="40%" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Question</th>
                  <th width="30%" className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Answer Preview</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500">Associated Product</th>
                  <th className="p-6 text-[0.55rem] font-black uppercase tracking-[0.4em] text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const indexOfLastItem = currentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentItems = faqs.slice(indexOfFirstItem, indexOfLastItem);
                  const totalPages = Math.ceil(faqs.length / itemsPerPage);

                  return (
                    <>
                      {currentItems.length > 0 ? (
                        currentItems.map((faq) => {
                          const matchedProduct = products.find(p => p.id === faq.product);
                          
                          return (
                            <tr key={faq.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-6 font-bold text-slate-900 leading-snug">
                                {faq.question}
                              </td>
                              <td className="p-6 text-slate-500 text-xs leading-relaxed max-w-[200px] truncate">
                                {faq.answer}
                              </td>
                              <td className="p-6">
                                {matchedProduct ? (
                                  <span className="bg-[#FECD08]/10 text-[#b89000] px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-wider">
                                    {matchedProduct.title}
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[0.6rem] font-black uppercase tracking-wider">
                                    Global / General
                                  </span>
                                )}
                              </td>
                              <td className="p-6">
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    onClick={() => handleOpenEditModal(faq)}
                                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center border border-slate-100"
                                    title="Edit FAQ"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(faq.id)}
                                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-all flex items-center justify-center border border-red-100/50"
                                    title="Delete FAQ"
                                  >
                                    <FaTrash size={10} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                            No FAQs found. Create your first FAQ above!
                          </td>
                        </tr>
                      )}

                      {/* PAGINATION BLOCK */}
                      {faqs.length > 0 && (
                        <tr>
                          <td colSpan="4" className="p-6 bg-slate-50 border-t border-slate-100">
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">
                                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, faqs.length)} of {faqs.length} entries
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
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                  >
                                    Previous
                                  </button>
                                  {[...Array(totalPages)].map((_, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => setCurrentPage(index + 1)}
                                      className={`w-8 h-8 rounded-xl text-[0.65rem] font-black uppercase transition-all ${
                                        currentPage === index + 1
                                          ? "bg-[#FECD08] text-[#212121] font-bold shadow-md shadow-[#FECD08]/20"
                                          : "border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {index + 1}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-[0.65rem] font-bold uppercase tracking-wider transition-all"
                                  >
                                    Next
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

      {/* CREATE / EDIT ACCORDION DRAWER MODAL */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[550px] h-[92vh] bg-white rounded-[2rem] shadow-2xl flex flex-col p-8 relative animate-slideLeft">
            
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
            >
              <FaTimes size={12} />
            </button>

            {/* Modal Header */}
            <div className="mb-8 pr-10">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingFaq ? "Edit FAQ Details" : "Create New FAQ"}
              </h3>
              <p className="text-[0.65rem] text-slate-400 uppercase tracking-wider font-bold mt-1">
                Add collapsible questions to help customers learn about your gear.
              </p>
            </div>

            {/* Alert Messages */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-6 flex items-center gap-3 text-emerald-600 animate-fadeIn">
                <FaCheck />
                <span className="text-xs font-bold uppercase tracking-wide">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-center gap-3 text-red-600 animate-fadeIn">
                <FaExclamationCircle />
                <span className="text-xs font-bold uppercase tracking-wide">{errorMsg}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <label className="block text-[0.55rem] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-2">Question (Help Query) *</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the question (e.g. Will this fit...)"
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#FECD08]/50 text-xs font-bold uppercase tracking-wider placeholder:text-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[0.55rem] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-2">Answer (Detailed Explanation) *</label>
                  <textarea
                    rows="6"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Share detailed instruction or assistance info here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-900 outline-none focus:border-[#FECD08]/50 text-xs font-bold uppercase tracking-wider leading-relaxed placeholder:text-slate-300 resize-none"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[0.55rem] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 ml-2">Associated Product (Optional)</label>
                  <select
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#FECD08]/50 text-xs font-bold uppercase tracking-wider"
                  >
                    <option value="">Global / General (Shows everywhere)</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-6 border-t border-slate-100 flex gap-4 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 h-12 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-[2] bg-[#FECD08] text-[#212121] font-bold h-12 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? "Saving..." : editingFaq ? "Update FAQ" : "Create FAQ"}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default FAQs;
