/** Texto del botón según a dónde lleva el enlace. */
export function linkLabel(url: string, label?: string) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  if (host.includes("youtube.com") || host === "youtu.be") return label || "Watch on YouTube";
  if (host.includes("spotify.com")) return label || "Listen on Spotify";
  return label || `Open ${host || "link"}`;
}

export const levelInfo: Record<string, string> = {
  A1: "Primeros pasos",
  A2: "Básico",
  B1: "Intermedio",
  B2: "Intermedio alto",
  C1: "Avanzado",
};
