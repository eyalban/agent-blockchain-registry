interface LogoProps {
  readonly size?: number
  readonly className?: string
}

/**
 * Agent Registry logo — a stylized node/agent icon with connection lines,
 * representing a blockchain-registered AI agent in a network.
 */
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background hex shape */}
      <path
        d="M20 2L36.66 11.5V30.5L20 40L3.34 30.5V11.5L20 2Z"
        fill="url(#logo-bg)"
        stroke="url(#logo-stroke)"
        strokeWidth="1.5"
      />

      {/* Inner circuit pattern */}
      {/* Center node (the agent) */}
      <circle cx="20" cy="20" r="4.5" fill="url(#logo-center)" />
      <circle cx="20" cy="20" r="6.5" stroke="#00e5ff" strokeWidth="0.8" opacity="0.4" />

      {/* Connection lines radiating outward */}
      <line x1="20" y1="13.5" x2="20" y2="8" stroke="#00e5ff" strokeWidth="1" opacity="0.6" />
      <line x1="25.6" y1="23.2" x2="30" y2="27" stroke="#00e5ff" strokeWidth="1" opacity="0.6" />
      <line x1="14.4" y1="23.2" x2="10" y2="27" stroke="#00e5ff" strokeWidth="1" opacity="0.6" />

      {/* Outer nodes (other agents in the network) */}
      <circle cx="20" cy="7" r="2" fill="#00e5ff" opacity="0.8" />
      <circle cx="31" cy="28" r="2" fill="#a78bfa" opacity="0.8" />
      <circle cx="9" cy="28" r="2" fill="#a78bfa" opacity="0.8" />

      {/* Small accent dots */}
      <circle cx="28" cy="14" r="1" fill="#00e5ff" opacity="0.3" />
      <circle cx="12" cy="14" r="1" fill="#00e5ff" opacity="0.3" />
      <circle cx="20" cy="33" r="1" fill="#a78bfa" opacity="0.3" />

      {/* Gradients */}
      <defs>
        <linearGradient id="logo-bg" x1="3" y1="2" x2="37" y2="40">
          <stop offset="0%" stopColor="#0f1520" />
          <stop offset="100%" stopColor="#0a0e17" />
        </linearGradient>
        <linearGradient id="logo-stroke" x1="3" y1="2" x2="37" y2="40">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="logo-center" cx="20" cy="20" r="4.5">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#00b8d4" />
        </radialGradient>
      </defs>
    </svg>
  )
}
