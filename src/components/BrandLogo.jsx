import React from 'react';

/**
 * TradeJournal PRO brand mark — "TJ" monogram on a green gradient tile
 * with an upward trend line. Scalable SVG (crisp at any size).
 * Fills its parent by default; pass `size` (number/px or string) to fix it.
 */
export default function BrandLogo({ size = '100%', title = 'TradeJournal PRO', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 84 84"
      fill="none"
      role="img"
      aria-label={title}
      style={{ display: 'block', ...(style || {}) }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tjBrandGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0B8A4B" />
          <stop offset="1" stopColor="#04130b" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="80" height="80" rx="20" fill="url(#tjBrandGrad)" />
      <text
        x="42"
        y="50"
        textAnchor="middle"
        fontFamily="Segoe UI, Inter, system-ui, sans-serif"
        fontSize="34"
        fontWeight="800"
        fill="#ffffff"
      >
        TJ
      </text>
      <polyline
        points="20,62 34,54 46,58 64,40"
        fill="none"
        stroke="#00E676"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="64" cy="40" r="3.5" fill="#00E676" />
    </svg>
  );
}
