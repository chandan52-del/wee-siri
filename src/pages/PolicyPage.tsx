import React from 'react';
import { useStore } from '../context/StoreContext';
import { PolicyTab } from '../types';
import { ShieldCheck, Truck, RotateCcw, FileText } from 'lucide-react';

export const PolicyPage: React.FC = () => {
  const { policyTab, navigateTo, settings } = useStore();

  const tabs: { id: PolicyTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'refund', label: 'Return & Refund Policy', icon: RotateCcw },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
          Transparency & Trust
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Customer Policies
        </h1>
        <p className="text-sm text-slate-500">
          Everything you need to know about our ordering process, shipping logistics, and satisfaction guarantees.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = policyTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateTo('policy', { policyTab: tab.id })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Policy Content Body */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* Shipping & Delivery */}
        {policyTab === 'shipping' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Truck className="w-6 h-6 text-emerald-600" />
              <span>Shipping & Delivery Policy</span>
            </h2>

            <p>
              At <strong>{settings.storeName}</strong>, we strive to deliver your orders promptly and safely. Once an order is confirmed via WhatsApp, our fulfillment team initiates the packaging and dispatch process within 24 hours.
            </p>

            <h3 className="text-lg font-bold text-slate-900">1. Dispatch Timeline</h3>
            <p>
              All confirmed orders are processed and handed over to our courier partners (Blue Dart, Delhivery, DTDC, or Speed Post) within <strong>24 to 48 business hours</strong>. You will receive a courier tracking number and parcel photo on WhatsApp as soon as the parcel is scanned by the carrier.
            </p>

            <h3 className="text-lg font-bold text-slate-900">2. Estimated Delivery Times</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><strong>Metro Cities:</strong> 2 to 4 business days.</li>
              <li><strong>Tier 2 & Tier 3 Cities:</strong> 3 to 6 business days.</li>
              <li><strong>Remote / Northeast / Island Regions:</strong> 5 to 8 business days.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900">3. Shipping Charges</h3>
            <p>
              We provide <strong>FREE standard express delivery</strong> on all orders valued above ₹999. For orders below ₹999, a nominal flat delivery fee of ₹49 to ₹99 applies, which is communicated transparently on WhatsApp before order confirmation.
            </p>

            <h3 className="text-lg font-bold text-slate-900">4. Order Verification & Tracking</h3>
            <p>
              Because orders are placed directly on WhatsApp, you have direct access to our logistics desk. Feel free to ping us anytime with your order details for live tracking status.
            </p>
          </div>
        )}

        {/* Return & Refund Policy */}
        {policyTab === 'refund' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <RotateCcw className="w-6 h-6 text-emerald-600" />
              <span>Return & Replacement Policy</span>
            </h2>

            <p>
              Your peace of mind is our highest priority. We want you to love everything you order from <strong>{settings.storeName}</strong>. If there is any defect or mismatch, we are here to make it right immediately.
            </p>

            <h3 className="text-lg font-bold text-slate-900">1. 7-Day Replacement Guarantee</h3>
            <p>
              We offer a straightforward <strong>7-Day Replacement Guarantee</strong> from the date of package delivery for items that arrive:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Physically damaged during transit.</li>
              <li>Defective or non-functional out of the box.</li>
              <li>Incorrect size, color, or item different from what was ordered on WhatsApp.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900">2. How to Request a Replacement</h3>
            <p>
              Simply open your existing WhatsApp conversation with us, take a short 10-second video or picture showing the issue or unboxing, and send it to our team. We will review and approve a free replacement shipment right away.
            </p>

            <h3 className="text-lg font-bold text-slate-900">3. Conditions for Return</h3>
            <p>
              Items must be in original condition with product tags, manuals, and accessories intact in original packaging. Items showing signs of customer misuse or wear are not eligible.
            </p>

            <h3 className="text-lg font-bold text-slate-900">4. Refunds</h3>
            <p>
              If a suitable replacement is unavailable in our inventory, a 100% refund will be issued via your preferred UPI or bank transfer method within 24 to 48 hours.
            </p>
          </div>
        )}

        {/* Privacy Policy */}
        {policyTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <span>Privacy Policy</span>
            </h2>

            <p>
              This Privacy Policy explains how <strong>{settings.storeName}</strong> collects, protects, and uses customer information when you browse our catalog and connect with us on WhatsApp.
            </p>

            <h3 className="text-lg font-bold text-slate-900">1. Information We Collect</h3>
            <p>
              We do not force you to create accounts, enter passwords, or store credit card credentials on our servers. When you reach out on WhatsApp to finalize an order, we only collect:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Your Name and Contact Phone Number.</li>
              <li>Your Shipping and Delivery Address.</li>
              <li>The Product items and variations you wish to purchase.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900">2. How We Use Your Data</h3>
            <p>
              Your contact and shipping details are used solely to package, dispatch, and deliver your parcel through authorized courier partners, and to provide tracking updates directly on WhatsApp.
            </p>

            <h3 className="text-lg font-bold text-slate-900">3. Zero Third-Party Selling</h3>
            <p>
              We respect your inbox and phone. We never sell, rent, or lease your personal information or phone number to third-party telemarketers or external advertising networks.
            </p>
          </div>
        )}

        {/* Terms & Conditions */}
        {policyTab === 'terms' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-emerald-600" />
              <span>Terms & Conditions</span>
            </h2>

            <p>
              By accessing and purchasing from <strong>{settings.storeName}</strong>, you agree to comply with the following general terms and operational conditions.
            </p>

            <h3 className="text-lg font-bold text-slate-900">1. Product Pricing & Accuracy</h3>
            <p>
              We endeavor to describe all items, pricing, specifications, and images with the utmost accuracy. In the rare event an item is mispriced due to typographical error, we reserve the right to clarify the correct price with you prior to order dispatch.
            </p>

            <h3 className="text-lg font-bold text-slate-900">2. Order Acceptance</h3>
            <p>
              An order is considered accepted once mutual confirmation is reached between the customer and our store representative on WhatsApp and shipping address verification is complete.
            </p>

            <h3 className="text-lg font-bold text-slate-900">3. Contact & Inquiries</h3>
            <p>
              For any clarification regarding these terms, reach out directly to our team via WhatsApp at <strong>+{settings.whatsappNumber}</strong> or via email at <strong>{settings.email}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
