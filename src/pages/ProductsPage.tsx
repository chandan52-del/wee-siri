import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/product/ProductCard';
import { ProductFilter } from '../components/product/ProductFilter';
import {
  SlidersHorizontal,
  Search,
  X,
  PackageOpen,
  ArrowUpDown,
  Tag,
  Sparkles,
  Heart,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const {
    products,
    categories,
    filters,
    updateFilter,
    resetFilters,
    settings,
    wishlistCount,
    navigateTo,
  } = useStore();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Apply filters
  const filteredProducts = products.filter((p) => {
    // Only published
    if (p.status !== 'published') return false;

    // Search query
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchCat = p.categoryName?.toLowerCase().includes(q);
      const matchSub = p.subcategory?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat && !matchSub) return false;
    }

    // Category
    if (filters.categoryId && p.categoryId !== filters.categoryId) {
      return false;
    }

    // Min Price
    if (filters.minPrice !== undefined && p.price < filters.minPrice) {
      return false;
    }

    // Max Price
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) {
      return false;
    }

    // Discounted
    if (filters.discountOnly) {
      const hasDiscount = p.originalPrice && p.originalPrice > p.price;
      if (!hasDiscount) return false;
    }

    // New Arrivals
    if (filters.newArrivalsOnly && !p.isNewArrival) {
      return false;
    }

    // In Stock
    if (filters.inStockOnly) {
      const inStock = p.stockStatus === 'in_stock' || (p.stockCount !== undefined && p.stockCount > 0);
      if (!inStock) return false;
    }

    return true;
  });

  // Apply Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sort === 'price_asc') return a.price - b.price;
    if (filters.sort === 'price_desc') return b.price - a.price;
    if (filters.sort === 'popular') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    // newest (default)
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const activeCategory = categories.find((c) => c.id === filters.categoryId);

  // Count active filters
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.categoryId ? 1 : 0) +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0) +
    (filters.discountOnly ? 1 : 0) +
    (filters.newArrivalsOnly ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Breadcrumb */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeCategory ? activeCategory.name : 'All Products'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeCategory?.description ||
                `Browse our complete collection of ${products.length} handpicked items.`}
            </p>
          </div>

          {/* Quick Sort Bar & Wishlist shortcut */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {wishlistCount > 0 && (
              <button
                type="button"
                onClick={() => navigateTo('wishlist')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="View your saved wishlist"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Wishlist ({wishlistCount})</span>
              </button>
            )}

            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>

            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.sort}
                onChange={(e) => updateFilter({ sort: e.target.value as any })}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Popularity & Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-400 font-medium">Active filters:</span>

            {filters.search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                Search: "{filters.search}"
                <button onClick={() => updateFilter({ search: '' })}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              </span>
            )}

            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                Category: {activeCategory.name}
                <button onClick={() => updateFilter({ categoryId: '' })}>
                  <X className="w-3.5 h-3.5 text-emerald-500 hover:text-emerald-700" />
                </button>
              </span>
            )}

            {filters.minPrice !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                Min: {settings.currencySymbol}
                {filters.minPrice}
                <button onClick={() => updateFilter({ minPrice: undefined })}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              </span>
            )}

            {filters.maxPrice !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                Max: {settings.currencySymbol}
                {filters.maxPrice}
                <button onClick={() => updateFilter({ maxPrice: undefined })}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              </span>
            )}

            {filters.discountOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold border border-rose-200">
                Discounted Only
                <button onClick={() => updateFilter({ discountOnly: false })}>
                  <X className="w-3.5 h-3.5 text-rose-500 hover:text-rose-700" />
                </button>
              </span>
            )}

            {filters.newArrivalsOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold border border-teal-200">
                New Arrivals
                <button onClick={() => updateFilter({ newArrivalsOnly: false })}>
                  <X className="w-3.5 h-3.5 text-teal-500 hover:text-teal-700" />
                </button>
              </span>
            )}

            {filters.inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                In Stock Only
                <button onClick={() => updateFilter({ inStockOnly: false })}>
                  <X className="w-3.5 h-3.5 text-blue-500 hover:text-blue-700" />
                </button>
              </span>
            )}

            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-1 hover:underline"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Layout: Sidebar Filter + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filter */}
        <div className="hidden md:block md:col-span-1">
          <div className="sticky top-28">
            <ProductFilter />
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          <div className="text-xs font-semibold text-slate-500 mb-4">
            Showing <strong className="text-slate-900">{sortedProducts.length}</strong> of{' '}
            {products.length} products
          </div>

          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Catalog is empty */
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto border border-stone-200">
                <PackageOpen className="w-8 h-8 stroke-[1.6]" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                  Catalog Updating
                </span>
                <h3 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">Products coming soon</h3>
                <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                  We are currently preparing our exclusive collection for SIRI. Stay tuned or reach out directly on WhatsApp for inquiries.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Hello SIRI! I would like to inquire about your incoming products.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-950 hover:bg-stone-850 text-white text-xs font-semibold uppercase tracking-wider shadow-xs transition-all"
                >
                  <span>Chat with SIRI on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            /* Filter produced 0 results */
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto border border-stone-200">
                <PackageOpen className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No matching products found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Try adjusting your search keywords, clearing price limits, or selecting a different category.
              </p>
              <div className="pt-2">
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full overflow-y-auto p-4 z-10">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="font-bold text-base text-slate-900">Filter Products</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProductFilter onCloseMobile={() => setMobileFilterOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
