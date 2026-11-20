export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`spinner inline-block ${className}`} />;
}
