"use client";

import Link, { useLinkStatus } from "next/link";

// Punto siempre presente (solo cambia la opacidad) para que la pastilla no cambie de tamaño.
function Hint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current ${
        pending ? "animate-pulse opacity-100" : "opacity-0"
      }`}
    />
  );
}

export function FilterLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={className}>
      {children}
      <Hint />
    </Link>
  );
}
