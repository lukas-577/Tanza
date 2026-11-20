import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, signPaths } from "@/lib/data";
import { Header } from "@/components/Header";
import { LevelPath } from "@/components/LevelPath";

const tilts = ["-1.6deg", "1.2deg", "-0.8deg", "1.8deg"];

export default async function Home() {
  const supabase = await createClient();
  const [profile, { data: sections }, { data: levels }] = await Promise.all([
    getProfile(),
    supabase.from("sections").select("*").order("position"),
    supabase.from("levels").select("name").order("position"),
  ]);
  const url = await signPaths(sections?.map((s) => s.cover_url) ?? []);
  const first = profile?.name?.trim().split(" ")[0];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <p className="font-hand text-3xl sm:text-4xl">Hello{first ? `, ${first}` : ""}! 👋</p>
        <p className="mt-1 max-w-prose text-ink-soft">
          Aprende inglés con lo que ya te gusta. Elige tu nivel o entra a una sección.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[13rem_1fr]">
          <aside className="space-y-8">
            <div className="note max-w-[13rem] p-4 text-2xl leading-tight">always updating…</div>
            <LevelPath levels={levels?.map((l) => l.name) ?? []} />
          </aside>

          <section>
            <h2 className="text-2xl"><span className="marker">Material</span></h2>
            {!sections?.length ? (
              <p className="mt-6 text-ink-soft">
                Todavía no hay material. Tu profesora lo irá subiendo pronto.
              </p>
            ) : (
              <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
                {sections.map((s, i) => {
                  const cover = url(s.cover_url);
                  return (
                    <li key={s.id}>
                      <Link href={`/sections/${s.id}`} className="block">
                        <div className="polaroid" style={{ "--tilt": tilts[i % tilts.length] } as React.CSSProperties}>
                          <div className="aspect-[4/3] overflow-hidden bg-sky">
                            {cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <p className="mt-2 text-center font-hand text-3xl leading-none">{s.title}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
