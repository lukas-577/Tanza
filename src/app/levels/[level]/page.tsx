import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { LevelChip, GenreChip } from "@/components/Chip";
import { levelInfo } from "@/lib/links";

// Todo el material de un nivel, agrupado por sección.
export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level: raw } = await params;
  const level = decodeURIComponent(raw);
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("items")
    .select("id,title,sections(id,title,position),item_levels!inner(levels!inner(name)),item_genres(genres(id,name))")
    .eq("item_levels.levels.name", level)
    .order("position").order("created_at");

  const groups = new Map<string, { title: string; position: number; items: any[] }>();
  (items as any[] | null)?.forEach((it) => {
    const s = it.sections;
    if (!s) return;
    if (!groups.has(s.id)) groups.set(s.id, { title: s.title, position: s.position, items: [] });
    groups.get(s.id)!.items.push(it);
  });
  const ordered = [...groups.entries()].sort((a, b) => a[1].position - b[1].position);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">← Material</Link>
        <h2 className="mt-3 text-4xl">
          <span className="marker">Level {level}</span>
        </h2>
        <p className="mt-2 text-ink-soft">{levelInfo[level] ?? ""}</p>

        {!ordered.length ? (
          <p className="mt-10 font-hand text-3xl text-ink-soft">Coming soon…</p>
        ) : (
          <div className="mt-8 space-y-10">
            {ordered.map(([id, g]) => (
              <section key={id}>
                <h3 className="font-hand text-3xl">{g.title}</h3>
                <ul className="ruled mt-2 border-b border-rule">
                  {g.items.map((it) => (
                    <li key={it.id}>
                      <Link href={`/items/${it.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-2 py-3.5 hover:bg-sky/40">
                        <span className="font-medium">{it.title}</span>
                        <span className="flex items-center gap-1.5">
                          {it.item_genres.map((x: any) => x.genres && <GenreChip key={x.genres.id} name={x.genres.name} />)}
                          <LevelChip name={level} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
