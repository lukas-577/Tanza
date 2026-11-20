import { signedUrl } from "@/lib/r2";

export { getProfile } from "@/lib/session";

export type Level = { id: string; name: string; position: number };
export type Genre = { id: string; name: string };

/** Convierte claves del bucket privado de R2 en URLs firmadas (1 h). */
export async function signPaths(paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p && !p.startsWith("http")))];
  const map = new Map<string, string>();
  await Promise.all(unique.map(async (p) => map.set(p, await signedUrl(p, 3600))));
  return (p?: string | null) => (!p ? null : p.startsWith("http") ? p : map.get(p) ?? null);
}

export const levelColors: Record<string, string> = {
  A1: "#f5e6b3",
  A2: "#f6d5d5",
  B1: "#f6dcc6",
  B2: "#e1d6f0",
  C1: "#cfe6df",
};
