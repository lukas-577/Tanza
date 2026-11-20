"use client";

import { useActionState } from "react";
import { resetStudentPassword } from "../actions";

export function ResetPasswordButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resetStudentPassword, undefined);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="hover:underline disabled:opacity-60">
        {pending ? "Enviando…" : "Restablecer contraseña"}
      </button>
      {state?.ok && <span role="status" className="ml-2 text-green-800">{state.ok}</span>}
      {state?.error && <span role="alert" className="ml-2 text-red-700">{state.error}</span>}
    </form>
  );
}
