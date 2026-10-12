import React from 'react';
import { useStore } from '../../context/StoreContext';
import { SiriLogo } from '../common/SiriLogo';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
} from 'lucide-react';
import { getWhatsAppUrl, buildGeneralChatMessage } from '../../utils/whatsapp';

export const Footer: React.FC = () => {
  const { settings, navigateTo, isAdmin, wishlistCount, isCustomerLoggedIn, customerUser } = useStore();

  const whatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    buildGeneralChatMessage(settings.storeName)
  );

  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-900 mt-20">
      {/* Genuine Service Highlights Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-stone-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <div className="w-12 h-12 rounded-xl bg-stone-800 text-stone-100 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 fill-emerald-500/30 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Direct WhatsApp Commerce</h4>
              <p className="text-xs text-stone-400 mt-0.5">Order with direct owner confirmation. Zero login or checkout hassle.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <div className="w-12 h-12 rounded-xl bg-stone-800 text-stone-100 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-stone-300" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Reliable Insured Dispatch</h4>
              <p className="text-xs text-stone-400 mt-0.5">Every order is carefully inspected, packed, and tracked directly.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-2xl bg-stone-900/60 border border-stone-800/80">
            <div className="w-12 h-12 rounded-xl bg-stone-800 text-stone-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-stone-300" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Authentic Curation</h4>
              <p className="text-xs text-stone-400 mt-0.5">Independently curated items adhering to strict quality standards.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & About Column */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => navigateTo('home')}
              className="text-left focus:outline-none cursor-pointer"
            >
              <SiriLogo size="md" theme="light" showSubtitle={true} />
            </button>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed pr-6 mt-3">
              {settings.tagline || settings.description}
            </p>

            <div className="pt-2">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-stone-200 text-stone-950 text-xs font-bold tracking-wide uppercase transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-3">
              {settings.socialLinks?.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors border border-stone-800"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors border border-stone-800"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.twitter && (
                <a
                  href={settings.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors border border-stone-800"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks?.youtube && (
                <a
                  href={settings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors border border-stone-800"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-4">
              Explore SIRI
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <button
                  onClick={() => navigateTo('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('products')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  All Collections
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('wishlist')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>My Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] rounded-full font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('categories')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Browse Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  About Our Brand
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Desk
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('login')}
                  className="hover:text-emerald-400 text-stone-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isCustomerLoggedIn && customerUser ? 'My Google Account' : 'Customer Sign In'}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded font-sans font-semibold">
                    Google
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Policies */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-4">
              Policies & Help
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <button
                  onClick={() => navigateTo('policy', { policyTab: 'shipping' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shipping & Delivery
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('policy', { policyTab: 'refund' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Return & Exchange
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('policy', { policyTab: 'privacy' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('policy', { policyTab: 'terms' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo(isAdmin ? 'admin-dashboard' : 'admin-login')}
                  className="text-stone-400 hover:text-amber-400 font-semibold transition-colors cursor-pointer"
                >
                  {isAdmin ? 'Admin Dashboard →' : 'Store Owner Login'}
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Contact Column */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-4">
              Direct Contact
            </h4>
            <ul className="space-y-3 text-xs text-stone-400">
              {settings.whatsappNumber && (
                <li className="flex items-start gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-stone-500 text-[11px]">WhatsApp Business</span>
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-emerald-400 font-medium font-mono"
                    >
                      +{settings.whatsappNumber}
                    </a>
                  </div>
                </li>
              )}

              {settings.phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-stone-500 text-[11px]">Direct Line</span>
                    <span className="text-white">{settings.phone}</span>
                  </div>
                </li>
              )}

              {settings.email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-stone-500 text-[11px]">Email</span>
                    <a href={`mailto:${settings.email}`} className="text-white hover:underline">
                      {settings.email}
                    </a>
                  </div>
                </li>
              )}

              {settings.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-stone-500 text-[11px]">Location</span>
                    <span className="text-stone-300 leading-relaxed">{settings.address}</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Copyright strip */}
        <div className="pt-12 mt-12 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-stone-300">SIRI</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Direct WhatsApp Shopping</span>
            <span>•</span>
            <button
              onClick={() => navigateTo('policy', { policyTab: 'privacy' })}
              className="hover:underline cursor-pointer"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              onClick={() => navigateTo('policy', { policyTab: 'terms' })}
              className="hover:underline cursor-pointer"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
