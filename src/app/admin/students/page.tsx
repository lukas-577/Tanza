import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleStudentActive, deleteStudent } from "../actions";
import { StudentForm } from "./StudentForm";
import { ResetPasswordButton } from "./ResetPasswordButton";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("id,name,active,created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const { data: users } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
  const email = new Map(users?.users.map((u) => [u.id, u.email]) ?? []);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">← Administrar</Link>
        <h2 className="mt-2 text-3xl">Alumnos</h2>
      </div>

      <ul className="divide-y divide-line">
        {students?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span>
              <span className="font-medium">{s.name || email.get(s.id)}</span>
              {s.name && <span className="ml-2 text-sm text-ink-soft">{email.get(s.id)}</span>}
            </span>
            <span className="flex flex-wrap items-center gap-4 text-sm">
              <span className={s.active ? "text-ink-soft" : "text-amber-700"}>
                {s.active ? "Activo" : "Desactivado"}
              </span>
              <ResetPasswordButton id={s.id} />
              <form action={toggleStudentActive}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="active" value={String(s.active)} />
                <button className="hover:underline">{s.active ? "Desactivar" : "Activar"}</button>
              </form>
              <form action={deleteStudent}>
                <input type="hidden" name="id" value={s.id} />
                <button className="text-red-700 hover:underline">Eliminar</button>
              </form>
            </span>
          </li>
        ))}
        {!students?.length && <li className="py-3 text-ink-soft">Aún no hay alumnos. Crea el primero abajo.</li>}
      </ul>

      <StudentForm />
    </div>
  );
}
