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

// ─── Watercolor Botanical SVG ───────────────────────────────────────────
const WatercolorBotanical = ({
  className = '',
  primaryColor = '#7B9E87',
  accentColor = '#E8B4B8',
}: {
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}) => {
  const sage = primaryColor;
  const blush = accentColor;

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
        {/* Watercolor wash gradients */}
        <radialGradient id="wash1" cx="20%" cy="20%" r="50%">
          <stop offset="0%" stopColor={sage} stopOpacity="0.3" />
          <stop offset="100%" stopColor={sage} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wash2" cx="80%" cy="80%" r="50%">
          <stop offset="0%" stopColor={blush} stopOpacity="0.3" />
          <stop offset="100%" stopColor={blush} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wash3" cx="60%" cy="40%" r="40%">
          <stop offset="0%" stopColor={sage} stopOpacity="0.15" />
          <stop offset="100%" stopColor={sage} stopOpacity="0" />
        </radialGradient>

        {/* Leaf gradient */}
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={sage} stopOpacity="0.8" />
          <stop offset="100%" stopColor={sage} stopOpacity="0.2" />
        </linearGradient>

        {/* Darker leaf accent */}
        <linearGradient id="leafDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A6B55" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4A6B55" stopOpacity="0.1" />
        </linearGradient>

        {/* Blush gradient for berries */}
        <radialGradient id="berryGrad" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor={blush} stopOpacity="0.9" />
          <stop offset="100%" stopColor={blush} stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="berryGrad2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4D4D8" stopOpacity="0.7" />
          <stop offset="100%" stopColor={blush} stopOpacity="0.1" />
        </radialGradient>

        {/* Soft blur for watercolor effect */}
        <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="medBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>

        {/* Reusable Eucalyptus Leaf */}
        <g id="leaf">
          <path
            d="M0 0 C12 -18 28 -20 36 0 C28 20 12 18 0 0 Z"
            fill="url(#leafGrad)"
            stroke={sage}
            strokeWidth="0.8"
            opacity="0.7"
          />
          <path d="M0 0 C8 -6 18 -8 24 0" fill="none" stroke={sage} strokeWidth="0.6" opacity="0.4" />
          <path d="M10 -4 L14 -6 M16 -2 L20 -4" fill="none" stroke={sage} strokeWidth="0.4" opacity="0.3" />
        </g>

        <g id="leafDark">
          <path
            d="M0 0 C10 -14 22 -15 28 0 C22 15 10 14 0 0 Z"
            fill="url(#leafDark)"
            stroke="#4A6B55"
            strokeWidth="0.6"
            opacity="0.5"
          />
          <path d="M0 0 C6 -4 14 -6 18 0" fill="none" stroke="#4A6B55" strokeWidth="0.4" opacity="0.3" />
        </g>

        {/* Reusable Berry Cluster */}
        <g id="berries">
          <circle cx="0" cy="0" r="6" fill="url(#berryGrad)" />
          <circle cx="8" cy="4" r="5" fill="url(#berryGrad2)" />
          <circle cx="-6" cy="6" r="4" fill="url(#berryGrad)" />
          <circle cx="2" cy="-6" r="4.5" fill="url(#berryGrad2)" />
        </g>
      </defs>

      {/* ─── BACKGROUND WATERCOLOR WASHES ────────────────────── */}
      <ellipse cx="120" cy="150" rx="200" ry="250" fill="url(#wash1)" filter="url(#softBlur)" />
      <ellipse cx="480" cy="650" rx="220" ry="260" fill="url(#wash2)" filter="url(#softBlur)" />
      <ellipse cx="350" cy="380" rx="300" ry="200" fill="url(#wash3)" filter="url(#softBlur)" />

      {/* ─── BOTANICAL CLUSTERS ──────────────────────────────── */}

      {/* Top-Left Cluster */}
      <g transform="translate(60, 80)">
        <use href="#leaf" x="10" y="20" transform="rotate(-30 10 20) scale(1.4)" />
        <use href="#leafDark" x="-10" y="40" transform="rotate(-50 -10 40) scale(1.2)" />
        <use href="#leaf" x="30" y="10" transform="rotate(10 30 10) scale(1.1)" />
        <use href="#berries" x="0" y="0" />
        <use href="#berries" x="20" y="35" transform="scale(0.8)" />
        <ellipse cx="15" cy="15" rx="40" ry="30" fill={sage} opacity="0.05" filter="url(#medBlur)" />
      </g>

      {/* Bottom-Right Cluster */}
      <g transform="translate(520, 700)">
        <use href="#leaf" x="-20" y="-20" transform="rotate(150 -20 -20) scale(1.6)" />
        <use href="#leafDark" x="0" y="-40" transform="rotate(130 0 -40) scale(1.3)" />
        <use href="#leaf" x="-40" y="0" transform="rotate(190 -40 0) scale(1.2)" />
        <use href="#leafDark" x="-30" y="-10" transform="rotate(120 -30 -10) scale(1)" />
        <use href="#berries" x="0" y="0" />
        <use href="#berries" x="-25" y="-30" transform="scale(0.9)" />
        <ellipse cx="-15" cy="-15" rx="50" ry="40" fill={blush} opacity="0.08" filter="url(#medBlur)" />
      </g>

      {/* Top-Right Sprig */}
      <g transform="translate(540, 100)">
        <use href="#leaf" x="0" y="0" transform="rotate(60 0 0) scale(1)" />
        <use href="#leafDark" x="10" y="10" transform="rotate(40 10 10) scale(0.8)" />
        <use href="#berries" x="15" y="-5" transform="scale(0.7)" />
      </g>

      {/* Bottom-Left Sprig */}
      <g transform="translate(80, 680)">
        <use href="#leaf" x="0" y="0" transform="rotate(-120 0 0) scale(1)" />
        <use href="#leafDark" x="-10" y="-10" transform="rotate(-100 -10 -10) scale(0.8)" />
        <use href="#berries" x="-15" y="5" transform="scale(0.7)" />
      </g>

      {/* ─── SCATTERED LEAVES / ACCENTS ──────────────────────── */}
      <g opacity="0.4">
        <use href="#leaf" x="180" y="120" transform="rotate(45 180 120) scale(0.6)" />
        <use href="#leaf" x="400" y="680" transform="rotate(-60 400 680) scale(0.7)" />
        <use href="#leafDark" x="140" y="600" transform="rotate(20 140 600) scale(0.5)" />
        <use href="#leafDark" x="460" y="180" transform="rotate(-30 460 180) scale(0.5)" />
      </g>

      {/* Tiny floating berries */}
      <g opacity="0.5">
        <circle cx="200" cy="680" r="3" fill="url(#berryGrad)" />
        <circle cx="420" cy="120" r="2.5" fill="url(#berryGrad2)" />
        <circle cx="120" cy="450" r="2" fill="url(#berryGrad)" />
        <circle cx="480" cy="500" r="3.5" fill="url(#berryGrad2)" />
      </g>
    </svg>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
export const LuxuryMinimal = ({
  coupleNames,
  date,
  venue,
  note,
  primaryColor = '#7B9E87',
  accentColor = '#E8B4B8',
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
      className={`relative ${cardScale} bg-[#FDFBF7] overflow-hidden shadow-2xl`}
      style={{ fontFamily: bodyFont }}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="paperTexture" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#2D4A3E" />
            <circle cx="20" cy="15" r="0.6" fill="#2D4A3E" />
            <circle cx="35" cy="30" r="0.8" fill="#2D4A3E" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#paperTexture)" />
        </svg>
      </div>

      <WatercolorBotanical
        className="absolute inset-0 w-full h-full pointer-events-none"
        primaryColor={primaryColor}
        accentColor={accentColor}
      />

      <div className="relative z-10 h-full min-h-[inherit] flex flex-col items-center justify-center text-center px-12 py-16">
        {/* Top ornament */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="h-px w-8"
            style={{ backgroundColor: primaryColor, opacity: 0.2 }}
          />
          <span
            className="text-[8px] tracking-[0.6em] uppercase"
            style={{ color: primaryColor, opacity: 0.4 }}
          >
            ✦
          </span>
          <span
            className="h-px w-8"
            style={{ backgroundColor: primaryColor, opacity: 0.2 }}
          />
        </div>

        {/* "Together with their families" */}
        <p
          className="text-[10px] tracking-[0.45em] uppercase mb-5"
          style={{ color: primaryColor, opacity: 0.6 }}
        >
          Together with their families
        </p>

        {/* Names */}
        <h1
          className={`${compact ? 'text-4xl' : 'text-7xl'} font-light italic leading-[1.1] tracking-wide`}
          style={{
            color: '#2D4A3E',
            fontFamily: displayFont,
          }}
        >
          {names}
        </h1>

        {/* Divider */}
        <div className="flex items-center gap-5 my-6">
          <span
            className="h-px w-14"
            style={{ backgroundColor: primaryColor, opacity: 0.25 }}
          />
          <span
            className="text-[10px] tracking-[0.4em] uppercase"
            style={{ color: primaryColor, opacity: 0.5 }}
          >
            &amp;
          </span>
          <span
            className="h-px w-14"
            style={{ backgroundColor: primaryColor, opacity: 0.25 }}
          />
        </div>

        {/* Date & Venue */}
        <div className="space-y-2">
          <p
            className={`${compact ? 'text-[10px]' : 'text-[12px]'} tracking-[0.35em] uppercase`}
            style={{ color: '#2D4A3E', opacity: 0.7 }}
          >
            {prettyDate}
          </p>
          <p
            className={`${compact ? 'text-[10px]' : 'text-[11px]'} tracking-[0.3em] uppercase`}
            style={{ color: primaryColor, opacity: 0.6 }}
          >
            {place}
          </p>
        </div>

        {/* Note */}
        <p
          className={`${compact ? 'text-sm' : 'text-base'} italic leading-relaxed mt-8 max-w-[75%]`}
          style={{ color: '#2D4A3E', opacity: 0.6 }}
        >
          {detailLine}
        </p>

        {/* Bottom ornament */}
        <div className="flex items-center gap-3 mt-8">
          <span
            className="h-px w-6"
            style={{ backgroundColor: primaryColor, opacity: 0.15 }}
          />
          <span
            className="text-[7px] tracking-[0.5em] uppercase"
            style={{ color: primaryColor, opacity: 0.3 }}
          >
            ✦
          </span>
          <span
            className="h-px w-6"
            style={{ backgroundColor: primaryColor, opacity: 0.15 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LuxuryMinimal;