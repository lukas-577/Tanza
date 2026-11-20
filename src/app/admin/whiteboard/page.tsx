import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Whiteboard } from "./Whiteboard";

export default async function WhiteboardPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const { item } = await searchParams;
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id,title,sections(title)")
    .order("created_at", { ascending: false });

  const options = (items ?? []).map((it: any) => ({
    id: it.id as string,
    label: `${it.sections?.title ?? "Sin sección"} · ${it.title}`,
  }));

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
