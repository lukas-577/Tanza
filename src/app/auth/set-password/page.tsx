"use client";

import { useActionState } from "react";
import { setPassword } from "./actions";

const field = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";

export default function SetPasswordPage() {
  const [state, action, pending] = useActionState(setPassword, undefined);
  return (
    <main className="flex-1">
      <div className="sky h-40" aria-hidden />
      <div className="mx-auto -mt-10 w-full max-w-sm px-4">
        <span className="text-5xl" aria-hidden>🎧</span>
        <h1 className="mt-2 text-3xl">Crea tu contraseña</h1>
        <p className="mt-2 text-ink-soft">Con ella entrarás a The Tanza Teaching Experience.</p>
        <form action={action} className="mt-8 space-y-4">
          <label className="block text-sm text-ink-soft">Contraseña (mínimo 8 caracteres)
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
          </label>
          <label className="block text-sm text-ink-soft">Repite la contraseña
            <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={field} />
          </label>
          {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
          <button disabled={pending}
            className="w-full rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-60">
            {pending ? "Guardando…" : "Guardar y entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
