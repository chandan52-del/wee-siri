import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Filter, RotateCcw, Check, Sparkles, Tag, ArrowUpDown } from 'lucide-react';

interface ProductFilterProps {
  onCloseMobile?: () => void;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({ onCloseMobile }) => {
  const { categories, filters, updateFilter, resetFilters, settings } = useStore();

  const sortOptions = [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Popular & Top Rated', value: 'popular' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">Filters & Sorting</h3>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort By</span>
        </label>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter({ sort: e.target.value as any })}
          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" />
          <span>Category</span>
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilter({ categoryId: '' })}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
              !filters.categoryId
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>All Categories</span>
            {!filters.categoryId && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
          {categories.map((cat) => {
            const isSelected = filters.categoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => updateFilter({ categoryId: cat.id })}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Price Range ({settings.currencySymbol || '₹'})
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Min</span>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice ?? ''}
              onChange={(e) =>
                updateFilter({
                  minPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium">Max</span>
            <input
              type="number"
              placeholder="10000"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                updateFilter({
                  maxPrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Badges / Toggles */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Product Highlights</span>
        </label>

        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(filters.discountOnly)}
            onChange={(e) => updateFilter({ discountOnly: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <span>Discounted Offers Only</span>
        </label>

        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(filters.newArrivalsOnly)}
            onChange={(e) => updateFilter({ newArrivalsOnly: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <span>New Arrivals</span>
        </label>

        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(filters.inStockOnly)}
            onChange={(e) => updateFilter({ inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
          />
          <span>In-Stock Only</span>
        </label>
      </div>

      {onCloseMobile && (
        <button
          onClick={onCloseMobile}
          className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl md:hidden"
        >
          Apply Filters
        </button>
      )}
    </div>
  );
};
