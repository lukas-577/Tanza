import Link from "next/link";
import { prisma } from "@/lib/db";
import { toggleStudentActive, deleteStudent } from "../actions";
import { StudentForm } from "./StudentForm";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "student" },
    select: { id: true, name: true, email: true, active: true, _count: { select: { sessions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">← Administrar</Link>
        <h2 className="mt-2 text-3xl">Alumnos</h2>
        <p className="mt-1 text-ink-soft">
          Agrega el Gmail de cada alumno y una contraseña inicial. Podrá entrar con ella o con “Continuar con Google”.
        </p>
      </div>

      <ul className="divide-y divide-line">
        {students.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span>
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-sm text-ink-soft">{s.email}</span>
            </span>
            <span className="flex flex-wrap items-center gap-4 text-sm">
              <span className={s.active ? "text-ink-soft" : "text-amber-700"}>
                {!s.active ? "Desactivado" : s._count.sessions ? "Activo" : "Aún no ha entrado"}
              </span>
              <ResetPasswordForm id={s.id} />
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
        {!students.length && <li className="py-3 text-ink-soft">Aún no hay alumnos. Agrega el primero abajo.</li>}
      </ul>

      <StudentForm />
    </div>
  );
}
