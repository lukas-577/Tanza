// Una letra marca los espacios en blanco entre llaves: "I {feel} good".
// Se aceptan varias respuestas válidas separadas por "|": "{gonna|going to}".

export type Segment =
  | { type: "text"; value: string }
  | { type: "word"; value: string; marked: boolean };

const TOKEN = /\{[^{}]*\}|[\p{L}\p{N}'’]+/gu;

/** Separa el texto en palabras (marcadas o no) y el resto (espacios, signos, saltos de línea). */
export function tokenize(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ type: "text", value: text.slice(last, start) });
    const raw = m[0];
    const marked = raw.startsWith("{");
    out.push({ type: "word", value: marked ? raw.slice(1, -1) : raw, marked });
    last = start + raw.length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

export function stringify(segments: Segment[]) {
  return segments.map((s) => (s.type === "word" && s.marked ? `{${s.value}}` : s.value)).join("");
}

export function countGaps(text: string | null | undefined) {
  return text ? (text.match(/\{[^{}]+\}/g) ?? []).length : 0;
}

/** Comparación tolerante: mayúsculas, acentos de apóstrofe y signos no cuentan. */
export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrect(answer: string, expected: string) {
  const a = normalize(answer);
  return !!a && expected.split("|").some((option) => normalize(option) === a);
}
