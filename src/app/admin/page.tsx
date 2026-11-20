import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSection, deleteSection, createGenre } from "./actions";

const field = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";
const primary = "rounded-md bg-ink px-4 py-2 font-medium text-white";

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ data: sections }, { data: genres }] = await Promise.all([
    supabase.from("sections").select("*").order("position"),
    supabase.from("genres").select("*").order("name"),
  ]);

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/students" className="inline-block rounded-md border border-line px-4 py-2 font-medium hover:bg-sky/30">
          Gestionar alumnos
        </Link>
        <Link href="/admin/whiteboard" className="inline-block rounded-md border border-line px-4 py-2 font-medium hover:bg-sky/30">
          Pizarra
        </Link>
      </div>
      <section>
        <h2 className="text-2xl">Secciones</h2>
        <ul className="mt-4 divide-y divide-line">
          {sections?.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-3">
              <Link href={`/admin/sections/${s.id}`} className="font-medium hover:underline">{s.title}</Link>
              <span className="flex items-center gap-4 text-sm">
                <Link href={`/admin/sections/${s.id}`} className="hover:underline">Editar</Link>
              <form action={deleteSection}>
                <input type="hidden" name="id" value={s.id} />
                <button className="text-red-700 hover:underline">Eliminar</button>
              </form>
              </span>
            </li>
          ))}
          {!sections?.length && <li className="py-3 text-ink-soft">Crea tu primera sección, por ejemplo “Music”.</li>}
        </ul>

        <form action={createSection} className="mt-6 space-y-3 rounded-lg border border-line p-4">
          <h3 className="text-lg">Nueva sección</h3>
          <label className="block text-sm text-ink-soft">Título
            <input name="title" required className={field} />
          </label>
          <label className="block text-sm text-ink-soft">Portada (opcional: sin foto se muestra como lista)
            <input name="cover" type="file" accept="image/*" className={field} />
          </label>
          <button className={primary}>Crear sección</button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl">Géneros</h2>
        <p className="mt-2 flex flex-wrap gap-2">
          {genres?.map((g) => (
            <span key={g.id} className="rounded border border-line px-2 py-0.5 text-sm">{g.name}</span>
          ))}
          {!genres?.length && <span className="text-ink-soft">Aún no hay géneros.</span>}
        </p>
        <form action={createGenre} className="mt-4 flex gap-2">
          <input name="name" required placeholder="Pop, Rock, Comedy…" aria-label="Nuevo género"
            className="rounded-md border border-line bg-white px-3 py-2" />
          <button className={primary}>Añadir género</button>
        </form>
      </section>
    </div>
  );
}
