import React from 'react';

interface TemplateProps {
  coupleNames: string;
  date?: string;
  venue?: string;
  note?: string;
  primaryColor: string;
  accentColor: string;
  compact?: boolean;
}

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Monday, March 22, 2027';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const GardenPattern = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 320 420" width="100%" height="100%" className={className} aria-hidden="true">
    <g fill="none" stroke="#6f9a75" strokeWidth="1.2" opacity="0.72">
      {Array.from({ length: 18 }).map((_, index) => {
        const x = 18 + (index % 6) * 54;
        const y = 24 + Math.floor(index / 6) * 118;
        return (
          <g key={index} transform={`translate(${x} ${y}) rotate(${index * 23})`}>
            <path d="M0 44 C20 22 34 10 48 0" />
            <ellipse cx="10" cy="34" rx="7" ry="18" transform="rotate(-38 10 34)" />
            <ellipse cx="28" cy="18" rx="6" ry="17" transform="rotate(36 28 18)" />
            <circle cx="44" cy="2" r="9" />
            <path d="M38 -4 C48 -14 62 -8 58 6 C49 4 43 2 38 -4 Z" />
          </g>
        );
      })}
    </g>
  </svg>
);

export const GardenOval = ({
  coupleNames,
  date,
  venue,
  note,
  primaryColor,
  accentColor,
  compact = false,
}: TemplateProps) => {
  const names = coupleNames || 'Groom & Bride';
  const detailLine = note?.trim() || 'Formal Invitation to Follow';
  const prettyDate = formatDisplayDate(date);
  const place = venue || 'Seattle, Washington';
  const cardScale = compact ? 'h-full' : 'min-h-[640px]';
  const headingFont = 'Cormorant Garamond, Georgia, serif';

  return (
    <div
      className={`relative ${cardScale} bg-[#fbfbf7] overflow-hidden shadow-2xl`}
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <GardenPattern className="absolute inset-0 w-full h-full" />
      <div
        className="absolute bg-[#fbfbf7] border-[3px]"
        style={{
          borderColor: primaryColor,
          inset: compact ? '6% 14% 6% 14%' : '7% 16% 7% 16%',
          borderRadius: compact ? '46% / 38%' : '48% / 40%',
        }}
      />
      <div className="relative z-10 h-full min-h-[inherit] flex flex-col items-center justify-center text-center px-12">
        <p className="text-[10px] tracking-[0.42em] uppercase mb-7" style={{ color: primaryColor }}>Save the Date</p>
        <h1
          className={`${compact ? 'text-2xl' : 'text-5xl'} italic font-light leading-tight`}
          style={{ color: accentColor, fontFamily: headingFont }}
        >
          {names}
        </h1>
        <div className="flex items-center gap-3 my-5">
          <span className="h-px w-10" style={{ backgroundColor: primaryColor }} />
          <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: primaryColor }}>and</p>
          <span className="h-px w-10" style={{ backgroundColor: primaryColor }} />
        </div>
        <p className="text-[11px] tracking-[0.24em] uppercase" style={{ color: primaryColor }}>{prettyDate}</p>
        <p className="text-[11px] tracking-[0.28em] uppercase mt-4" style={{ color: primaryColor }}>{place}</p>
        <p className="mt-7 italic text-base leading-6 max-w-[80%]" style={{ color: accentColor, fontFamily: headingFont }}>{detailLine}</p>
      </div>
    </div>
  );
};
