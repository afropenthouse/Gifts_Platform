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

// ─── Floral + Geometric SVG ──────────────────────────────────────────────
const FloralGeometricFrame = ({
  className = '',
  primaryColor = '#4A5D6B',
  accentColor = '#D4A373',
}: {
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}) => {
  const gold = accentColor;
  const navy = primaryColor;

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
        <radialGradient id="bloom1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.9" />
          <stop offset="60%" stopColor={gold} stopOpacity="0.4" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bloom2" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#F2D5B5" stopOpacity="0.8" />
          <stop offset="50%" stopColor={gold} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B8F71" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6B8F71" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="vineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A5D6B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4A5D6B" stopOpacity="0.05" />
        </linearGradient>

        {/* Rose bloom */}
        <g id="rose">
          <circle cx="0" cy="0" r="22" fill="url(#bloom1)" />
          <circle cx="-4" cy="-4" r="14" fill="url(#bloom2)" />
          <circle cx="3" cy="-7" r="10" fill="url(#bloom1)" opacity="0.6" />
          <circle cx="-1" cy="2" r="7" fill={gold} opacity="0.3" />
          <path
            d="M-6-6 C-10-2 -12 4 -6 10 C-2 14 4 10 6 6 C10 2 12-4 6-8 C2-12-2-10-6-6Z"
            fill="none"
            stroke={gold}
            strokeWidth="0.6"
            opacity="0.4"
          />
        </g>

        {/* Leaf */}
        <g id="leaf">
          <path
            d="M0 0 C10 -5 18 -1 22 6 C18 14 8 18 0 12 Z"
            fill="url(#leafGrad)"
            stroke="#6B8F71"
            strokeWidth="0.5"
            opacity="0.6"
          />
          <path d="M0 0 C6 0 12 3 16 6" fill="none" stroke="#6B8F71" strokeWidth="0.4" opacity="0.3" />
          <path d="M10 3 L14 2" fill="none" stroke="#6B8F71" strokeWidth="0.3" opacity="0.3" />
        </g>

        {/* Small bud */}
        <g id="bud">
          <circle cx="0" cy="0" r="8" fill="url(#bloom2)" opacity="0.7" />
          <circle cx="-2" cy="-2" r="5" fill="url(#bloom1)" opacity="0.5" />
          <path d="M-4 2 C-6 5 -4 9 0 10 C4 9 6 5 4 2" fill="none" stroke="#6B8F71" strokeWidth="0.4" opacity="0.4" />
        </g>

        {/* Gold dot */}
        <g id="dot">
          <circle cx="0" cy="0" r="2.5" fill={gold} opacity="0.5" />
        </g>
      </defs>

      {/* ─── GEOMETRIC FRAME ─────────────────────────────── */}
      <g fill="none" stroke={navy} strokeWidth="1.2" opacity="0.3">
        <rect x="50" y="60" width="500" height="680" rx="8" />
        <rect x="65" y="75" width="470" height="650" rx="6" opacity="0.5" />
        <rect x="80" y="90" width="440" height="620" rx="4" opacity="0.3" />
        <line x1="50" y1="60" x2="75" y2="60" strokeWidth="1.6" />
        <line x1="550" y1="60" x2="525" y2="60" strokeWidth="1.6" />
        <line x1="50" y1="740" x2="75" y2="740" strokeWidth="1.6" />
        <line x1="550" y1="740" x2="525" y2="740" strokeWidth="1.6" />
        <line x1="50" y1="60" x2="50" y2="85" strokeWidth="1.6" />
        <line x1="550" y1="60" x2="550" y2="85" strokeWidth="1.6" />
        <line x1="50" y1="740" x2="50" y2="715" strokeWidth="1.6" />
        <line x1="550" y1="740" x2="550" y2="715" strokeWidth="1.6" />
      </g>

      {/* ─── FLORAL ACCENTS ──────────────────────────────── */}

      {/* Corner clusters */}
      {[
        [80, 100, 0],
        [520, 100, 90],
        [80, 700, -90],
        [520, 700, 180],
      ].map(([x, y, rot], index) => (
        <g key={`corner-${index}`} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <use href="#leaf" x="10" y="-5" transform="scale(1.2)" />
          <use href="#leaf" x="-5" y="10" transform="rotate(40) scale(1)" />
          <use href="#rose" x="0" y="0" />
          <use href="#bud" x="15" y="8" transform="rotate(-20)" />
          <use href="#dot" x="-12" y="12" />
        </g>
      ))}

      {/* Top vine */}
      <g opacity="0.5">
        <path d="M120 55 C180 40 240 35 300 35 C360 35 420 40 480 55" fill="none" stroke="url(#vineGrad)" strokeWidth="2" />
        <use href="#leaf" x="150" y="45" transform="rotate(-15 150 45) scale(0.8)" />
        <use href="#leaf" x="220" y="38" transform="rotate(10 220 38) scale(0.7)" />
        <use href="#leaf" x="380" y="38" transform="rotate(-10 380 38) scale(0.7)" />
        <use href="#leaf" x="450" y="45" transform="rotate(15 450 45) scale(0.8)" />
        <use href="#bud" x="180" y="42" />
        <use href="#bud" x="420" y="42" />
        <use href="#dot" x="300" y="36" />
      </g>

      {/* Bottom vine */}
      <g opacity="0.5">
        <path d="M120 745 C180 760 240 765 300 765 C360 765 420 760 480 745" fill="none" stroke="url(#vineGrad)" strokeWidth="2" />
        <use href="#leaf" x="150" y="755" transform="rotate(15 150 755) scale(0.8)" />
        <use href="#leaf" x="220" y="762" transform="rotate(-10 220 762) scale(0.7)" />
        <use href="#leaf" x="380" y="762" transform="rotate(10 380 762) scale(0.7)" />
        <use href="#leaf" x="450" y="755" transform="rotate(-15 450 755) scale(0.8)" />
        <use href="#bud" x="180" y="758" />
        <use href="#bud" x="420" y="758" />
        <use href="#dot" x="300" y="764" />
      </g>

      {/* Side vines */}
      <g opacity="0.4">
        <path d="M45 200 C35 260 35 340 45 400 C55 460 55 540 45 600" fill="none" stroke="url(#vineGrad)" strokeWidth="1.5" />
        <use href="#leaf" x="40" y="250" transform="rotate(-20 40 250) scale(0.7)" />
        <use href="#leaf" x="40" y="350" transform="rotate(15 40 350) scale(0.7)" />
        <use href="#leaf" x="40" y="450" transform="rotate(-10 40 450) scale(0.7)" />
        <use href="#leaf" x="40" y="550" transform="rotate(20 40 550) scale(0.7)" />
        <use href="#bud" x="38" y="300" />
        <use href="#bud" x="38" y="500" />
        <use href="#dot" x="35" y="400" />
      </g>
      <g opacity="0.4">
        <path d="M555 200 C565 260 565 340 555 400 C545 460 545 540 555 600" fill="none" stroke="url(#vineGrad)" strokeWidth="1.5" />
        <use href="#leaf" x="560" y="250" transform="rotate(20 560 250) scale(0.7) scaleX(-1)" />
        <use href="#leaf" x="560" y="350" transform="rotate(-15 560 350) scale(0.7) scaleX(-1)" />
        <use href="#leaf" x="560" y="450" transform="rotate(10 560 450) scale(0.7) scaleX(-1)" />
        <use href="#leaf" x="560" y="550" transform="rotate(-20 560 550) scale(0.7) scaleX(-1)" />
        <use href="#bud" x="562" y="300" />
        <use href="#bud" x="562" y="500" />
        <use href="#dot" x="565" y="400" />
      </g>

      {/* Scattered petals (very light) */}
      <g opacity="0.1">
        {[
          [150, 200, 30],
          [450, 200, -30],
          [150, 600, -20],
          [450, 600, 20],
          [280, 140, 10],
          [320, 140, -10],
          [280, 660, -10],
          [320, 660, 10],
        ].map(([x, y, rot], index) => (
          <path
            key={`petal-${index}`}
            d={`M${x} ${y} C${x + 6} ${y - 10} ${x + 14} ${y - 5} ${x + 10} ${y + 3} C${x + 5} ${y + 10} ${x - 2} ${y + 6} ${x} ${y}Z`}
            fill={gold}
            transform={`rotate(${rot} ${x} ${y})`}
          />
        ))}
      </g>
    </svg>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────
export const ModernGeometric = ({
  coupleNames,
  date,
  venue,
  note,
  primaryColor = '#4A5D6B',
  accentColor = '#D4A373',
  compact = false,
}: TemplateProps) => {
  const names = coupleNames || 'James & Elizabeth';
  const detailLine = note?.trim() || 'Formal Invitation to Follow';
  const prettyDate = formatDisplayDate(date);
  const place = venue || 'The Bellwether Estate, Seattle';

  const cardScale = compact ? 'h-full' : 'min-h-[720px]';
  const headingFont = "'Cormorant Garamond', 'Georgia', serif";

  return (
    <div
      className={`relative ${cardScale} bg-[#F9F6F0] overflow-hidden shadow-2xl`}
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="texture2" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1" fill="#4A5D6B" />
            <circle cx="15" cy="12" r="0.7" fill="#4A5D6B" />
            <circle cx="25" cy="25" r="0.5" fill="#4A5D6B" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#texture2)" />
        </svg>
      </div>

      <FloralGeometricFrame
        className="absolute inset-0 w-full h-full pointer-events-none"
        primaryColor={primaryColor}
        accentColor={accentColor}
      />

      <div className="relative z-10 h-full min-h-[inherit] flex flex-col items-center justify-center text-center px-14 py-12">
        {/* Top ornament */}
        <div className="flex items-center gap-4 mb-6">
          <span className="h-px w-8" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
          <span className="text-[8px] tracking-[0.6em] uppercase" style={{ color: accentColor, opacity: 0.5 }}>
            ✦
          </span>
          <span className="h-px w-8" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
        </div>

        <p className="text-[10px] tracking-[0.5em] uppercase mb-5" style={{ color: primaryColor, opacity: 0.6 }}>
          You are invited
        </p>

        <h1
          className={`${compact ? 'text-3xl' : 'text-6xl'} font-light italic leading-tight tracking-wide`}
          style={{
            color: primaryColor,
            fontFamily: headingFont,
          }}
        >
          {names}
        </h1>

        <div className="flex items-center gap-5 my-6">
          <span className="h-px w-14" style={{ backgroundColor: accentColor, opacity: 0.25 }} />
          <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: accentColor, opacity: 0.5 }}>
            &amp;
          </span>
          <span className="h-px w-14" style={{ backgroundColor: accentColor, opacity: 0.25 }} />
        </div>

        <p
          className={`${compact ? 'text-[10px]' : 'text-[12px]'} tracking-[0.35em] uppercase`}
          style={{ color: primaryColor, opacity: 0.7 }}
        >
          {prettyDate}
        </p>

        <p
          className={`${compact ? 'text-[10px]' : 'text-[11px]'} tracking-[0.3em] uppercase mt-3`}
          style={{ color: primaryColor, opacity: 0.55 }}
        >
          {place}
        </p>

        <p
          className={`${compact ? 'text-sm' : 'text-base'} italic leading-relaxed mt-8 max-w-[75%]`}
          style={{ color: primaryColor, opacity: 0.65 }}
        >
          {detailLine}
        </p>

        <div className="flex items-center gap-3 mt-8">
          <span className="h-px w-6" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
          <span className="text-[7px] tracking-[0.5em] uppercase" style={{ color: accentColor, opacity: 0.3 }}>
            ✦
          </span>
          <span className="h-px w-6" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
        </div>
      </div>
    </div>
  );
};

export default ModernGeometric;