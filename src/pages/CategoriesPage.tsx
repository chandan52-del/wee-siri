import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Tag } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { categories, products, navigateTo } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
          Curated Department Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Shop by Category
        </h1>
        <p className="text-sm text-slate-500">
          Browse through our extensive collections spanning lifestyle electronics, contemporary apparel, everyday essentials, and beauty care.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.categoryId === cat.id && p.status === 'published');
          const count = catProducts.length;

          return (
            <div
              key={cat.id}
              onClick={() => navigateTo('products', { categorySlug: cat.id })}
              className="group relative rounded-xl overflow-hidden bg-white border border-stone-200 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100">
                <img
                  src={
                    cat.image ||
                    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    {count} {count === 1 ? 'Product' : 'Products'} Available
                  </span>
                  <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {cat.description || 'Explore high quality items carefully selected for quality and value.'}
                </p>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                  <span>Browse Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
