interface FlowerDecorProps {
  className?: string;
  style?: React.CSSProperties;
}

const Bloom = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <ellipse
        key={angle}
        cx="0"
        cy="-14"
        rx="7"
        ry="14"
        transform={`rotate(${angle})`}
        fill="currentColor"
        opacity="0.22"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.5"
      />
    ))}
    <circle cx="0" cy="0" r="7" fill="currentColor" opacity="0.5" />
    <circle cx="0" cy="0" r="3" fill="#fff" opacity="0.4" />
  </g>
);

export const FlowerDecor = ({ className, style }: FlowerDecorProps) => (
  <svg
    viewBox="0 0 320 160"
    fill="none"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Flowing vine */}
    <path
      d="M8 116 C 70 86, 104 138, 158 108 S 250 78, 312 112"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <path
      d="M8 116 C 70 146, 104 94, 158 124 S 250 154, 312 120"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.28"
    />

    {/* Leaves */}
    <path d="M70 100 C 52 86, 36 96, 34 118 C 56 122, 72 116, 70 100 Z" fill="currentColor" opacity="0.16" />
    <path d="M132 122 C 150 134, 168 126, 172 106 C 150 102, 132 108, 132 122 Z" fill="currentColor" opacity="0.16" />
    <path d="M214 96 C 232 82, 250 92, 252 114 C 230 118, 212 112, 214 96 Z" fill="currentColor" opacity="0.16" />
    <path d="M262 118 C 244 132, 228 124, 226 104 C 248 100, 264 108, 262 118 Z" fill="currentColor" opacity="0.16" />

    {/* Blooms spread across the width */}
    <Bloom x={44} y={92} s={1.05} />
    <Bloom x={104} y={118} s={0.85} />
    <Bloom x={160} y={96} s={1.2} />
    <Bloom x={222} y={90} s={0.95} />
    <Bloom x={282} y={112} s={1.05} />
  </svg>
);

export default FlowerDecor;
