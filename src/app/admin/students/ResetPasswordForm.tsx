"use client";

import { useActionState } from "react";
import { resetStudentPassword } from "../actions";

export function ResetPasswordForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resetStudentPassword, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="password" type="text" required minLength={8} autoComplete="off"
        placeholder="Nueva contraseña" aria-label="Nueva contraseña"
        className="w-40 rounded-md border border-line bg-white px-2 py-1" />
      <button disabled={pending} className="hover:underline disabled:opacity-60">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
      {state?.ok && <span role="status" className="text-green-800">{state.ok}</span>}
      {state?.error && <span role="alert" className="text-red-700">{state.error}</span>}
    </form>
  );
}
