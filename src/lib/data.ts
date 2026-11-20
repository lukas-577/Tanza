import { createClient } from "@/lib/supabase/server";

export type Level = { id: string; name: string; position: number };
export type Genre = { id: string; name: string };

/** Convierte rutas del bucket privado "media" en URLs firmadas (1 h). */
export async function signPaths(paths: (string | null | undefined)[]) {
  const supabase = await createClient();
  const unique = [...new Set(paths.filter((p): p is string => !!p && !p.startsWith("http")))];
  const map = new Map<string, string>();
  if (unique.length) {
    const { data } = await supabase.storage.from("media").createSignedUrls(unique, 3600);
    data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  }
  return (p?: string | null) => (!p ? null : p.startsWith("http") ? p : map.get(p) ?? null);
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id,name,role,active").eq("id", user.id).single();
  return data;
}

export const levelColors: Record<string, string> = {
  A1: "#f5e6b3",
  A2: "#f6d5d5",
  B1: "#f6dcc6",
  B2: "#e1d6f0",
  C1: "#cfe6df",
};
