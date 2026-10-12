import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SiriLogo } from '../common/SiriLogo';
import {
  Search,
  Menu,
  X,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  Tag,
  Info,
  PhoneCall,
  Home,
  Heart,
  User,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { getWhatsAppUrl, buildGeneralChatMessage } from '../../utils/whatsapp';

export const Navbar: React.FC = () => {
  const {
    settings,
    currentPage,
    navigateTo,
    filters,
    updateFilter,
    isAdmin,
    categories,
    wishlistCount,
    customerUser,
    isCustomerLoggedIn,
    logoutCustomer,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter({ search: searchInput });
    if (currentPage !== 'products') {
      navigateTo('products');
    }
  };

  const navLinks = [
    { label: 'Home', page: 'home' as const, icon: Home },
    { label: 'Collections', page: 'products' as const, icon: ShoppingBag },
    { label: 'Wishlist', page: 'wishlist' as const, icon: Heart, badge: wishlistCount },
    { label: 'Categories', page: 'categories' as const, icon: Tag },
    { label: 'About SIRI', page: 'about' as const, icon: Info },
    { label: 'Contact', page: 'contact' as const, icon: PhoneCall },
  ];

  const whatsAppGeneralUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    buildGeneralChatMessage(settings.storeName)
  );

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center group text-left focus:outline-none cursor-pointer"
            >
              <SiriLogo size="md" theme="dark" showSubtitle={true} />
            </button>
          </div>

          {/* Prominent Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-6 relative items-center"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search collections, apparel, accessories..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-stone-100 hover:bg-stone-100/80 focus:bg-white text-xs font-medium rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 focus:outline-none transition-all placeholder:text-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilter({ search: '' });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="ml-2 px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = currentPage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => navigateTo(link.page)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer ${
                    isActive
                      ? 'text-stone-950 bg-stone-200/60 font-black'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Actions: WhatsApp Direct + Wishlist + Customer Login + Admin shortcut */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Wishlist Icon Button */}
            <button
              onClick={() => navigateTo('wishlist')}
              className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
                currentPage === 'wishlist'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100 border border-transparent'
              }`}
              title={wishlistCount > 0 ? `My Wishlist (${wishlistCount})` : 'My Wishlist'}
              aria-label={`Wishlist with ${wishlistCount} saved items`}
            >
              <Heart
                className={`w-5 h-5 transition-transform duration-200 ${
                  wishlistCount > 0 ? 'fill-rose-500 text-rose-500 scale-105' : ''
                }`}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </button>

            {/* Customer Account / Google Login Button */}
            {isCustomerLoggedIn && customerUser ? (
              <div className="relative">
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 transition-all cursor-pointer shadow-xs"
                  title={`Account: ${customerUser.name} (${customerUser.email})`}
                >
                  {customerUser.avatarUrl ? (
                    <img
                      src={customerUser.avatarUrl}
                      alt={customerUser.name}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                      {customerUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline-block text-xs font-bold text-stone-800 max-w-[90px] truncate">
                    {customerUser.name.split(' ')[0]}
                  </span>
                </button>

                {/* Account dropdown */}
                {accountDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95"
                    onMouseLeave={() => setAccountDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900 truncate">{customerUser.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{customerUser.email}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Customer Account</span>
                      </div>
                    </div>
                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          navigateTo('account');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>My Account Details</span>
                      </button>
                      <button
                        onClick={() => {
                          navigateTo('wishlist');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          <span>My Wishlist</span>
                        </div>
                        {wishlistCount > 0 && (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                            {wishlistCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          logoutCustomer();
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  currentPage === 'login'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 hover:border-emerald-600'
                }`}
                title="Sign in with Google"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12c0 1.97.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <a
              href={whatsAppGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold tracking-wide uppercase shadow-sm transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-400 text-stone-950" />
              <span>WhatsApp Chat</span>
            </a>

            {/* Admin entry link */}
            <button
              onClick={() => navigateTo(isAdmin ? 'admin-dashboard' : 'admin-login')}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isAdmin
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-transparent'
              }`}
              title={isAdmin ? 'SIRI Admin Panel (Authenticated)' : 'Admin Sign In'}
            >
              <ShieldCheck className="w-5 h-5" />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search SIRI collections..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-stone-100 text-xs rounded-full border border-stone-200 focus:border-stone-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateFilter({ search: '' });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-stone-950 text-white text-xs font-bold rounded-full"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Slide Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-fade-in">
          {/* Customer Profile or Sign In Card in Mobile Menu */}
          <div className="mb-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            {isCustomerLoggedIn && customerUser ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    navigateTo('account');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
                >
                  {customerUser.avatarUrl ? (
                    <img
                      src={customerUser.avatarUrl}
                      alt={customerUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-600 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 text-sm">
                      {customerUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{customerUser.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">{customerUser.email}</p>
                    <span className="inline-block text-[10px] text-emerald-700 font-semibold">
                      Google Verified Account
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    logoutCustomer();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-white cursor-pointer shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigateTo('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-100 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12c0 1.97.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => {
                    navigateTo(link.page);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-stone-100 text-stone-950 font-black'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-stone-500" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Categories Bar in Mobile Menu */}
          {categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Browse Departments
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      navigateTo('products', { categorySlug: cat.id });
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile WhatsApp Action */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex flex-col gap-2">
            <a
              href={whatsAppGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-stone-950 text-white font-bold text-xs uppercase tracking-wide shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-400 text-stone-950" />
              <span>Contact SIRI on WhatsApp</span>
            </a>

            <button
              onClick={() => {
                navigateTo(isAdmin ? 'admin-dashboard' : 'admin-login');
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-stone-600" />
              <span>{isAdmin ? 'Store Owner Dashboard' : 'Administrator Sign In'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
