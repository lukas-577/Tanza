import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { signPaths } from "@/lib/data";
import {
  createItem, deleteItem, togglePublished, updateSection, addDecorations, removeDecoration, moveItem,
} from "../../actions";
import { ItemTeachingFields } from "../../ItemTeachingFields";

const field = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";

export default async function AdminSection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [section, items, levels, genres] = await Promise.all([
    prisma.section.findUnique({ where: { id } }),
    prisma.item.findMany({
      where: { sectionId: id },
      select: { id: true, title: true, published: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    prisma.level.findMany({ orderBy: { position: "asc" } }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!section) notFound();
  const decorations = section.decorations;
  const sign = await signPaths([section.coverUrl, ...decorations]);
  const cover = sign(section.coverUrl);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">← Secciones</Link>
        <h2 className="mt-2 text-3xl">{section.title}</h2>
      </div>

      <form action={updateSection} className="space-y-3 rounded-lg border border-line p-4">
        <h3 className="text-lg">Editar sección</h3>
        <input type="hidden" name="id" value={id} />
        <label className="block text-sm text-ink-soft">Título
          <input name="title" required defaultValue={section.title} className={field} />
        </label>
        <label className="block text-sm text-ink-soft">Orden en la página principal (0 aparece primero)
          <input name="position" type="number" min={0} defaultValue={section.position} className={field} />
        </label>
        <div className="flex items-end gap-4">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Portada actual" className="h-20 w-28 rounded object-cover" />
          )}
          <label className="block flex-1 text-sm text-ink-soft">
            {cover ? "Cambiar portada" : "Añadir portada"}
            <input name="cover" type="file" accept="image/*" className={field} />
          </label>
        </div>
        {cover && (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="remove_cover" /> Quitar la portada (la sección se mostrará como lista)
          </label>
        )}
        <button className="rounded-md bg-ink px-4 py-2 font-medium text-white">Guardar cambios</button>
      </form>

      <section className="space-y-3 rounded-lg border border-line p-4">
        <h3 className="text-lg">Imágenes decorativas</h3>
        <p className="text-sm text-ink-soft">
          Se muestran al lado de la lista de esta sección en la página principal. Funcionan mejor las imágenes
          con fondo transparente (PNG).
        </p>
        {decorations.length > 0 && (
          <ul className="flex flex-wrap gap-4">
            {decorations.map((path) => (
              <li key={path} className="space-y-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sign(path) ?? ""} alt="" className="h-20 w-20 rounded border border-line bg-white object-contain" />
                <form action={removeDecoration}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="path" value={path} />
                  <button className="text-sm text-red-700 hover:underline">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addDecorations} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={id} />
          <label className="block flex-1 text-sm text-ink-soft">Añadir imágenes
            <input name="files" type="file" multiple required accept="image/*" className={field} />
          </label>
          <button className="rounded-md bg-ink px-4 py-2 font-medium text-white">Subir</button>
        </form>
      </section>

      <ul className="divide-y divide-line">
        {items.map((it, index) => (
          <li key={it.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Link href={`/items/${it.id}`} className="font-medium hover:underline">{it.title}</Link>
            <span className="flex flex-wrap items-center gap-4 text-sm">
              {(["up", "down"] as const).map((dir) => (
                <form key={dir} action={moveItem}>
                  <input type="hidden" name="id" value={it.id} />
                  <input type="hidden" name="section_id" value={id} />
                  <input type="hidden" name="dir" value={dir} />
                  <button
                    disabled={dir === "up" ? index === 0 : index === items.length - 1}
                    className="hover:underline disabled:opacity-30 disabled:no-underline"
                  >
                    {dir === "up" ? "Subir" : "Bajar"}
                  </button>
                </form>
              ))}
              <Link href={`/admin/items/${it.id}`} className="font-medium hover:underline">Editar</Link>
              <Link href={`/admin/whiteboard?item=${it.id}`} className="hover:underline">Pizarra</Link>
              <form action={togglePublished}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="published" value={String(it.published)} />
                <button className="hover:underline">{it.published ? "Ocultar" : "Publicar"}</button>
              </form>
              <form action={deleteItem}>
                <input type="hidden" name="id" value={it.id} />
                <button className="text-red-700 hover:underline">Eliminar</button>
              </form>
              <span className={it.published ? "text-ink-soft" : "text-amber-700"}>
                {it.published ? "Publicado" : "Borrador"}
              </span>
            </span>
          </li>
        ))}
        {!items.length && <li className="py-3 text-ink-soft">Esta sección está vacía. Añade el primer ítem abajo.</li>}
      </ul>

      <form action={createItem} className="space-y-4 rounded-lg border border-line p-4">
        <h3 className="text-lg">Nuevo ítem</h3>
        <input type="hidden" name="section_id" value={id} />
        <label className="block text-sm text-ink-soft">Título
          <input name="title" required className={field} />
        </label>
        <label className="block text-sm text-ink-soft">Texto
          <textarea name="body" rows={5} className={field} />
        </label>

        <fieldset>
          <legend className="text-sm text-ink-soft">Niveles</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {levels.map((l) => (
              <label key={l.id} className="flex items-center gap-1.5">
                <input type="checkbox" name="levels" value={l.id} /> {l.name}
              </label>
            ))}
          </div>
        </fieldset>

        {!!genres.length && (
          <fieldset>
            <legend className="text-sm text-ink-soft">Géneros</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {genres.map((g) => (
                <label key={g.id} className="flex items-center gap-1.5">
                  <input type="checkbox" name="genres" value={g.id} /> {g.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <label className="block text-sm text-ink-soft">Enlaces (uno por línea: Nombre | https://…)
          <textarea name="links" rows={3} className={field} />
        </label>
        <ItemTeachingFields />
        <label className="block text-sm text-ink-soft">Portada
          <input name="cover" type="file" accept="image/*" className={field} />
        </label>
        <label className="block text-sm text-ink-soft">Archivos (PDF o imágenes)
          <input name="files" type="file" multiple accept="application/pdf,image/*" className={field} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked /> Publicar ahora
        </label>
        <button className="rounded-md bg-ink px-4 py-2 font-medium text-white">Crear ítem</button>
      </form>
    </div>
  );
}
