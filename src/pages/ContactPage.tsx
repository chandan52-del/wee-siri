import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Sparkles,
  Instagram,
} from 'lucide-react';
import { getWhatsAppUrl } from '../utils/whatsapp';

export const ContactPage: React.FC = () => {
  const { settings, showToast } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [inquirySubject, setInquirySubject] = useState('Order Question');
  const [inquiryMessage, setInquiryMessage] = useState('');

  const handleSendViaWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) {
      showToast('Please type your question or inquiry message', 'error');
      return;
    }

    const compiledMessage = `Hello ${settings.storeName}!

Name: ${customerName || 'Customer'}
Phone: ${customerPhone || 'Not provided'}
Subject: ${inquirySubject}

Message:
${inquiryMessage}

Sent from website contact form.`;

    const url = getWhatsAppUrl(settings.whatsappNumber, compiledMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Opening WhatsApp with your inquiry...', 'success');
  };

  const generalWhatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.storeName}! I have a general customer inquiry.`
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
          We're Here For You
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Get in Touch
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Have questions about a product, delivery times, bulk orders, or existing consignments? Chat directly with our friendly team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Direct Contact Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Big WhatsApp Priority Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fastest Response (Avg. 2 Mins)</span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">Direct WhatsApp Support</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Connect with our dedicated support agents on WhatsApp for instantaneous assistance.
              </p>
            </div>

            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/30"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>Start WhatsApp Chat Now</span>
            </a>
          </div>

          {/* Contact Details List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Call Us Directly
                </span>
                <span className="text-base font-bold text-slate-900">
                  {settings.phone || '+91 73490 95032'}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">Mon - Sat: 9:00 AM - 8:00 PM IST</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Email Support
                </span>
                <a
                  href={`mailto:${settings.email || 'bmc419490@gmail.com'}`}
                  className="text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors"
                >
                  {settings.email || 'bmc419490@gmail.com'}
                </a>
                <p className="text-xs text-slate-500 mt-0.5">We respond within 24 business hours.</p>
              </div>
            </div>

            {settings.socialLinks?.instagram && (
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Instagram
                  </span>
                  <a
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-bold text-slate-900 hover:text-pink-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>@cc__.creations</span>
                    <span className="text-xs text-pink-600 font-normal">↗</span>
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Follow our updates, reels & stories</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Store & Dispatch Hub
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {settings.address || 'Bangalore, Karnataka, India'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Working Hours
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Monday to Sunday: 9:00 AM – 9:00 PM (IST)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">WhatsApp orders accepted 24/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Direct WhatsApp Composer Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">
              Send an Instant Inquiry
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Fill in your query below and click send. It will launch WhatsApp with your ready-to-send formatted message.
            </p>

            <form onSubmit={handleSendViaWhatsApp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Your Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subject / Topic
                </label>
                <select
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="Product Details & Sizing">Product Details & Sizing</option>
                  <option value="Order & Delivery Status">Order & Delivery Status</option>
                  <option value="Bulk Order or Wholesale Inquiry">Bulk Order or Wholesale Inquiry</option>
                  <option value="Return / Replacement Request">Return / Replacement Request</option>
                  <option value="Other Question">Other Question</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Message / Details
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Tell us what you'd like to ask or the item you are looking for..."
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md shadow-emerald-600/30 active:scale-99"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Inquiry to WhatsApp</span>
                </button>
              </div>
            </form>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-6">
            We value your privacy. Your phone number is strictly used for addressing your inquiry.
          </p>
        </div>
      </div>
    </div>
  );
};
