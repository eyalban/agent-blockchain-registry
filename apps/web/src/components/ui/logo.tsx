interface LogoProps {
  readonly size?: number
  readonly className?: string
}

/**
 * statem8 brand mark — two interlocking magenta squares.
 * Sourced from the original brand asset; transparent PNG at 512×512.
 */
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="statem8"
      width={size}
      height={size}
      className={className}
      decoding="async"
    />
  )
}
