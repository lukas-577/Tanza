"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";
import { authClient } from "@/lib/auth-client";

export function GoogleButton() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({ provider: "google", callbackURL: "/", errorCallbackURL: "/login" });
        setPending(false);
      }}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-line bg-white px-4 py-2.5 font-medium hover:bg-sky/30 disabled:opacity-60"
    >
      {pending ? <Spinner /> : <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.3-4 6.7-9.9 6.7-16.9z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.5 2.2-8.8 2.2-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>}
      {pending ? "Redirigiendo…" : "Continuar con Google"}
    </button>
  );
}
