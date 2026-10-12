import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/product/ProductCard';
import {
  Heart,
  MessageCircle,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import { getWhatsAppUrl } from '../utils/whatsapp';

export const WishlistPage: React.FC = () => {
  const {
    products,
    settings,
    navigateTo,
    wishlistIds,
    clearWishlist,
    showToast,
  } = useStore();

  // Filter only published products that are in the user's wishlist
  const wishlistedProducts = products.filter(
    (p) => wishlistIds.includes(p.id) && p.status === 'published'
  );

  const totalValue = wishlistedProducts.reduce((sum, p) => sum + (p.price || 0), 0);

  // WhatsApp Consolidated Wishlist Order / Inquiry
  const handleOrderAllOnWhatsApp = () => {
    if (wishlistedProducts.length === 0) return;

    const itemsSummary = wishlistedProducts
      .map(
        (p, idx) =>
          `${idx + 1}. *${p.name}* - ${settings.currencySymbol || '₹'}${p.price.toLocaleString('en-IN')}\nLink: ${window.location.origin}/?page=product-detail&product=${p.id}`
      )
      .join('\n\n');

    const message = `Hello *${settings.storeName || 'SIRI'}*!\n\nI have saved these items in my *Wishlist* and would like to check availability & place an order:\n\n${itemsSummary}\n\n*Total Estimated Amount:* ${settings.currencySymbol || '₹'}${totalValue.toLocaleString('en-IN')}\n\nPlease let me know the availability and payment/delivery details. Thank you!`;

    const url = getWhatsAppUrl(settings.whatsappNumber, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClearWithConfirm = () => {
    if (window.confirm('Are you sure you want to remove all saved items from your wishlist?')) {
      clearWishlist();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Saved Favorites</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 tracking-tight">
            My Wishlist
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-xl">
            Items saved locally in your browser. Review your favorite pieces anytime or order directly on WhatsApp with zero checkout friction.
          </p>
        </div>

        {wishlistedProducts.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClearWithConfirm}
              className="px-3.5 py-2 rounded-lg border border-stone-300 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('products')}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-stone-200 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {wishlistedProducts.length === 0 ? (
        <div className="py-16 sm:py-20 text-center max-w-xl mx-auto px-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-5">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-stone-950">
            Your Wishlist is Empty
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed mt-2 mb-6 max-w-md mx-auto">
            You haven't added any products to your wishlist yet. Tap the heart icon on any product in our collections to save your favorites here.
          </p>

          <button
            type="button"
            onClick={() => navigateTo('products')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-stone-950 hover:bg-stone-850 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <span>Explore SIRI Collections</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Banner & Consolidated WhatsApp Order Bar */}
          <div className="bg-stone-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-800 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-1.5 text-xs font-semibold tracking-wider uppercase text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Wishlist Summary</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                {wishlistedProducts.length}{' '}
                {wishlistedProducts.length === 1 ? 'Product Saved' : 'Products Saved'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-400">
                Total Estimated Value:{' '}
                <span className="text-white font-bold text-base sm:text-lg">
                  {settings.currencySymbol || '₹'}
                  {totalValue.toLocaleString('en-IN')}
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={handleOrderAllOnWhatsApp}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-500 text-stone-950 shrink-0" />
                <span>Inquire All on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('products')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Add More Items</span>
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Info Note on localStorage */}
          <div className="rounded-2xl bg-stone-100 border border-stone-200/80 p-4 text-xs text-stone-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p>
              Your wishlist is stored safely in your device's browser memory (localStorage) and remains intact across page refreshes and visits. To order, click "Order" on any individual item or click "Inquire All on WhatsApp" above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
