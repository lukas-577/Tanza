"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <main className="flex-1">
      <div className="sky h-40" aria-hidden />
      <div className="mx-auto -mt-10 w-full max-w-sm px-4">
        <span className="text-5xl" aria-hidden>🎧</span>
        <h1 className="mt-2 text-3xl">¿Olvidaste tu contraseña?</h1>
        <p className="mt-2 text-ink-soft">
          Escribe tu email y te enviamos un enlace para crear una nueva.
        </p>
        <form action={action} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-ink-soft">Email</span>
            <input name="email" type="email" required autoComplete="email"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2" />
          </label>
          {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
          {state?.ok && <p role="status" className="text-sm text-green-800">{state.ok}</p>}
          <button disabled={pending}
            className="w-full rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-60">
            {pending ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
        <p className="mt-6 text-sm">
          <Link href="/login" className="text-ink-soft hover:text-ink">Volver a entrar</Link>
        </p>
      </div>
    </main>
  );
}
