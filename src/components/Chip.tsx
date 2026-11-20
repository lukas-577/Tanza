import { levelColors } from "@/lib/data";

// El nivel se ve como un toque de resaltador sobre la palabra.
export function LevelChip({ name }: { name: string }) {
  return (
    <span
      className="inline-block rounded-sm px-2 py-0.5 text-sm font-semibold text-ink"
      style={{ background: levelColors[name] ?? "#e8edf3" }}
    >
      {name}
    </span>
  );
}

export function GenreChip({ name }: { name: string }) {
  return <span className="inline-block px-1 py-0.5 text-sm text-ink-soft">#{name}</span>;
}
