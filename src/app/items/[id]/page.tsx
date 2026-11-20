import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/data";
import { linkLabel } from "@/lib/links";
import { Header } from "@/components/Header";
import { LevelChip, GenreChip } from "@/components/Chip";

const btn = "inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-phones";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("*,sections(id,title),item_levels(levels(id,name)),item_genres(genres(id,name)),attachments(*)")
    .eq("id", id)
    .single();
  if (!item) notFound();

  const url = await signPaths([item.cover_url, ...item.attachments.map((a: any) => a.file_url)]);
  const cover = url(item.cover_url);
  const links: { label: string; url: string }[] = item.links ?? [];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link href={`/sections/${item.sections.id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {item.sections.title}
        </Link>

        <article className="margin-page mt-4">
          <h2 className="text-3xl sm:text-4xl"><span className="marker">{item.title}</span></h2>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {item.item_levels.map((l: any) => l.levels && <LevelChip key={l.levels.id} name={l.levels.name} />)}
            {item.item_genres.map((g: any) => g.genres && <GenreChip key={g.genres.id} name={g.genres.name} />)}
          </div>

          {cover && (
            <div className="polaroid mt-8 max-w-md" style={{ "--tilt": "-1deg" } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="w-full object-cover" />
            </div>
          )}

          {item.body && (
            <div className="mt-8 max-w-prose whitespace-pre-wrap font-serif text-lg leading-8">{item.body}</div>
          )}

          {links.length > 0 && (
            <section className="mt-8 flex flex-wrap gap-3">
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={btn}>
                  {linkLabel(l.url, l.label)}
                </a>
              ))}
            </section>
          )}

          {item.attachments.length > 0 && (
            <section className="mt-8">
              <h3 className="font-hand text-3xl">Take it with you</h3>
              <ul className="ruled mt-2 border-b border-rule">
                {item.attachments.map((a: any) => (
                  <li key={a.id}>
                    <a href={url(a.file_url) ?? "#"} target="_blank" rel="noopener noreferrer"
                      className="block px-2 py-3 text-phones hover:bg-sky/40">
                      {a.type === "pdf" ? "Descargar PDF · " : "Ver imagen · "}{a.name ?? "archivo"}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
