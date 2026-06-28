interface SpinnerProps {
  /** Tailwind size/position/color utilities, e.g. "h-5 w-5 text-primary". Defaults to h-5 w-5. */
  className?: string
}

/**
 * Reusable loading spinner — a smooth stroked arc with rounded ends.
 * Inherits color from `currentColor`, so set text-* on the className or a parent.
 */
export default function Spinner({ className = 'h-5 w-5' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Carregando"
    >
      <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
