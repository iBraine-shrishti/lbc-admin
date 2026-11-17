import React from "react";

const categories = [
  "All",
  "Brand",
  "Mototech",
  "Accessories",
  "Riding Gears",
  "Touring & Luggage",
  "Fuel Tank",
];

const FilterSidebar = ({
  selectedCategory,
  setSelectedCategory,
  selectedSaleStatus,
  setSelectedSaleStatus,
  counts,
}) => {
  return (
    <div className="w-[280px] bg-white shadow-sm backdrop-blur-xl border border-slate-200 p-6 rounded-[2rem] shrink-0 h-fit sticky top-32 animate-fadeInUp">
      {/* CATEGORY FILTER */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-1.5 h-1.5 bg-[#FECD08] rounded-full shadow-[0_0_8px_#FECD08]"></div>
           <h3 className="text-[0.65rem] font-black text-slate-700 uppercase tracking-[0.3em]">Category Filter</h3>
        </div>
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`p-4 rounded-xl text-[0.75rem] font-bold tracking-tight cursor-pointer transition-all flex justify-between items-center group ${
                selectedCategory === cat 
                  ? "bg-[#FECD08] text-[#212121] font-bold shadow-lg shadow-orm-gold/10" 
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span className="truncate pr-2">{cat}</span>
              {cat !== "All" && counts[cat] !== undefined && (
                <span className={`text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-md ${selectedCategory === cat ? "bg-black/10 text-white" : "bg-slate-100 text-slate-500 group-hover:text-slate-700"}`}>
                  {counts[cat]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SALE STATUS FILTER */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-1.5 h-1.5 bg-[#FECD08] rounded-full shadow-[0_0_8px_#FECD08]"></div>
           <h3 className="text-[0.65rem] font-black text-slate-700 uppercase tracking-[0.3em]">Sale Status</h3>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { label: "All Status", value: "All", count: null },
            { label: "On Sale", value: "Yes", count: counts.saleYes },
            { label: "Regular Price", value: "No", count: counts.saleNo },
          ].map((status) => (
            <button
              key={status.value}
              className={`p-4 rounded-xl text-[0.75rem] font-bold tracking-tight transition-all flex justify-between items-center group ${
                selectedSaleStatus === status.value 
                  ? "bg-[#FECD08] text-[#212121] font-bold shadow-lg shadow-orm-gold/10" 
                  : "bg-slate-100/50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => setSelectedSaleStatus(status.value)}
            >
              <span>{status.label}</span>
              {status.count !== null && (
                 <span className={`text-[0.6rem] font-black px-2 py-0.5 rounded-md ${selectedSaleStatus === status.value ? "bg-black/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {status.count}
                 </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button className="w-full py-4 bg-slate-100 border border-slate-200 rounded-xl text-[0.6rem] font-black text-slate-500 uppercase tracking-[0.2em] transition-all hover:bg-slate-100 hover:text-slate-700">
        Reset Analytics View
      </button>
    </div>
  );
};

export default FilterSidebar;
