import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Sparkles, MessageCircle, Phone } from 'lucide-react';
import { getWhatsAppUrl, buildGeneralChatMessage } from '../../utils/whatsapp';

export const AnnouncementBar: React.FC = () => {
  const { settings } = useStore();

  if (!settings.announcementText && !settings.whatsappNumber) return null;

  const chatUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    buildGeneralChatMessage(settings.storeName)
  );

  return (
    <aside aria-label="Store Announcement" className="bg-slate-900 text-slate-200 text-xs sm:text-sm py-2 px-4 border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 hidden sm:inline" />
          <span className="font-medium tracking-wide">
            {settings.announcementText || 'Welcome to our official online store! Direct WhatsApp support available.'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
          <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 text-[11px]"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span>Order via WhatsApp</span>
          </a>

          {settings.phone && (
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <Phone className="w-3 h-3 text-slate-500" />
              <span>{settings.phone}</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
