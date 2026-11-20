"use client";

import { useActionState } from "react";
import { createStudent } from "../actions";

const field = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";

export function StudentForm() {
  const [state, action, pending] = useActionState(createStudent, undefined);
  return (
    <form action={action} className="space-y-3 rounded-lg border border-line p-4">
      <h3 className="text-lg">Nuevo alumno</h3>
      <label className="block text-sm text-ink-soft">Nombre
        <input name="name" className={field} />
      </label>
      <label className="block text-sm text-ink-soft">Email
        <input name="email" type="email" required className={field} />
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm text-green-800">{state.ok}</p>}
      <button disabled={pending} className="rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-60">
        {pending ? "Enviando…" : "Enviar invitación"}
      </button>
    </form>
  );
}
