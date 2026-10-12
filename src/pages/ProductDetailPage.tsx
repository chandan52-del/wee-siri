import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/product/ProductCard';
import {
  MessageCircle,
  HelpCircle,
  Share2,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  ChevronRight,
  Minus,
  Plus,
  ArrowLeft,
  Sparkles,
  Heart,
} from 'lucide-react';
import {
  getWhatsAppUrl,
  buildWhatsAppOrderMessage,
  buildWhatsAppInquiryMessage,
} from '../utils/whatsapp';

export const ProductDetailPage: React.FC = () => {
  const {
    products,
    currentProductId,
    settings,
    navigateTo,
    showToast,
    isInWishlist,
    toggleWishlist,
  } = useStore();

  const product = products.find((p) => p.id === currentProductId || p.slug === currentProductId);

  // Fallback to first product if none found
  const activeProduct = product || products[0];
  const inWishlist = activeProduct ? isInWishlist(activeProduct.id) : false;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(() => activeProduct?.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(() => activeProduct?.colors?.[0]?.name || '');
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'features'>('desc');

  const lastInitIdRef = React.useRef<string | undefined>(activeProduct?.id);

  const activeProductId = activeProduct?.id;

  // Initialize selected variations when product changes
  useEffect(() => {
    if (activeProduct && activeProduct.id !== lastInitIdRef.current) {
      lastInitIdRef.current = activeProduct.id;
      setSelectedImageIndex(0);
      setQuantity(1);
      setSelectedSize(activeProduct.sizes?.[0] || '');
      setSelectedColor(activeProduct.colors?.[0]?.name || '');
    }
  }, [activeProductId]);

  if (!activeProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product not found</h2>
        <button
          onClick={() => navigateTo('products')}
          className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Back to All Products
        </button>
      </div>
    );
  }

  const images = activeProduct.images && activeProduct.images.length > 0
    ? activeProduct.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

  const discountPercent =
    activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price
      ? Math.round(((activeProduct.originalPrice - activeProduct.price) / activeProduct.originalPrice) * 100)
      : null;

  const isOutOfStock =
    activeProduct.stockStatus === 'out_of_stock' ||
    (activeProduct.stockCount !== undefined && activeProduct.stockCount <= 0);

  // Build product URL
  const productUrl = `${window.location.origin}/?page=product-detail&product=${activeProduct.id}`;

  // WhatsApp URLs
  const orderMsg = buildWhatsAppOrderMessage(activeProduct, {
    quantity,
    selectedSize,
    selectedColor,
    productUrl,
    currencySymbol: settings.currencySymbol || '₹',
    greeting: settings.whatsappPrefillGreeting,
  });
  const orderWhatsAppUrl = getWhatsAppUrl(settings.whatsappNumber, orderMsg);

  const inquiryMsg = buildWhatsAppInquiryMessage(
    activeProduct,
    settings.currencySymbol || '₹',
    productUrl
  );
  const inquiryWhatsAppUrl = getWhatsAppUrl(settings.whatsappNumber, inquiryMsg);

  // Share Product Link
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeProduct.name,
          text: `Check out ${activeProduct.name} on ${settings.storeName}!`,
          url: productUrl,
        });
        showToast('Product link shared successfully', 'success');
        return;
      } catch (err) {
        // User cancelled or unsupported
      }
    }
    // Clipboard fallback
    navigator.clipboard.writeText(productUrl);
    showToast('Product link copied to clipboard!', 'success');
  };

  // Related products in same category
  const relatedProducts = products
    .filter((p) => p.categoryId === activeProduct.categoryId && p.id !== activeProduct.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => navigateTo('home')}
            className="hover:text-emerald-600 transition-colors"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => navigateTo('products', { categorySlug: activeProduct.categoryId })}
            className="hover:text-emerald-600 transition-colors"
          >
            {activeProduct.categoryName || 'Products'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {activeProduct.name}
          </span>
        </div>

        <button
          onClick={() => navigateTo('products')}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-xs">
        {/* Left Column: Image Gallery (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Large Image Container */}
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group">
            <img
              src={images[selectedImageIndex]}
              alt={activeProduct.name}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-103"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discountPercent && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-stone-900 text-white">
                  {discountPercent}% OFF
                </span>
              )}
              {activeProduct.isTrending && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-400 text-stone-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>Trending</span>
                </span>
              )}
            </div>

            {/* Wishlist Heart on Large Product Photo */}
            <button
              type="button"
              onClick={() => toggleWishlist(activeProduct.id)}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
              title={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
              className={`absolute top-4 right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${
                inWishlist
                  ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-400/60 scale-105 hover:bg-rose-100 hover:scale-110 shadow-rose-500/20'
                  : 'bg-white/90 text-stone-700 hover:text-rose-600 hover:bg-white hover:scale-110 backdrop-blur-xs'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-200 ${
                  inWishlist ? 'fill-rose-500 text-rose-500 scale-110' : ''
                }`}
              />
            </button>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-black tracking-wider uppercase shadow-xl">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Clickable Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-emerald-600 ring-2 ring-emerald-600/20 scale-102'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Information & Buying Actions (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category tag, Wishlist & Share buttons */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {activeProduct.categoryName || 'General'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleWishlist(activeProduct.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                    inWishlist
                      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-300'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:text-stone-900 shadow-2xs'
                  }`}
                  title={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform duration-200 ${
                      inWishlist ? 'fill-rose-500 text-rose-500 scale-110' : ''
                    }`}
                  />
                  <span>{inWishlist ? 'Wishlisted' : 'Save to Wishlist'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-colors shadow-2xs cursor-pointer"
                  title="Share this product"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-extrabold text-stone-950 leading-tight">
              {activeProduct.name}
            </h1>

            {/* Product Status & SKU */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOutOfStock ? 'bg-rose-500' : 'bg-emerald-600'
                  }`}
                />
                <span
                  className={`font-bold ${
                    isOutOfStock ? 'text-rose-600' : 'text-stone-800'
                  }`}
                >
                  {isOutOfStock ? 'Currently Out of Stock' : 'Available & Ready to Dispatch'}
                </span>
              </div>

              {activeProduct.sku && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-500 font-mono">
                    SKU: {activeProduct.sku}
                  </span>
                </>
              )}
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight">
                {settings.currencySymbol || '₹'}
                {activeProduct.price.toLocaleString('en-IN')}
              </span>

              {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                <>
                  <span className="text-base sm:text-lg text-stone-400 line-through font-semibold">
                    {settings.currencySymbol || '₹'}
                    {activeProduct.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-black text-white bg-stone-950 px-2.5 py-1 rounded-lg">
                    Save {settings.currencySymbol}
                    {(activeProduct.originalPrice - activeProduct.price).toLocaleString('en-IN')} (
                    {discountPercent}%)
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            {activeProduct.shortDescription && (
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {activeProduct.shortDescription}
              </p>
            )}

            {/* Size Variation Selector */}
            {activeProduct.sizes && activeProduct.sizes.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Size / Option: <span className="text-emerald-600">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {activeProduct.sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Variation Selector */}
            {activeProduct.colors && activeProduct.colors.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Color: <span className="text-emerald-600">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {activeProduct.colors.map((c, i) => {
                    const isSelected = selectedColor === c.name;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 text-slate-900 ring-2 ring-emerald-600/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0 inline-block"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="pt-2 flex items-center gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Quantity:
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: WhatsApp Ordering */}
          <div className="pt-6 border-t border-stone-100 space-y-3">
            {/* Primary Order on WhatsApp Button */}
            {isOutOfStock ? (
              <div className="w-full py-3.5 px-6 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200">
                <MessageCircle className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Currently Out of Stock</span>
              </div>
            ) : (
              <a
                href={orderWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xs hover:shadow bg-stone-950 hover:bg-stone-850 text-white cursor-pointer active:scale-99"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-400 text-stone-950 shrink-0" />
                <span>Order on WhatsApp (Instant Confirmation)</span>
              </a>
            )}

            {/* Secondary Inquire on WhatsApp Button */}
            <a
              href={inquiryWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-xl font-semibold text-xs uppercase tracking-wider text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-stone-700" />
              <span>Ask a Question on WhatsApp</span>
            </a>

            {/* Shopping Reassurances */}
            <div className="grid grid-cols-3 gap-2 pt-3 text-center text-[11px] text-slate-500 font-medium">
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                <Truck className="w-4 h-4 text-slate-600" />
                <span>Express Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>Verified Quality</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>7-Day Replacement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs (Description, Specifications, Features) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('desc')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'desc'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'specs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'features'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Key Features
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === 'desc' && (
            <div className="prose max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
              <p>{activeProduct.description || 'No detailed description available.'}</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              {activeProduct.specifications && Object.keys(activeProduct.specifications).length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {Object.entries(activeProduct.specifications).map(([key, val], idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                          <td className="px-6 py-3.5 font-bold text-slate-800 w-1/3 text-xs uppercase tracking-wider">
                            {key}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 font-medium">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Standard manufacturer specifications apply.</p>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div>
              {activeProduct.features && activeProduct.features.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeProduct.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60"
                    >
                      <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-800">{feat}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No specific features listed.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              You Might Also Like
            </h2>
            <button
              onClick={() => navigateTo('products', { categorySlug: activeProduct.categoryId })}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View More in Category →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
