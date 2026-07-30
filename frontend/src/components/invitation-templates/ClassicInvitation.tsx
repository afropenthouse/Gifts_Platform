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
  if (!value) return 'Saturday, October 30, 2030';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// Splits coupleNames into two parts (e.g., "Daniel & Claudia" -> ["DANIEL", "CLAUDIA"])
const splitNames = (names: string) => {
  const cleaned = names.replace(/&/g, 'and').replace(/\s+/g, ' ');
  const parts = cleaned.split(/\s+and\s+|\s*&\s*|\s*,\s*/);
  if (parts.length >= 2) return [parts[0].trim(), parts[1].trim()];
  if (parts.length === 1) return [parts[0], ''];
  return ['', ''];
};

export const ClassicInvitation = ({
  coupleNames,
  date,
  venue,
  note,
  primaryColor,
  accentColor,
  compact = false,
}: TemplateProps) => {
  const names = coupleNames || 'Groom & Bride';
  const detailLine = note?.trim() || 'Reception to Follow';
  const prettyDate = formatDisplayDate(date);
  const place = venue || 'Seattle, Washington';

  const [name1, name2] = splitNames(names);

  // Base font family
  const fontFamily = "'Cormorant Garamond', 'Georgia', serif";

  // Sizing adjustments for compact mode
  const pad = compact ? 'px-8 py-6' : 'px-14 py-12';
  const titleSize = compact ? 'text-[10px]' : 'text-[12px]';
  const subTitleSize = compact ? 'text-[10px]' : 'text-[12px]';
  const nameSize = compact ? 'text-2xl' : 'text-5xl';
  const dateSize = compact ? 'text-sm' : 'text-xl';
  const venueSize = compact ? 'text-xs' : 'text-base';
  const noteSize = compact ? 'text-xs' : 'text-base';

  return (
    <div
      className={`relative w-full ${compact ? 'h-full' : 'min-h-[640px]'} overflow-hidden shadow-2xl`}
      style={{
        backgroundColor: '#fdfaf5',
        fontFamily,
      }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 20%, ${accentColor}15 0%, transparent 60%),
            radial-gradient(ellipse at 70% 80%, ${accentColor}10 0%, transparent 60%)
          `,
        }}
      />

      {/* Outer border frame */}
      <div
        className="absolute inset-[4%] rounded-sm pointer-events-none"
        style={{
          border: `1px solid ${accentColor}25`,
          boxShadow: `inset 0 0 60px ${accentColor}08`,
        }}
      />

      {/* Inner border frame */}
      <div
        className="absolute inset-[7%] rounded-sm pointer-events-none"
        style={{
          border: `0.5px solid ${accentColor}12`,
        }}
      />

      {/* Corner ornaments */}
      <div
        className="absolute top-[5%] left-[5%] w-8 h-8 pointer-events-none"
        style={{
          borderTop: `1px solid ${accentColor}20`,
          borderLeft: `1px solid ${accentColor}20`,
        }}
      />
      <div
        className="absolute top-[5%] right-[5%] w-8 h-8 pointer-events-none"
        style={{
          borderTop: `1px solid ${accentColor}20`,
          borderRight: `1px solid ${accentColor}20`,
        }}
      />
      <div
        className="absolute bottom-[5%] left-[5%] w-8 h-8 pointer-events-none"
        style={{
          borderBottom: `1px solid ${accentColor}20`,
          borderLeft: `1px solid ${accentColor}20`,
        }}
      />
      <div
        className="absolute bottom-[5%] right-[5%] w-8 h-8 pointer-events-none"
        style={{
          borderBottom: `1px solid ${accentColor}20`,
          borderRight: `1px solid ${accentColor}20`,
        }}
      />

      {/* ── Content ── */}
      <div
        className={`relative z-10 h-full min-h-[inherit] flex flex-col items-center justify-center text-center ${pad}`}
      >
        {/* "Save The Date" */}
        <p
          className={`${titleSize} tracking-[0.4em] uppercase font-light mb-4`}
          style={{ color: primaryColor, opacity: 0.7 }}
        >
          Save The Date
        </p>

        {/* "For the Wedding Ceremony of" */}
        <div className="flex items-center gap-3 mb-3">
          <span className="h-px w-6" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
          <p
            className={`${subTitleSize} tracking-[0.3em] uppercase font-light`}
            style={{ color: primaryColor, opacity: 0.6 }}
          >
            For the Wedding Ceremony of
          </p>
          <span className="h-px w-6" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
        </div>

        {/* Names – each on its own line */}
        <h1
          className={`${nameSize} font-light uppercase tracking-widest leading-[1.2]`}
          style={{ color: primaryColor }}
        >
          {name1}
        </h1>
        {name2 && (
          <h1
            className={`${nameSize} font-light uppercase tracking-widest leading-[1.2] mt-[-2px]`}
            style={{ color: primaryColor }}
          >
            {name2}
          </h1>
        )}

        {/* Decorative divider */}
        <div className="my-5 flex items-center gap-4">
          <span
            className="h-px w-12"
            style={{ backgroundColor: accentColor, opacity: 0.3 }}
          />
          <span
            className="text-[8px]"
            style={{ color: accentColor, opacity: 0.4 }}
          >
            ✦
          </span>
          <span
            className="h-px w-12"
            style={{ backgroundColor: accentColor, opacity: 0.3 }}
          />
        </div>

        {/* Date */}
        <p
          className={`${dateSize} font-light tracking-wide`}
          style={{ color: primaryColor, opacity: 0.85 }}
        >
          {prettyDate}
        </p>

        {/* Venue (with optional time placeholder) */}
        <p
          className={`${venueSize} font-light tracking-[0.15em] mt-1`}
          style={{ color: primaryColor, opacity: 0.7 }}
        >
          {place}
        </p>

        {/* Note (e.g., "Reception to Follow") */}
        <p
          className={`${noteSize} font-light italic tracking-wide mt-5 max-w-[70%]`}
          style={{ color: primaryColor, opacity: 0.65 }}
        >
          {detailLine}
        </p>

        {/* Optional phone number – you could pass it in note or add a new prop */}
        {/* If you'd like a phone number, add it to note or extend interface */}
      </div>
    </div>
  );
};