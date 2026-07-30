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

// ── Elegant Laurel Wreath SVG ──
const LaurelWreath = ({
    className = '',
    color = '#c9a96e',
}: {
    className?: string;
    color?: string;
}) => (
    <svg
        viewBox="0 0 200 120"
        width="100%"
        height="100%"
        className={className}
        aria-hidden="true"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* Left branch */}
        <g opacity="0.7">
            <path d="M95 60 C75 40, 45 30, 25 50" />
            <path d="M85 52 C70 32, 40 22, 20 42" />
            <path d="M75 44 C60 24, 30 14, 10 34" />
            {/* Leaves left */}
            <ellipse cx="30" cy="38" rx="6" ry="14" transform="rotate(-35 30 38)" />
            <ellipse cx="18" cy="30" rx="5" ry="12" transform="rotate(-20 18 30)" />
            <ellipse cx="45" cy="46" rx="5" ry="12" transform="rotate(-50 45 46)" />
            <ellipse cx="58" cy="54" rx="5" ry="12" transform="rotate(-60 58 54)" />
            <ellipse cx="70" cy="60" rx="5" ry="12" transform="rotate(-70 70 60)" />
        </g>
        {/* Right branch */}
        <g opacity="0.7">
            <path d="M105 60 C125 40, 155 30, 175 50" />
            <path d="M115 52 C130 32, 160 22, 180 42" />
            <path d="M125 44 C140 24, 170 14, 190 34" />
            {/* Leaves right */}
            <ellipse cx="170" cy="38" rx="6" ry="14" transform="rotate(35 170 38)" />
            <ellipse cx="182" cy="30" rx="5" ry="12" transform="rotate(20 182 30)" />
            <ellipse cx="155" cy="46" rx="5" ry="12" transform="rotate(50 155 46)" />
            <ellipse cx="142" cy="54" rx="5" ry="12" transform="rotate(60 142 54)" />
            <ellipse cx="130" cy="60" rx="5" ry="12" transform="rotate(70 130 60)" />
        </g>
        {/* Center diamond / ornament */}
        <path
            d="M100 68 L104 74 L100 80 L96 74 Z"
            fill={color}
            stroke="none"
            opacity="0.6"
        />
        {/* Small berries */}
        <circle cx="40" cy="52" r="2.5" fill={color} stroke="none" opacity="0.4" />
        <circle cx="160" cy="52" r="2.5" fill={color} stroke="none" opacity="0.4" />
        <circle cx="50" cy="60" r="2" fill={color} stroke="none" opacity="0.35" />
        <circle cx="150" cy="60" r="2" fill={color} stroke="none" opacity="0.35" />
    </svg>
);

// ── Subtle Corner Ornaments ──
const CornerOrnaments = ({
    className = '',
    color = '#c9a96e',
}: {
    className?: string;
    color?: string;
}) => (
    <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        className={className}
        aria-hidden="true"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <g opacity="0.4">
            {/* Top-left */}
            <path d="M20 10 C10 10, 10 20, 10 30" />
            <path d="M30 10 C20 10, 10 20, 10 30" />
            <path d="M20 20 C12 20, 12 28, 12 35" />
            <path d="M28 20 C20 20, 20 28, 20 35" />
            <circle cx="10" cy="38" r="2.5" fill={color} stroke="none" />
            <circle cx="18" cy="42" r="2" fill={color} stroke="none" opacity="0.6" />

            {/* Top-right */}
            <path d="M80 10 C90 10, 90 20, 90 30" />
            <path d="M70 10 C80 10, 90 20, 90 30" />
            <path d="M80 20 C88 20, 88 28, 88 35" />
            <path d="M72 20 C80 20, 80 28, 80 35" />
            <circle cx="90" cy="38" r="2.5" fill={color} stroke="none" />
            <circle cx="82" cy="42" r="2" fill={color} stroke="none" opacity="0.6" />

            {/* Bottom-left */}
            <path d="M20 90 C10 90, 10 80, 10 70" />
            <path d="M30 90 C20 90, 10 80, 10 70" />
            <path d="M20 80 C12 80, 12 72, 12 65" />
            <path d="M28 80 C20 80, 20 72, 20 65" />
            <circle cx="10" cy="62" r="2.5" fill={color} stroke="none" />
            <circle cx="18" cy="58" r="2" fill={color} stroke="none" opacity="0.6" />

            {/* Bottom-right */}
            <path d="M80 90 C90 90, 90 80, 90 70" />
            <path d="M70 90 C80 90, 90 80, 90 70" />
            <path d="M80 80 C88 80, 88 72, 88 65" />
            <path d="M72 80 C80 80, 80 72, 80 65" />
            <circle cx="90" cy="62" r="2.5" fill={color} stroke="none" />
            <circle cx="82" cy="58" r="2" fill={color} stroke="none" opacity="0.6" />
        </g>
    </svg>
);

// ── Main Component ──
export const WatercolorFloral = ({
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

    // Determine if we're in a compact layout
    const paddingX = compact ? 'px-10' : 'px-14';
    const paddingY = compact ? 'py-8' : 'py-12';
    const headingSize = compact ? 'text-3xl' : 'text-5xl';
    const subHeadingSize = compact ? 'text-lg' : 'text-2xl';
    const wreathScale = compact ? 'w-40' : 'w-56';
    const cornerScale = compact ? 'w-16' : 'w-24';

    // Text colors
    const textColor = primaryColor;
    const accent = accentColor;

    return (
        <div
            className={`relative w-full ${compact ? 'h-full' : 'min-h-[660px]'} overflow-hidden shadow-2xl`}
            style={{
                backgroundColor: '#fcf8f0',
                fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            }}
        >
            {/* ── Background Texture ── */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `
                            radial-gradient(ellipse at 20% 50%, ${accent}15 0%, transparent 70%),
                            radial-gradient(ellipse at 80% 50%, ${accent}10 0%, transparent 70%),
                            radial-gradient(ellipse at 50% 20%, ${accent}08 0%, transparent 50%)
                        `,
                }}
            />

            {/* ── Subtle Inner Glow ── */}
            <div
                className="absolute inset-[4%] rounded-[40%] pointer-events-none"
                style={{
                    boxShadow: `inset 0 0 120px ${accent}20, inset 0 0 60px ${accent}10`,
                    border: `1px solid ${accent}15`,
                }}
            />

            {/* ── Corner Ornaments ── */}
            <CornerOrnaments
                className={`absolute top-6 left-6 ${cornerScale}`}
                color={accent}
            />
            <CornerOrnaments
                className={`absolute top-6 right-6 ${cornerScale}`}
                color={accent}
            />
            <CornerOrnaments
                className={`absolute bottom-6 left-6 ${cornerScale}`}
                color={accent}
            />
            <CornerOrnaments
                className={`absolute bottom-6 right-6 ${cornerScale}`}
                color={accent}
            />

            {/* ── Content ── */}
            <div
                className={`relative z-10 h-full min-h-[inherit] flex flex-col items-center justify-center text-center ${paddingX} ${paddingY}`}
            >
                {/* Top ornament */}
                <div className="flex items-center gap-4 mb-6">
                    <span
                        className="h-px w-10"
                        style={{ backgroundColor: accent, opacity: 0.5 }}
                    />
                    <span
                        className="text-[10px] tracking-[0.35em] uppercase font-light"
                        style={{ color: textColor, opacity: 0.6 }}
                    >
                        Save the Date
                    </span>
                    <span
                        className="h-px w-10"
                        style={{ backgroundColor: accent, opacity: 0.5 }}
                    />
                </div>

                {/* ── Wreath ── */}
                <div className={`${wreathScale} -mt-2 mb-4`}>
                    <LaurelWreath color={accent} />
                </div>

                {/* ── Couple Names ── */}
                <h1
                    className={`${headingSize} font-light italic leading-[1.15] tracking-wide`}
                    style={{ color: textColor }}
                >
                    {names}
                </h1>

                {/* ── Divider ── */}
                <div className="flex items-center gap-4 my-5">
                    <span
                        className="h-px w-12"
                        style={{ backgroundColor: accent, opacity: 0.4 }}
                    />
                    <span
                        className="text-[10px]"
                        style={{ color: accent, opacity: 0.6 }}
                    >
                        ✦
                    </span>
                    <span
                        className="h-px w-12"
                        style={{ backgroundColor: accent, opacity: 0.4 }}
                    />
                </div>

                {/* ── Date ── */}
                <p
                    className={`${subHeadingSize} font-light tracking-wide`}
                    style={{ color: textColor, opacity: 0.85 }}
                >
                    {prettyDate}
                </p>

                {/* ── Venue ── */}
                <p
                    className="text-base font-light tracking-[0.15em] mt-3"
                    style={{ color: textColor, opacity: 0.65 }}
                >
                    {place}
                </p>

                {/* ── Note ── */}
                <p
                    className="mt-6 text-sm font-light italic tracking-wide max-w-[80%]"
                    style={{ color: textColor, opacity: 0.6 }}
                >
                    {detailLine}
                </p>

                {/* ── Footer ornament ── */}
                <div className="mt-8">
                    <span
                        className="text-[8px] tracking-[0.6em] uppercase font-light"
                        style={{ color: textColor, opacity: 0.3 }}
                    >
                        —
                    </span>
                </div>
            </div>

            {/* ── Decorative border ring ── */}
            <div
                className="absolute pointer-events-none"
                style={{
                    inset: compact ? '6%' : '5%',
                    border: `1px solid ${accent}12`,
                    borderRadius: compact ? '46% / 34%' : '48% / 36%',
                    boxShadow: `inset 0 0 80px ${accent}08`,
                }}
            />

            {/* ── Second border ring ── */}
            <div
                className="absolute pointer-events-none"
                style={{
                    inset: compact ? '9%' : '8%',
                    border: `0.5px solid ${accent}08`,
                    borderRadius: compact ? '44% / 32%' : '46% / 34%',
                }}
            />
        </div>
    );
};