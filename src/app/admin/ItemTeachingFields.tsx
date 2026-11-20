"use client";

import { useState } from "react";
import { countGaps, stringify, tokenize } from "@/lib/lyrics";

export type VocabRow = { word: string; meaning: string; example: string };

const field = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";
const small = "w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm";

/** Vocabulario y letra con espacios, para los formularios de crear y editar ítem. */
export function ItemTeachingFields({
  vocabulary = [],
  lyrics = "",
}: {
  vocabulary?: VocabRow[];
  lyrics?: string | null;
}) {
  const [rows, setRows] = useState<VocabRow[]>(vocabulary);
  const [text, setText] = useState(lyrics ?? "");
  const [mode, setMode] = useState<"write" | "mark">("write");

  const update = (i: number, patch: Partial<VocabRow>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  function toggleWord(wordIndex: number) {
    const segments = tokenize(text);
    let n = -1;
    setText(
      stringify(
        segments.map((s) => {
          if (s.type !== "word") return s;
          n += 1;
          return n === wordIndex ? { ...s, marked: !s.marked } : s;
        })
      )
    );
  }

  const segments = tokenize(text);
  let wordIndex = -1;
  const gaps = countGaps(text);

  return (
    <>
      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm text-ink-soft">Words to learn (vocabulario)</legend>
        <input type="hidden" name="vocabulary" value={JSON.stringify(rows)} />
        {rows.map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-center">
            <input aria-label="Palabra" placeholder="Palabra" value={row.word}
              onChange={(e) => update(i, { word: e.target.value })} className={small} />
            <input aria-label="Significado en español" placeholder="Significado" value={row.meaning}
              onChange={(e) => update(i, { meaning: e.target.value })} className={small} />
            <input aria-label="Frase de ejemplo" placeholder="Frase de ejemplo" value={row.example}
              onChange={(e) => update(i, { example: e.target.value })} className={small} />
            <button type="button" onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
              className="text-sm text-red-700 hover:underline">Quitar</button>
          </div>
        ))}
        <button type="button" onClick={() => setRows((r) => [...r, { word: "", meaning: "", example: "" }])}
          className="rounded-full border border-rule bg-white px-3 py-1.5 text-sm hover:border-ink-soft">
          Añadir palabra
        </button>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm text-ink-soft">Fill in the gaps (completar la letra)</legend>
        <input type="hidden" name="lyrics" value={text} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setMode("write")} aria-pressed={mode === "write"}
            className={`rounded-full border px-3 py-1.5 text-sm ${mode === "write" ? "border-ink bg-ink text-white" : "border-rule bg-white"}`}>
            1. Pegar la letra
          </button>
          <button type="button" onClick={() => setMode("mark")} aria-pressed={mode === "mark"}
            className={`rounded-full border px-3 py-1.5 text-sm ${mode === "mark" ? "border-ink bg-ink text-white" : "border-rule bg-white"}`}>
            2. Marcar palabras
          </button>
          <span className="text-sm text-ink-soft">
            {gaps === 0 ? "Sin espacios: el alumno no verá este ejercicio." : `${gaps} ${gaps === 1 ? "palabra marcada" : "palabras marcadas"}`}
          </span>
        </div>

        {mode === "write" ? (
          <label className="block text-sm text-ink-soft">Letra
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className={field} />
          </label>
        ) : text.trim() ? (
          <div>
            <p className="text-sm text-ink-soft">Haz clic en las palabras que el alumno debe completar. Otro clic las desmarca.</p>
            <div className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-white p-3 font-serif text-lg leading-9">
              {segments.map((s, i) => {
                if (s.type === "text") return <span key={i}>{s.value}</span>;
                wordIndex += 1;
                const idx = wordIndex;
                return (
                  <button key={i} type="button" onClick={() => toggleWord(idx)} aria-pressed={s.marked}
                    className={`rounded px-0.5 ${s.marked ? "bg-marker font-semibold underline decoration-dotted" : "hover:bg-sky"}`}>
                    {s.value}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Primero pega la letra en el paso 1.</p>
        )}
        <p className="text-xs text-ink-soft">
          Truco: en el paso 1 también puedes escribir las llaves a mano, y varias respuestas válidas con «|»,
          por ejemplo {"{gonna|going to}"}.
        </p>
      </fieldset>
    </>
  );
}
