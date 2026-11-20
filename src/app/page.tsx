import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { signPaths } from "@/lib/data";
import { Header } from "@/components/Header";
import { LevelPath } from "@/components/LevelPath";

const tilts = ["-1.6deg", "1.2deg", "-0.8deg", "1.8deg"];

export default async function Home() {
  const profile = await requireUser();
  // Los alumnos solo ven ítems publicados; las admins ven todo.
  const visible = profile.role === "admin" ? {} : { published: true };
  const [sections, levels] = await Promise.all([
    prisma.section.findMany({ orderBy: { position: "asc" } }),
    prisma.level.findMany({ select: { name: true }, orderBy: { position: "asc" } }),
  ]);

  // Con portada: polaroid. Sin portada: lista de ítems directamente en la página.
  const gallery = sections.filter((s) => s.coverUrl);
  const lists = sections.filter((s) => !s.coverUrl);

  const [url, listItems] = await Promise.all([
    signPaths([...gallery.map((s) => s.coverUrl), ...lists.flatMap((s) => s.decorations)]),
    lists.length
      ? prisma.item.findMany({
          where: { sectionId: { in: lists.map((s) => s.id) }, ...visible },
          select: {
            id: true, title: true, body: true, links: true, sectionId: true,
            _count: { select: { attachments: true } },
          },
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        })
      : Promise.resolve([]),
  ]);

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
            <LevelPath levels={levels.map((l) => l.name)} />
          </aside>

          <div className="space-y-14">
            <section>
              <h2 className="text-2xl"><span className="marker">Material</span></h2>
              {!sections.length ? (
                <p className="mt-6 text-ink-soft">
                  Todavía no hay material. Tu profesora lo irá subiendo pronto.
                </p>
              ) : (
                gallery.length > 0 && (
                  <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
                    {gallery.map((s, i) => (
                      <li key={s.id}>
                        <Link href={`/sections/${s.id}`} className="block">
                          <div className="polaroid" style={{ "--tilt": tilts[i % tilts.length] } as React.CSSProperties}>
                            <div className="aspect-[4/3] overflow-hidden bg-sky">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url(s.coverUrl) ?? ""} alt="" className="h-full w-full object-cover" />
                            </div>
                            <p className="mt-2 text-center font-hand text-3xl leading-none">{s.title}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>

            {lists.map((s) => {
              const items = listItems.filter((it) => it.sectionId === s.id);
              const decorations = s.decorations;
              return (
                <section key={s.id} className="flex items-start gap-6">
                  <div className="min-w-0 flex-1">
                  <h2 className="text-2xl">
                    <Link href={`/sections/${s.id}`} className="hover:underline">
                      <span className="marker">{s.title}</span>
                    </Link>
                  </h2>
                  {!items.length ? (
                    <p className="mt-4 font-hand text-3xl text-ink-soft">Coming soon…</p>
                  ) : (
                    <ul className="ruled mt-4 border-b border-rule">
                      {items.map((it) => {
                        // Un ítem que es solo un enlace abre el sitio directamente.
                        const links = (it.links ?? []) as { label: string; url: string }[];
                        const only = links.length === 1 && !it.body?.trim() && !it._count.attachments;
                        const className = "block px-2 py-3 hover:bg-sky/40";
                        return (
                          <li key={it.id}>
                            {only ? (
                              <a href={links[0].url} target="_blank" rel="noopener noreferrer" className={className}>
                                {it.title}
                                <span className="sr-only"> (se abre en otra pestaña)</span>
                              </a>
                            ) : (
                              <Link href={`/items/${it.id}`} className={className}>{it.title}</Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  </div>
                  {decorations.length > 0 && (
                    <div className="hidden shrink-0 flex-col items-center gap-4 sm:flex" aria-hidden>
                      {decorations.map((path, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={path} src={url(path) ?? ""} alt=""
                          className="w-24 object-contain"
                          style={{ transform: `rotate(${i % 2 ? 6 : -5}deg)` }} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
