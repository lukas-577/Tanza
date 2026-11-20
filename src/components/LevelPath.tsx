import Link from "next/link";
import { levelColors } from "@/lib/data";
import { levelInfo } from "@/lib/links";

// Camino de A1 a C1: cada nivel lleva a todo el material de ese nivel.
export function LevelPath({ levels }: { levels: string[] }) {
  return (
    <nav aria-label="Elige tu nivel">
      <p className="font-hand text-2xl leading-none">Where are you?</p>
      <ol className="mt-4 flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l-2 lg:border-dashed lg:border-rule lg:pl-5">
        {levels.map((name) => (
          <li key={name} className="relative shrink-0 lg:py-2">
            <Link href={`/levels/${name}`} className="group flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-ink shadow-sm transition-transform group-hover:scale-110 lg:absolute lg:-left-[2.95rem]"
                style={{ background: levelColors[name] ?? "#e8edf3" }}
              >
                {name}
              </span>
              <span className="hidden text-sm text-ink-soft group-hover:text-ink lg:inline">
                {levelInfo[name] ?? ""}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
