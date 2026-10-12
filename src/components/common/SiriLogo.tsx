import React from 'react';

interface SiriLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showSubtitle?: boolean;
}

export const SiriLogo: React.FC<SiriLogoProps> = ({
  size = 'md',
  theme = 'dark',
  showSubtitle = true,
}) => {
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: {
      mark: 'text-lg sm:text-xl',
      sub: 'text-[9px]',
      badge: 'w-7 h-7 text-xs',
    },
    md: {
      mark: 'text-2xl sm:text-3xl',
      sub: 'text-[10px]',
      badge: 'w-9 h-9 text-sm',
    },
    lg: {
      mark: 'text-4xl sm:text-5xl',
      sub: 'text-xs',
      badge: 'w-14 h-14 text-xl',
    },
  }[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Geometric Monogram Badge */}
      <div
        className={`${sizeClasses.badge} rounded-xl font-serif font-black flex items-center justify-center shrink-0 tracking-normal transition-transform duration-300 group-hover:scale-105 shadow-xs ${
          isDark
            ? 'bg-stone-950 text-stone-50 border border-stone-800'
            : 'bg-white text-stone-950 border border-stone-200'
        }`}
      >
        <span>S</span>
      </div>

      {/* Main Wordmark */}
      <div className="flex flex-col">
        <span
          className={`font-serif font-black tracking-[0.3em] uppercase leading-none transition-colors ${
            sizeClasses.mark
          } ${isDark ? 'text-stone-950 group-hover:text-stone-700' : 'text-white'}`}
        >
          SIRI
        </span>
        {showSubtitle && (
          <span
            className={`font-sans font-semibold tracking-[0.25em] uppercase mt-1 ${
              sizeClasses.sub
            } ${isDark ? 'text-stone-500' : 'text-stone-400'}`}
          >
            Direct Store
          </span>
        )}
      </div>
    </div>
  );
};
