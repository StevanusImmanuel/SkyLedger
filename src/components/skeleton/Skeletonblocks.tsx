// The single source of truth for the pulse animation
export function SkeletonBlock({ 
  className = '', 
  style 
}: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}