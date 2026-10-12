import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShoppingBag,
  ShieldCheck,
  MessageCircle,
  Truck,
  Heart,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { getWhatsAppUrl, buildGeneralChatMessage } from '../utils/whatsapp';

export const AboutPage: React.FC = () => {
  const { settings, navigateTo } = useStore();

  const chatUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    buildGeneralChatMessage(settings.storeName)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
          Our Brand Story
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          About {settings.storeName}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {settings.tagline ||
            'Bringing curated premium lifestyle goods directly to your doorstep with personal WhatsApp service and zero complications.'}
        </p>
      </div>

      {/* Main Narrative Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Why We Built a Direct-to-WhatsApp Store
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {settings.aboutText ||
                'Traditional e-commerce websites often force buyers through tedious accounts, forgotten passwords, clunky payment gateways, and detached bots when problems arise. We believe online shopping should feel as direct, friendly, and transparent as chatting with your favorite local boutique.'}
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              When you shop on {settings.storeName}, your request lands right in our hands. We verify the item's condition in our warehouse, provide photos if needed, confirm sizing, and process fast insured courier dispatch.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80"
              alt="Store operation and packaging"
              className="w-full h-72 sm:h-80 object-cover"
            />
          </div>
        </div>

        {/* 4 Pillars of Excellence */}
        <div className="pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Authentic Curation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every item is tested and inspected for craftsmanship and longevity before dispatch.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Real Human Support</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              No chatbots or automated runarounds. You converse directly with our store team.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Express Delivery</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fast, tracked courier shipping with real-time consignment updates via WhatsApp.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Fair Pricing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Zero marketplace commissions means lower prices passed straight to our customers.
            </p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6">
        <h3 className="text-2xl sm:text-3xl font-extrabold">Ready to Discover Our Products?</h3>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Explore our trending catalog or chat with us directly for any product recommendation.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigateTo('products')}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-colors shadow-lg"
          >
            Explore Catalog
          </button>
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-500" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
