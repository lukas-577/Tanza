import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/data";
import { Header } from "@/components/Header";
import { LevelChip, GenreChip } from "@/components/Chip";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nivel?: string; q?: string }>;
};

export default async function SectionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { nivel, q } = await searchParams;
  const supabase = await createClient();

  const [{ data: section }, { data: levels }, { data: items }] = await Promise.all([
    supabase.from("sections").select("*").eq("id", id).single(),
    supabase.from("levels").select("*").order("position"),
    supabase
      .from("items")
      .select("id,title,item_levels(levels(id,name,position)),item_genres(genres(id,name))")
      .eq("section_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!section) notFound();
  const cover = (await signPaths([section.cover_url]))(section.cover_url);

  const filtered = (items ?? []).filter((it) => {
    const lv = it.item_levels.map((x: any) => x.levels?.name);
    if (nivel && !lv.includes(nivel)) return false;
    if (q && !it.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm ${active ? "bg-ink text-white" : "border border-rule bg-white hover:border-ink-soft"}`;

  return (
    <>
      <Header />
      {cover && (
        <div className="mx-auto mt-8 w-full max-w-5xl px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="h-40 w-full rounded-lg object-cover sm:h-56" />
        </div>
      )}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">← Material</Link>
        <h2 className="mt-3 text-4xl"><span className="marker">{section.title}</span></h2>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link href={q ? `?q=${q}` : "?"} className={pill(!nivel)}>Todos</Link>
          {levels?.map((l) => (
            <Link key={l.id} href={`?nivel=${l.name}${q ? `&q=${q}` : ""}`} className={pill(nivel === l.name)}>
              {l.name}
            </Link>
          ))}
          <form className="ml-auto">
            {nivel && <input type="hidden" name="nivel" value={nivel} />}
            <input name="q" defaultValue={q} placeholder="Buscar…" aria-label="Buscar"
              className="rounded-full border border-rule bg-white px-3 py-1 text-sm" />
          </form>
        </div>

        {!filtered.length ? (
          <p className="mt-10 font-hand text-3xl text-ink-soft">Nothing here yet…</p>
        ) : (
          <ul className="ruled mt-6 border-b border-rule">
            {filtered.map((it) => (
              <li key={it.id}>
                <Link href={`/items/${it.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-2 py-3.5 hover:bg-sky/40">
                  <span className="font-medium">{it.title}</span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {it.item_genres.map((g: any) => g.genres && <GenreChip key={g.genres.id} name={g.genres.name} />)}
                    {it.item_levels
                      .map((l: any) => l.levels)
                      .filter(Boolean)
                      .sort((a: any, b: any) => a.position - b.position)
                      .map((l: any) => <LevelChip key={l.id} name={l.name} />)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {!!filtered.length && (
          <p className="mt-3 text-sm text-ink-soft">
            {filtered.length} {filtered.length === 1 ? "ítem" : "ítems"}
          </p>
        )}
      </main>
    </>
  );
}
