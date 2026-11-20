"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./Spinner";

// Botón de formulario con server action: se deshabilita y muestra un anillo mientras se envía.
// El texto sigue ocupando su sitio (solo se oculta) para que el botón no cambie de tamaño.
export function SubmitButton({
  children,
  className = "",
  disabled,
  pending: external,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Para formularios que gestionan su propio estado (useActionState). */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = external ?? status.pending;
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={`relative inline-flex items-center justify-center disabled:cursor-not-allowed ${
        pending ? "" : "disabled:opacity-40"
      } ${className}`}
    >
      <span className={pending ? "invisible" : undefined}>{children}</span>
      {pending && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
          <span className="sr-only">Procesando…</span>
        </span>
      )}
    </button>
  );
}
