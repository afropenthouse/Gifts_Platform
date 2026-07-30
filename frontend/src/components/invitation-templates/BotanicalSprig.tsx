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

const LeafSprig = ({ className = '', color = '#7b9a78' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 170 520" width="100%" height="100%" className={className} aria-hidden="true">
    <path d="M128 18 C74 112 156 212 88 314 C54 366 77 438 30 504" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
    {[60, 118, 185, 255, 328, 402, 462].map((y, index) => (
      <g key={y} transform={`translate(${index % 2 ? 80 : 112} ${y}) rotate(${index % 2 ? -34 : 28})`}>
        <ellipse cx="0" cy="0" rx="18" ry="44" fill={color} opacity={index % 3 === 0 ? 0.78 : 0.42} />
        <path d="M0 -36 L0 36" stroke="#ffffff" strokeWidth="1" opacity="0.55" />
      </g>
    ))}
    {[146, 288, 372, 438].map((y) => (
      <circle key={y} cx="70" cy={y} r="3" fill="#c69a52" opacity="0.75" />
    ))}
  </svg>
);

const OrnateFrame = ({ className = '', color = '#1a1a1a' }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 400 520" width="100%" height="100%" className={className} aria-hidden="true">
    <rect x="14" y="14" width="372" height="492" fill="none" stroke={color} strokeWidth="2.5" />
    <rect x="26" y="26" width="348" height="468" fill="none" stroke={color} strokeWidth="1" strokeDasharray="1.5 6" />
    <g fill="none" stroke={color} strokeWidth="2">
      {[[26, 26, 0], [374, 26, 90], [374, 494, 180], [26, 494, 270]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 0 C26 0 34 14 42 34" />
          <path d="M0 0 C0 26 14 34 34 42" />
          <path d="M12 14 C26 0 42 8 34 24 C26 40 6 30 12 14 Z" />
        </g>
      ))}
    </g>
  </svg>
);

export const BotanicalSprig = ({
  coupleNames,
  date,
  venue,
  note,
  primaryColor,
  accentColor,
  compact = false,
}: TemplateProps) => {
  const names = coupleNames || 'Groom & Bride';
  const occasionLine = 'For the marriage of';
  const detailLine = note?.trim() || 'Formal Invitation to Follow';
  const prettyDate = formatDisplayDate(date);
  const place = venue || 'Seattle, Washington';
  const cardScale = compact ? 'h-full' : 'min-h-[640px]';
  const headingFont = 'Cormorant Garamond, Georgia, serif';

  return (
    <div
      className={`relative ${cardScale} bg-white overflow-hidden shadow-2xl`}
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <LeafSprig className="absolute right-0 top-0 h-full w-2/5" color={accentColor} />
      <OrnateFrame className="absolute inset-0 w-full h-full" color={primaryColor} />
      <div className="relative z-10 h-full min-h-[inherit] flex flex-col justify-center px-14 pr-[40%]">
        <h1
          className={`${compact ? 'text-3xl' : 'text-6xl'} uppercase leading-[0.95] tracking-[0.16em]`}
          style={{ color: primaryColor }}
        >
          Save<br /><span className="italic normal-case tracking-normal text-[0.82em]">the</span> Date
        </h1>
        <div className="h-px w-16 mt-9 mb-7" style={{ backgroundColor: accentColor }} />
        <p className="text-[10px] tracking-[0.38em] uppercase" style={{ color: primaryColor }}>{occasionLine}</p>
        <p className="text-sm tracking-[0.42em] uppercase mt-3" style={{ color: primaryColor }}>{names}</p>
        <p className="text-[11px] tracking-[0.28em] uppercase mt-9 leading-6" style={{ color: primaryColor }}>{prettyDate}<br />{place}</p>
        <p className="mt-10 italic text-base leading-6" style={{ color: accentColor, fontFamily: headingFont }}>{detailLine}</p>
      </div>
    </div>
  );
};
