import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { signPaths } from "@/lib/data";
import { linkLabel } from "@/lib/links";
import { countGaps } from "@/lib/lyrics";
import { GapFill } from "@/components/GapFill";
import { Header } from "@/components/Header";
import { LevelChip, GenreChip } from "@/components/Chip";

const btn = "inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-phones";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireUser();
  const item = await prisma.item.findUnique({
    where: { id },
    include: { section: true, levels: true, genres: true, attachments: true },
  });
  // Un alumno no puede abrir ítems en borrador.
  if (!item || (!item.published && profile.role !== "admin")) notFound();

  const url = await signPaths([item.coverUrl, ...item.attachments.map((a) => a.fileUrl)]);
  const cover = url(item.coverUrl);
  const links = item.links as { label: string; url: string }[];
  const vocabulary = item.vocabulary as { word: string; meaning: string; example: string }[];

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Link href={`/sections/${item.section.id}`} className="text-sm text-ink-soft hover:text-ink">
          ← {item.section.title}
        </Link>

        <article className="margin-page mt-4">
          <h2 className="text-3xl sm:text-4xl"><span className="marker">{item.title}</span></h2>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {item.levels.map((l) => <LevelChip key={l.id} name={l.name} />)}
            {item.genres.map((g) => <GenreChip key={g.id} name={g.name} />)}
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

          {vocabulary.length > 0 && (
            <section className="mt-10">
              <h3 className="font-hand text-3xl">Words to learn</h3>
              <ul className="ruled mt-2 border-b border-rule">
                {vocabulary.map((v, i) => (
                  <li key={i} className="px-2 py-3">
                    <p>
                      <span className="font-serif text-lg font-semibold">{v.word}</span>
                      {v.meaning && <span className="ml-3 text-ink-soft">{v.meaning}</span>}
                    </p>
                    {v.example && <p className="mt-0.5 italic text-ink-soft">“{v.example}”</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {countGaps(item.lyrics) > 0 && (
            <section className="mt-10">
              <h3 className="font-hand text-3xl">Fill in the gaps</h3>
              <p className="mb-4 mt-1 text-ink-soft">
                Escucha la canción y completa las palabras que faltan.
              </p>
              <GapFill lyrics={item.lyrics ?? ""} />
            </section>
          )}

          {item.attachments.length > 0 && (
            <section className="mt-8">
              <h3 className="font-hand text-3xl">Take it with you</h3>
              <ul className="ruled mt-2 border-b border-rule">
                {item.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={url(a.fileUrl) ?? "#"} target="_blank" rel="noopener noreferrer"
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
