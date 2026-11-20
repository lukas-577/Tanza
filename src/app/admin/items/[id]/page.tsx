import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { signPaths } from "@/lib/data";
import { updateItem, removeAttachment } from "../../actions";
import { ItemTeachingFields } from "../../ItemTeachingFields";

const field = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, levels, genres] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: {
        section: true,
        levels: { select: { id: true } },
        genres: { select: { id: true } },
        attachments: true,
      },
    }),
    prisma.level.findMany({ orderBy: { position: "asc" } }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!item) notFound();

  const sign = await signPaths([item.coverUrl, ...item.attachments.map((a) => a.fileUrl)]);
  const cover = sign(item.coverUrl);
  const levelIds = new Set(item.levels.map((x) => x.id));
  const genreIds = new Set(item.genres.map((x) => x.id));
  const links = item.links as { label: string; url: string }[];
  const linksText = links.map((l) => (l.label ? `${l.label} | ${l.url}` : l.url)).join("\n");

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/sections/${item.section.id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {item.section.title}
        </Link>
        <h2 className="mt-2 text-3xl">Editar ítem</h2>
      </div>

      {item.attachments.length > 0 && (
        <section className="space-y-2 rounded-lg border border-line p-4">
          <h3 className="text-lg">Archivos actuales</h3>
          <ul className="divide-y divide-line">
            {item.attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <a href={sign(a.fileUrl) ?? "#"} target="_blank" rel="noopener noreferrer"
                  className="text-phones hover:underline">
                  {a.name ?? "archivo"}
                </a>
                <form action={removeAttachment}>
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className="text-sm text-red-700 hover:underline">Quitar</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={updateItem} className="space-y-4 rounded-lg border border-line p-4">
        <input type="hidden" name="id" value={id} />
        <label className="block text-sm text-ink-soft">Título
          <input name="title" required defaultValue={item.title} className={field} />
        </label>
        <label className="block text-sm text-ink-soft">Texto
          <textarea name="body" rows={6} defaultValue={item.body ?? ""} className={field} />
        </label>

        <fieldset>
          <legend className="text-sm text-ink-soft">Niveles</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {levels.map((l) => (
              <label key={l.id} className="flex items-center gap-1.5">
                <input type="checkbox" name="levels" value={l.id} defaultChecked={levelIds.has(l.id)} /> {l.name}
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
                  <input type="checkbox" name="genres" value={g.id} defaultChecked={genreIds.has(g.id)} /> {g.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <label className="block text-sm text-ink-soft">Enlaces (uno por línea: Nombre | https://…)
          <textarea name="links" rows={3} defaultValue={linksText} className={field} />
        </label>

        <ItemTeachingFields vocabulary={item.vocabulary as { word: string; meaning: string; example: string }[]} lyrics={item.lyrics} />

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
            <input type="checkbox" name="remove_cover" /> Quitar la portada
          </label>
        )}

        <label className="block text-sm text-ink-soft">Añadir archivos (PDF o imágenes)
          <input name="files" type="file" multiple accept="application/pdf,image/*" className={field} />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={item.published} /> Publicado
        </label>

        <div className="flex items-center gap-4">
          <SubmitButton className="rounded-md bg-ink px-4 py-2 font-medium text-white">Guardar cambios</SubmitButton>
          <Link href={`/admin/sections/${item.section.id}`} className="text-sm text-ink-soft hover:text-ink">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
