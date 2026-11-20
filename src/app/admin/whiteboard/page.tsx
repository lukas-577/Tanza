import Link from "next/link";
import { prisma } from "@/lib/db";
import { Whiteboard } from "./Whiteboard";

export default async function WhiteboardPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  const items = await prisma.item.findMany({
    select: { id: true, title: true, section: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  const options = items.map((it) => ({ id: it.id, label: `${it.section.title} · ${it.title}` }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-ink">← Administrar</Link>
        <h2 className="mt-2 text-3xl">Pizarra</h2>
        <p className="mt-1 text-ink-soft">
          Dibuja o escribe, y guarda el resultado como imagen en un ítem para que tus alumnos lo vean.
        </p>
      </div>
      <Whiteboard items={options} initialItemId={item} />
    </div>
  );
}
