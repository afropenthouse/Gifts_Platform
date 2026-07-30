import React from 'react';

interface TemplateProps {
  coupleNames: string;
  date?: string;
  venue?: string;
  note?: string;
  primaryColor?: string;
  accentColor?: string;
  compact?: boolean;
}

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Saturday, June 12, 2027';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// ─── Art Deco SVG Component ─────────────────────────────────────────────
const ArtDecoFrame = ({
  className = '',
  primaryColor = '#1A3B2B',
  accentColor = '#D49A6A',
}: {
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}) => {
  const gold = accentColor;
  const dark = primaryColor;

  return (
    <svg
      viewBox="0 0 600 800"
      width="100%"
      height="100%"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FDFBF7" stopOpacity="0.3" />
          <stop offset="100%" stopColor={gold} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="copperLight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gold} stopOpacity="0" />
          <stop offset="50%" stopColor={gold} stopOpacity="0.5" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ─── BACKGROUND RADIAL HARMONY ──────────────────────── */}
      <circle cx="300" cy="400" r="280" fill="none" stroke={gold} strokeWidth="1.2" opacity="0.08" />
      <circle cx="300" cy="400" r="220" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.12" />
      <circle cx="300" cy="400" r="160" fill="none" stroke={gold} strokeWidth="0.5" opacity="0.08" />

      {/* ─── OUTER GEOMETRIC FRAME ────────────────────────────── */}
      <g fill="none" stroke={gold} strokeWidth="1.5" opacity="0.4">
        <rect x="30" y="30" width="540" height="740" rx="4" />
        <rect x="45" y="45" width="510" height="710" rx="3" opacity="0.6" strokeWidth="0.8" />
        <rect x="60" y="60" width="480" height="680" rx="2" opacity="0.3" strokeWidth="0.5" />
      </g>

      {/* ─── STEPPED CORNER ACCENTS ──────────────────────────── */}
      <g fill="none" stroke="url(#copperGrad)" strokeWidth="2">
        {[
          [30, 30, 0],
          [570, 30, 90],
          [570, 770, 180],
          [30, 770, 270],
        ].map(([x, y, r]) => (
          <g key={`corner-${x}`} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M 0 0 L 40 0 L 60 20 L 60 60" />
            <path d="M 0 0 L 0 40 L 20 60 L 60 60" opacity="0.5" strokeWidth="1" />
            <circle cx="44" cy="44" r="4" fill={gold} opacity="0.6" />
          </g>
        ))}
      </g>

      {/* ─── CENTRAL ARCH ──────────────────────────────────────── */}
      <g fill="none" stroke="url(#copperGrad)" strokeWidth="1.8">
        <path d="M 160 120 L 440 120 C 440 300 300 460 300 460 C 300 460 160 300 160 120 Z" opacity="0.6" />
        <path d="M 180 140 L 420 140 C 420 280 300 420 300 420 C 300 420 180 280 180 140 Z" opacity="0.3" strokeWidth="1" />
      </g>

      {/* ─── SUNBURST AT TOP OF ARCH ──────────────────────────── */}
      <g transform="translate(300, 120)" stroke={gold} strokeWidth="0.8" opacity="0.4">
        <line x1="0" y1="0" x2="-60" y2="-60" />
        <line x1="0" y1="0" x2="-40" y2="-70" />
        <line x1="0" y1="0" x2="-20" y2="-75" />
        <line x1="0" y1="0" x2="0" y2="-80" />
        <line x1="0" y1="0" x2="20" y2="-75" />
        <line x1="0" y1="0" x2="40" y2="-70" />
        <line x1="0" y1="0" x2="60" y2="-60" />
        <path d="M -30 -15 A 30 30 0 0 1 30 -15" fill="none" strokeWidth="1.5" />
        <path d="M -50 -25 A 50 50 0 0 1 50 -25" fill="none" strokeWidth="1" opacity="0.6" />
        <circle cx="0" cy="-80" r="3" fill={gold} />
      </g>

      {/* ─── STYLIZED FERNS (LEFT & RIGHT) ────────────────────── */}
      <g stroke={gold} fill="none" opacity="0.5">
        {/* Left Fern */}
        <g transform="translate(100, 600)">
          <path d="M 0 0 Q 30 -100 20 -250" strokeWidth="1.5" />
          <path d="M 10 -50 Q 30 -60 45 -35" strokeWidth="1" />
          <path d="M 14 -90 Q 34 -100 49 -75" strokeWidth="1" />
          <path d="M 16 -130 Q 36 -140 51 -115" strokeWidth="1" />
          <path d="M 18 -170 Q 38 -180 53 -155" strokeWidth="1" />
          <path d="M 19 -210 Q 39 -220 54 -195" strokeWidth="1" />
          <path d="M 5 -40 Q -15 -50 -30 -25" strokeWidth="1" />
          <path d="M 9 -80 Q -11 -90 -26 -65" strokeWidth="1" />
          <path d="M 12 -120 Q -8 -130 -23 -105" strokeWidth="1" />
          <path d="M 14 -160 Q -6 -170 -21 -145" strokeWidth="1" />
          <path d="M 16 -200 Q -4 -210 -19 -185" strokeWidth="1" />
          <circle cx="18" cy="-250" r="3" fill={gold} />
        </g>

        {/* Right Fern (mirrored) */}
        <g transform="translate(500, 600) scale(-1, 1)">
          <path d="M 0 0 Q 30 -100 20 -250" strokeWidth="1.5" />
          <path d="M 10 -50 Q 30 -60 45 -35" strokeWidth="1" />
          <path d="M 14 -90 Q 34 -100 49 -75" strokeWidth="1" />
          <path d="M 16 -130 Q 36 -140 51 -115" strokeWidth="1" />
          <path d="M 18 -170 Q 38 -180 53 -155" strokeWidth="1" />
          <path d="M 19 -210 Q 39 -220 54 -195" strokeWidth="1" />
          <path d="M 5 -40 Q -15 -50 -30 -25" strokeWidth="1" />
          <path d="M 9 -80 Q -11 -90 -26 -65" strokeWidth="1" />
          <path d="M 12 -120 Q -8 -130 -23 -105" strokeWidth="1" />
          <path d="M 14 -160 Q -6 -170 -21 -145" strokeWidth="1" />
          <path d="M 16 -200 Q -4 -210 -19 -185" strokeWidth="1" />
          <circle cx="18" cy="-250" r="3" fill={gold} />
        </g>
      </g>

      {/* ─── LOWER DIAMOND FRAME ──────────────────────────────── */}
      <g fill="none" stroke="url(#copperGrad)" strokeWidth="1.2" opacity="0.5">
        <polygon points="300,460 400,560 300,660 200,560" />
        <polygon points="300,480 380,560 300,640 220,560" opacity="0.5" strokeWidth="0.8" />
        <line x1="200" y1="560" x2="400" y2="560" strokeWidth="1" opacity="0.4" />
      </g>

      {/* ─── DECORATIVE TOP & BOTTOM BORDERS ──────────────────── */}
      <g stroke="url(#copperLight)" strokeWidth="2" opacity="0.6">
        <line x1="120" y1="80" x2="480" y2="80" />
        <line x1="120" y1="85" x2="480" y2="85" strokeWidth="1" opacity="0.4" />
        <line x1="120" y1="720" x2="480" y2="720" />
        <line x1="120" y1="715" x2="480" y2="715" strokeWidth="1" opacity="0.4" />
      </g>

      {/* ─── SCATTERED GEOMETRIC DOTS ──────────────────────────── */}
      <g fill={gold} opacity="0.4">
        <circle cx="120" cy="80" r="2" />
        <circle cx="480" cy="80" r="2" />
        <circle cx="120" cy="720" r="2" />
        <circle cx="480" cy="720" r="2" />
        <circle cx="300" cy="460" r="3" />
        <circle cx="300" cy="660" r="3" />
        <circle cx="400" cy="560" r="2.5" />
        <circle cx="200" cy="560" r="2.5" />
      </g>
    </svg>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
export const ArtDecoGreenery = ({
  coupleNames,
  date,
  venue,
  note,
  primaryColor = '#1A3B2B',
  accentColor = '#D49A6A',
  compact = false,
}: TemplateProps) => {
  const names = coupleNames || 'James & Elizabeth';
  const detailLine = note?.trim() || 'Formal Invitation to Follow';
  const prettyDate = formatDisplayDate(date);
  const place = venue || 'The Bellwether Estate, Seattle';

  const cardScale = compact ? 'h-full' : 'min-h-[720px]';
  const displayFont = "'Cormorant Garamond', 'Georgia', serif";
  const bodyFont = "'Montserrat', 'Helvetica Neue', sans-serif";

  return (
    <div
      className={`relative ${cardScale} overflow-hidden shadow-2xl`}
      style={{
        backgroundColor: primaryColor,
        fontFamily: bodyFont,
      }}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="artDecoTexture" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.6" fill="#FFFFFF" />
            <circle cx="10" cy="10" r="0.4" fill="#FFFFFF" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#artDecoTexture)" />
        </svg>
      </div>

      <ArtDecoFrame
        className="absolute inset-0 w-full h-full pointer-events-none"
        primaryColor={primaryColor}
        accentColor={accentColor}
      />

      <div className="relative z-10 h-full min-h-[inherit] flex flex-col items-center justify-center text-center px-12 py-16">
        {/* Top ornament */}
        <div className="flex items-center gap-4 mb-6">
          <span className="h-px w-10" style={{ backgroundColor: accentColor, opacity: 0.25 }} />
          <span className="text-[8px] tracking-[0.6em] uppercase" style={{ color: accentColor, opacity: 0.5 }}>
            ✦
          </span>
          <span className="h-px w-10" style={{ backgroundColor: accentColor, opacity: 0.25 }} />
        </div>

        {/* "Together with their families" */}
        <p
          className="text-[10px] tracking-[0.5em] uppercase mb-5"
          style={{ color: '#FDFBF7', opacity: 0.6 }}
        >
          Together with their families
        </p>

        {/* Names */}
        <h1
          className={`${compact ? 'text-4xl' : 'text-7xl'} font-light italic leading-[1.1] tracking-wide`}
          style={{
            color: '#FDFBF7',
            fontFamily: displayFont,
          }}
        >
          {names}
        </h1>

        {/* Divider */}
        <div className="flex items-center gap-5 my-6">
          <span className="h-px w-14" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
          <span className="text-sm tracking-[0.4em] uppercase" style={{ color: accentColor, opacity: 0.7 }}>
            &amp;
          </span>
          <span className="h-px w-14" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
        </div>

        {/* Date & Venue */}
        <div className="space-y-2">
          <p
            className={`${compact ? 'text-[10px]' : 'text-[12px]'} tracking-[0.35em] uppercase`}
            style={{ color: '#FDFBF7', opacity: 0.8 }}
          >
            {prettyDate}
          </p>
          <p
            className={`${compact ? 'text-[10px]' : 'text-[11px]'} tracking-[0.3em] uppercase`}
            style={{ color: accentColor, opacity: 0.7 }}
          >
            {place}
          </p>
        </div>

        {/* Note */}
        <p
          className={`${compact ? 'text-sm' : 'text-base'} italic leading-relaxed mt-8 max-w-[75%]`}
          style={{ color: '#FDFBF7', opacity: 0.5 }}
        >
          {detailLine}
        </p>

        {/* Bottom ornament */}
        <div className="flex items-center gap-3 mt-8">
          <span className="h-px w-8" style={{ backgroundColor: accentColor, opacity: 0.15 }} />
          <span className="text-[7px] tracking-[0.5em] uppercase" style={{ color: accentColor, opacity: 0.35 }}>
            ✦
          </span>
          <span className="h-px w-8" style={{ backgroundColor: accentColor, opacity: 0.15 }} />
        </div>
      </div>
    </div>
  );
};

export default ArtDecoGreenery;