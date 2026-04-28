interface LogoProps {
  readonly size?: number
  readonly className?: string
}

/**
 * statem8 logo — two interlocking rounded rectangles in a magenta gradient,
 * representing linked agents / chained financial state.
 */
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(50 50) rotate(-18) translate(-50 -50)">
        {/* Back link — deeper magenta */}
        <rect
          x="14"
          y="34"
          width="44"
          height="56"
          rx="9"
          stroke="url(#logo-back)"
          strokeWidth="9"
        />
        {/* Front link — bright magenta */}
        <rect
          x="42"
          y="10"
          width="44"
          height="56"
          rx="9"
          stroke="url(#logo-front)"
          strokeWidth="9"
        />
      </g>
      <defs>
        <linearGradient id="logo-back" x1="14" y1="34" x2="58" y2="90">
          <stop offset="0%" stopColor="#a8165c" />
          <stop offset="100%" stopColor="#c81d76" />
        </linearGradient>
        <linearGradient id="logo-front" x1="42" y1="10" x2="86" y2="66">
          <stop offset="0%" stopColor="#ec2c8a" />
          <stop offset="100%" stopColor="#d61f7a" />
        </linearGradient>
      </defs>
    </svg>
  )
}
