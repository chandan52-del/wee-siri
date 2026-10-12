import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { MessageCircle, X } from 'lucide-react';
import { getWhatsAppUrl, buildGeneralChatMessage } from '../../utils/whatsapp';

export const FloatingWhatsApp: React.FC = () => {
  const { settings } = useStore();
  const [showTooltip, setShowTooltip] = useState(true);

  if (!settings.whatsappNumber) return null;

  const chatUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    buildGeneralChatMessage(settings.storeName)
  );

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-end flex-col gap-2 pointer-events-none">
      {/* Tooltip */}
      {showTooltip && (
        <div className="pointer-events-auto bg-white border border-stone-200 shadow-lg rounded-xl p-3 max-w-xs flex items-start gap-2.5 text-left mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-stone-900">Need help or want to order?</p>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              Chat directly with our team on WhatsApp for instant assistance.
            </p>
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Floating Button */}
      <a
        href={chatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center justify-center w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
      </a>
    </div>
  );
};
