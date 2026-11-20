"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "./actions";
import { HashSession } from "./HashSession";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <main className="flex-1">
      <HashSession />
      <div className="sky h-40" aria-hidden />
      <div className="mx-auto -mt-10 w-full max-w-sm px-4">
        <span className="text-5xl" aria-hidden>🎧</span>
        <h1 className="mt-2 text-3xl">The Tanza Teaching Experience</h1>
        <p className="mt-3 font-hand text-3xl">Welcome back!</p>
        <p className="mt-2 text-ink-soft">Entra con el email que te dio tu profesora.</p>
        <form action={action} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-ink-soft">Email</span>
            <input name="email" type="email" required autoComplete="email"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm text-ink-soft">Contraseña</span>
            <input name="password" type="password" required autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2" />
          </label>
          {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
          <button disabled={pending}
            className="w-full rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-60">
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-sm">
          <Link href="/login/forgot" className="text-ink-soft hover:text-ink">¿Olvidaste tu contraseña?</Link>
        </p>
      </div>
    </main>
  );
}
