"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function EmailForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const f = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(f.get("email") ?? ""),
      password: String(f.get("password") ?? ""),
    });
    if (error) {
      setError("Email o contraseña incorrectos.");
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={pending}
        className="w-full rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-60">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
