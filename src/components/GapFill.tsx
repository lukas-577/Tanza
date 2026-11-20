"use client";

import { useMemo, useState } from "react";
import { isCorrect, tokenize } from "@/lib/lyrics";

type Mode = "answering" | "checked" | "revealed";

export function GapFill({ lyrics }: { lyrics: string }) {
  // Cada línea es una lista de textos y espacios; los espacios llevan un número global.
  const { lines, answers } = useMemo(() => {
    const answers: string[] = [];
    const lines = lyrics.split("\n").map((line) =>
      tokenize(line).map((s) => {
        if (s.type === "word" && s.marked) {
          answers.push(s.value);
          return { gap: answers.length - 1, answer: s.value };
        }
        return { text: s.value };
      })
    );
    return { lines, answers };
  }, [lyrics]);

  const [values, setValues] = useState<string[]>(() => answers.map(() => ""));
  const [mode, setMode] = useState<Mode>("answering");

  const score = answers.filter((a, i) => isCorrect(values[i] ?? "", a)).length;

  function reset() {
    setValues(answers.map(() => ""));
    setMode("answering");
  }

  return (
    <div>
      <div className="font-serif text-lg leading-[2.6rem]">
        {lines.map((parts, li) => (
          <div key={li} className={parts.length ? "" : "h-6"}>
            {parts.map((p, pi) => {
              if ("text" in p) return <span key={pi}>{p.text}</span>;
              const i = p.gap;
              const shown = mode === "revealed" ? p.answer.split("|")[0] : values[i] ?? "";
              const ok = mode === "checked" && isCorrect(values[i] ?? "", p.answer);
              const wrong = mode === "checked" && !ok;
              return (
                <span key={pi} className="whitespace-nowrap">
                  <input
                    value={shown}
                    readOnly={mode !== "answering"}
                    onChange={(e) => setValues((v) => v.map((x, idx) => (idx === i ? e.target.value : x)))}
                    aria-label={`Espacio ${i + 1} de ${answers.length}`}
                    aria-invalid={wrong || undefined}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    style={{ width: `${Math.max(p.answer.split("|")[0].length, 3) + 2}ch` }}
                    className={`mx-1 border-b-2 bg-transparent px-1 text-center font-sans text-base outline-none ${
                      ok ? "border-green-600 text-green-800" : wrong ? "border-red-600 text-red-700" : "border-ink-soft focus:border-phones"
                    }`}
                  />
                  {ok && <span aria-label="correcto" className="text-green-700">✓</span>}
                  {wrong && <span aria-label="incorrecto" className="text-red-700">✕</span>}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setMode("checked")}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-phones">
          Comprobar
        </button>
        <button type="button" onClick={() => setMode("revealed")}
          className="rounded-full border border-rule bg-white px-4 py-2 text-sm hover:border-ink-soft">
          Ver respuestas
        </button>
        <button type="button" onClick={reset}
          className="rounded-full border border-rule bg-white px-4 py-2 text-sm hover:border-ink-soft">
          Empezar de nuevo
        </button>
        {mode === "checked" && (
          <p role="status" className="font-hand text-3xl">
            {score === answers.length ? "Perfect! " : ""}Acertaste {score} de {answers.length}
          </p>
        )}
      </div>
    </div>
  );
}
