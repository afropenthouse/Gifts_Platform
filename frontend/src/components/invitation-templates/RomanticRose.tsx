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

// ─── Improved Floral SVG ───
const FloralWreath = ({
    className = '',
    primaryColor = '#7A2E3B',
    accentColor = '#C9A84C',
}: {
    className?: string;
    primaryColor?: string;
    accentColor?: string;
}) => {
    const roseColor = primaryColor;
    const leafColor = '#5A7A6A';
    const goldColor = accentColor;

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
                {/* Gradients */}
                <radialGradient id="roseGrad1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={roseColor} stopOpacity="0.9" />
                    <stop offset="60%" stopColor={roseColor} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={roseColor} stopOpacity="0.2" />
                </radialGradient>
                <radialGradient id="roseGrad2" cx="40%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#D4A0A8" stopOpacity="0.8" />
                    <stop offset="50%" stopColor={roseColor} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={roseColor} stopOpacity="0.15" />
                </radialGradient>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={leafColor} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={leafColor} stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={goldColor} stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#E8D5A0" stopOpacity="0.7" />
                    <stop offset="100%" stopColor={goldColor} stopOpacity="0.5" />
                </linearGradient>

                {/* Rose template */}
                <g id="rose">
                    <circle cx="0" cy="0" r="28" fill="url(#roseGrad1)" />
                    <circle cx="-6" cy="-6" r="18" fill="url(#roseGrad2)" />
                    <circle cx="4" cy="-10" r="14" fill="url(#roseGrad1)" opacity="0.6" />
                    <circle cx="-2" cy="2" r="10" fill={roseColor} opacity="0.4" />
                    <path
                        d="M-8-8 C-14-4 -16 4 -8 12 C-2 16 4 12 8 8 C12 4 14-4 8-10 C4-14 0-12-8-8Z"
                        fill="none"
                        stroke={roseColor}
                        strokeWidth="0.8"
                        opacity="0.3"
                    />
                    <path
                        d="M-4-4 C-8-2 -10 2 -6 8 C-2 12 2 10 6 6 C10 2 10-2 6-6 C2-10-2-8-4-4Z"
                        fill="none"
                        stroke={roseColor}
                        strokeWidth="0.6"
                        opacity="0.25"
                    />
                </g>

                {/* Leaf template */}
                <g id="leaf">
                    <path
                        d="M0 0 C12 -6 24 -2 28 8 C24 18 12 22 0 16 Z"
                        fill="url(#leafGrad)"
                        stroke={leafColor}
                        strokeWidth="0.6"
                        opacity="0.6"
                    />
                    <path
                        d="M0 0 C8 0 16 4 22 8"
                        fill="none"
                        stroke={leafColor}
                        strokeWidth="0.5"
                        opacity="0.3"
                    />
                    <path d="M14 4 L18 2" fill="none" stroke={leafColor} strokeWidth="0.4" opacity="0.3" />
                    <path d="M12 8 L16 6" fill="none" stroke={leafColor} strokeWidth="0.4" opacity="0.3" />
                </g>

                {/* Small bud */}
                <g id="bud">
                    <circle cx="0" cy="0" r="10" fill="url(#roseGrad2)" opacity="0.7" />
                    <circle cx="-2" cy="-2" r="6" fill="url(#roseGrad1)" opacity="0.5" />
                    <path
                        d="M-6 2 C-10 6 -6 12 0 14 C6 12 10 6 6 2"
                        fill="none"
                        stroke={leafColor}
                        strokeWidth="0.5"
                        opacity="0.4"
                    />
                </g>

                {/* Gold accent dot */}
                <g id="goldDot">
                    <circle cx="0" cy="0" r="3" fill="url(#goldGrad)" opacity="0.6" />
                </g>
            </defs>

            {/* ─── WREATH ARRANGEMENT ─── */}
            {/* Top-left corner cluster */}
            <use href="#leaf" x="80" y="100" transform="rotate(-30 80 100) scale(1.2)" />
            <use href="#leaf" x="60" y="140" transform="rotate(-60 60 140) scale(1)" />
            <use href="#leaf" x="100" y="70" transform="rotate(10 100 70) scale(1.1)" />
            <use href="#rose" x="70" y="120" transform="scale(0.9)" />
            <use href="#bud" x="50" y="90" transform="rotate(-20 50 90)" />
            <use href="#goldDot" x="90" y="150" />
            <use href="#goldDot" x="120" y="100" />

            {/* Top-right corner cluster */}
            <use href="#leaf" x="520" y="100" transform="rotate(30 520 100) scale(1.2) scaleX(-1)" />
            <use href="#leaf" x="540" y="140" transform="rotate(60 540 140) scale(1) scaleX(-1)" />
            <use href="#leaf" x="500" y="70" transform="rotate(-10 500 70) scale(1.1) scaleX(-1)" />
            <use href="#rose" x="530" y="120" transform="scale(0.9)" />
            <use href="#bud" x="550" y="90" transform="rotate(20 550 90) scaleX(-1)" />
            <use href="#goldDot" x="510" y="150" />
            <use href="#goldDot" x="480" y="100" />

            {/* Bottom-left corner cluster */}
            <use href="#leaf" x="80" y="700" transform="rotate(30 80 700) scale(1.2)" />
            <use href="#leaf" x="60" y="660" transform="rotate(60 60 660) scale(1)" />
            <use href="#leaf" x="100" y="730" transform="rotate(-10 100 730) scale(1.1)" />
            <use href="#rose" x="70" y="680" transform="scale(0.9)" />
            <use href="#bud" x="50" y="710" transform="rotate(20 50 710)" />
            <use href="#goldDot" x="90" y="650" />
            <use href="#goldDot" x="120" y="700" />

            {/* Bottom-right corner cluster */}
            <use href="#leaf" x="520" y="700" transform="rotate(-30 520 700) scale(1.2) scaleX(-1)" />
            <use href="#leaf" x="540" y="660" transform="rotate(-60 540 660) scale(1) scaleX(-1)" />
            <use href="#leaf" x="500" y="730" transform="rotate(10 500 730) scale(1.1) scaleX(-1)" />
            <use href="#rose" x="530" y="680" transform="scale(0.9)" />
            <use href="#bud" x="550" y="710" transform="rotate(-20 550 710) scaleX(-1)" />
            <use href="#goldDot" x="510" y="650" />
            <use href="#goldDot" x="480" y="700" />

            {/* Top center garland */}
            <use href="#leaf" x="200" y="60" transform="rotate(-20 200 60) scale(0.9)" />
            <use href="#leaf" x="260" y="45" transform="rotate(10 260 45) scale(0.8)" />
            <use href="#leaf" x="330" y="40" transform="rotate(-5 330 40) scale(0.8)" />
            <use href="#leaf" x="400" y="45" transform="rotate(-15 400 45) scale(0.8)" />
            <use href="#leaf" x="460" y="60" transform="rotate(20 460 60) scale(0.9)" />
            <use href="#bud" x="230" y="50" transform="rotate(-15 230 50)" />
            <use href="#bud" x="370" y="42" transform="rotate(10 370 42)" />
            <use href="#goldDot" x="300" y="40" />
            <use href="#goldDot" x="420" y="40" />

            {/* Bottom center garland */}
            <use href="#leaf" x="200" y="740" transform="rotate(20 200 740) scale(0.9)" />
            <use href="#leaf" x="260" y="755" transform="rotate(-10 260 755) scale(0.8)" />
            <use href="#leaf" x="330" y="760" transform="rotate(5 330 760) scale(0.8)" />
            <use href="#leaf" x="400" y="755" transform="rotate(15 400 755) scale(0.8)" />
            <use href="#leaf" x="460" y="740" transform="rotate(-20 460 740) scale(0.9)" />
            <use href="#bud" x="230" y="750" transform="rotate(15 230 750)" />
            <use href="#bud" x="370" y="758" transform="rotate(-10 370 758)" />
            <use href="#goldDot" x="300" y="760" />
            <use href="#goldDot" x="420" y="760" />

            {/* Left side vines */}
            <use href="#leaf" x="40" y="250" transform="rotate(-10 40 250) scale(0.8)" />
            <use href="#leaf" x="35" y="320" transform="rotate(15 35 320) scale(0.7)" />
            <use href="#leaf" x="30" y="400" transform="rotate(-5 30 400) scale(0.8)" />
            <use href="#leaf" x="35" y="480" transform="rotate(10 35 480) scale(0.7)" />
            <use href="#bud" x="38" y="280" transform="rotate(-20 38 280)" />
            <use href="#bud" x="33" y="440" transform="rotate(15 33 440)" />
            <use href="#goldDot" x="30" y="360" />
            <use href="#goldDot" x="30" y="520" />

            {/* Right side vines */}
            <use href="#leaf" x="560" y="250" transform="rotate(10 560 250) scale(0.8) scaleX(-1)" />
            <use href="#leaf" x="565" y="320" transform="rotate(-15 565 320) scale(0.7) scaleX(-1)" />
            <use href="#leaf" x="570" y="400" transform="rotate(5 570 400) scale(0.8) scaleX(-1)" />
            <use href="#leaf" x="565" y="480" transform="rotate(-10 565 480) scale(0.7) scaleX(-1)" />
            <use href="#bud" x="562" y="280" transform="rotate(20 562 280) scaleX(-1)" />
            <use href="#bud" x="567" y="440" transform="rotate(-15 567 440) scaleX(-1)" />
            <use href="#goldDot" x="570" y="360" />
            <use href="#goldDot" x="570" y="520" />

            {/* Decorative border frame — elegant oval */}
            <ellipse
                cx="300"
                cy="400"
                rx="220"
                ry="300"
                fill="none"
                stroke={goldColor}
                strokeWidth="1.2"
                opacity="0.2"
                strokeDasharray="4 8"
            />
            <ellipse
                cx="300"
                cy="400"
                rx="210"
                ry="285"
                fill="none"
                stroke={goldColor}
                strokeWidth="0.8"
                opacity="0.15"
                strokeDasharray="2 12"
            />

            {/* Corner ornamental accents */}
            <g opacity="0.3">
                {[
                    [150, 130, 0],
                    [450, 130, 90],
                    [150, 670, -90],
                    [450, 670, 180],
                ].map(([cx, cy, rot]) => (
                    <g key={`orn-${cx}-${cy}`} transform={`translate(${cx} ${cy}) rotate(${rot})`}>
                        <path
                            d="M0-30 C10-20 20-10 20 0 C20 10 10 20 0 30 C-10 20-20 10-20 0 C-20-10-10-20 0-30Z"
                            fill="none"
                            stroke={goldColor}
                            strokeWidth="0.8"
                        />
                        <path
                            d="M0-20 C6-14 12-7 12 0 C12 7 6 14 0 20 C-6 14-12 7-12 0 C-12-7-6-14 0-20Z"
                            fill="none"
                            stroke={goldColor}
                            strokeWidth="0.6"
                            opacity="0.5"
                        />
                        <circle cx="0" cy="0" r="2" fill={goldColor} opacity="0.4" />
                    </g>
                ))}
            </g>

            {/* Small scattered petals */}
            <g opacity="0.15">
                {[
                    [170, 200, 30],
                    [430, 200, -20],
                    [170, 600, -30],
                    [430, 600, 20],
                    [250, 130, 15],
                    [350, 130, -15],
                    [250, 670, -10],
                    [350, 670, 10],
                ].map(([x, y, rot]) => (
                    <path
                        key={`petal-${x}-${y}`}
                        d={`M${x} ${y} C${x + 8} ${y - 12} ${x + 18} ${y - 6} ${x + 12} ${y + 4} C${x + 6} ${y + 12} ${x - 2} ${y + 8} ${x} ${y}Z`}
                        fill={roseColor}
                        transform={`rotate(${rot} ${x} ${y})`}
                    />
                ))}
            </g>
        </svg>
    );
};

// ─── Main Component ───
export const RomanticRose = ({
    coupleNames,
    date,
    venue,
    note,
    primaryColor = '#7A2E3B',
    accentColor = '#C9A84C',
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
            className={`relative ${cardScale} bg-[#FCF6F0] overflow-hidden shadow-2xl`}
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
            {/* Background texture overlay */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="texture" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#5A4A3A" />
                        <circle cx="20" cy="18" r="0.6" fill="#5A4A3A" />
                        <circle cx="35" cy="32" r="0.8" fill="#5A4A3A" />
                        <circle cx="10" cy="36" r="0.4" fill="#5A4A3A" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#texture)" />
                </svg>
            </div>

            {/* Floral Wreath */}
            <FloralWreath
                className="absolute inset-0 w-full h-full pointer-events-none"
                primaryColor={primaryColor}
                accentColor={accentColor}
            />

            {/* Inner decorative ring */}
            <div
                className="absolute"
                style={{
                    border: `1px solid ${accentColor}`,
                    inset: compact ? '6% 10% 6% 10%' : '7% 12% 7% 12%',
                    borderRadius: compact ? '48% / 42%' : '46% / 40%',
                    opacity: 0.2,
                    pointerEvents: 'none',
                }}
            />

            <div
                className="absolute"
                style={{
                    border: `1px solid ${accentColor}`,
                    inset: compact ? '8% 13% 8% 13%' : '9% 16% 9% 16%',
                    borderRadius: compact ? '44% / 38%' : '42% / 36%',
                    opacity: 0.1,
                    pointerEvents: 'none',
                }}
            />

            {/* ─── CONTENT ─── */}
            <div className="relative z-10 h-full min-h-[inherit] flex flex-col items-center justify-center text-center px-12 py-14">
                {/* Top ornament */}
                <div className="flex items-center gap-3 mb-6">
                    <span
                        className="h-px w-10"
                        style={{ backgroundColor: accentColor, opacity: 0.4 }}
                    />
                    <span
                        className="text-[8px] tracking-[0.6em] uppercase"
                        style={{ color: accentColor, opacity: 0.5 }}
                    >
                        ✦
                    </span>
                    <span
                        className="h-px w-10"
                        style={{ backgroundColor: accentColor, opacity: 0.4 }}
                    />
                </div>

                {/* "Together with their families" */}
                <p
                    className="text-[10px] tracking-[0.5em] uppercase mb-5"
                    style={{ color: primaryColor, opacity: 0.7, letterSpacing: '0.5em' }}
                >
                    Together with their families
                </p>

                {/* Names */}
                <h1
                    className={`${compact ? 'text-3xl' : 'text-6xl'} italic font-light leading-tight tracking-wide`}
                    style={{
                        color: primaryColor,
                        fontFamily: headingFont,
                        textShadow: `0 1px 2px rgba(122,46,59,0.08)`,
                    }}
                >
                    {names}
                </h1>

                {/* Divider */}
                <div className="flex items-center gap-5 my-6">
                    <span
                        className="h-px w-14"
                        style={{ backgroundColor: accentColor, opacity: 0.3 }}
                    />
                    <span
                        className="text-[10px] tracking-[0.4em] uppercase"
                        style={{ color: accentColor, opacity: 0.6 }}
                    >
                        &amp;
                    </span>
                    <span
                        className="h-px w-14"
                        style={{ backgroundColor: accentColor, opacity: 0.3 }}
                    />
                </div>

                {/* Date */}
                <p
                    className={`${compact ? 'text-[10px]' : 'text-[12px]'} tracking-[0.35em] uppercase`}
                    style={{ color: primaryColor, opacity: 0.75 }}
                >
                    {prettyDate}
                </p>

                {/* Venue */}
                <p
                    className={`${compact ? 'text-[10px]' : 'text-[11px]'} tracking-[0.3em] uppercase mt-3`}
                    style={{ color: primaryColor, opacity: 0.6 }}
                >
                    {place}
                </p>

                {/* Note */}
                <p
                    className={`${compact ? 'text-sm' : 'text-base'} italic leading-relaxed mt-8 max-w-[75%]`}
                    style={{ color: primaryColor, opacity: 0.7 }}
                >
                    {detailLine}
                </p>

                {/* Bottom ornament */}
                <div className="flex items-center gap-3 mt-8">
                    <span
                        className="h-px w-8"
                        style={{ backgroundColor: accentColor, opacity: 0.25 }}
                    />
                    <span
                        className="text-[7px] tracking-[0.5em] uppercase"
                        style={{ color: accentColor, opacity: 0.35 }}
                    >
                        ✦
                    </span>
                    <span
                        className="h-px w-8"
                        style={{ backgroundColor: accentColor, opacity: 0.25 }}
                    />
                </div>
            </div>
        </div>
    );
};

export default RomanticRose;