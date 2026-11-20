"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

async function requireAdmin() {
  const profile = await getProfile();
  if (profile?.role !== "admin" || !profile.active) redirect("/");
  return createClient();
}

async function upload(supabase: Awaited<ReturnType<typeof createClient>>, file: File, folder: string) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${folder}/${randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`No se pudo subir ${file.name}: ${error.message}`);
  return path;
}

const hasFile = (f: FormDataEntryValue | null): f is File => f instanceof File && f.size > 0;

export async function createSection(formData: FormData) {
  const supabase = await requireAdmin();
  const cover = formData.get("cover");
  const { count } = await supabase.from("sections").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("sections").insert({
    title: String(formData.get("title")),
    cover_url: hasFile(cover) ? await upload(supabase, cover, "covers") : null,
    position: count ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateSection(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const update: { title: string; position?: number; cover_url?: string | null } = { title };
  const position = Number(formData.get("position"));
  if (Number.isFinite(position)) update.position = position;

  const cover = formData.get("cover");
  const removeCover = formData.get("remove_cover") === "on";
  if (hasFile(cover) || removeCover) {
    const { data: old } = await supabase.from("sections").select("cover_url").eq("id", id).single();
    update.cover_url = hasFile(cover) ? await upload(supabase, cover, "covers") : null;
    if (old?.cover_url && !old.cover_url.startsWith("http")) {
      await supabase.storage.from("media").remove([old.cover_url]);
    }
  }

  const { error } = await supabase.from("sections").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function addDecorations(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const files = formData.getAll("files").filter(hasFile);
  if (!files.length) return;

  const { data: section, error: readError } = await supabase
    .from("sections").select("decorations").eq("id", id).single();
  if (readError) throw new Error(readError.message);

  const added: string[] = [];
  for (const f of files) added.push(await upload(supabase, f, "decorations"));

  const { error } = await supabase
    .from("sections")
    .update({ decorations: [...(section?.decorations ?? []), ...added] })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function removeDecoration(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const path = String(formData.get("path"));
  const { data: section } = await supabase.from("sections").select("decorations").eq("id", id).single();
  const rest = (section?.decorations ?? []).filter((p: string) => p !== path);
  await supabase.from("sections").update({ decorations: rest }).eq("id", id);
  if (path.startsWith("decorations/")) await supabase.storage.from("media").remove([path]);
  revalidatePath("/", "layout");
}

export async function deleteSection(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("sections").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

// "Nombre | https://…" por línea (el nombre es opcional).
// Si falta el "https://", se agrega. Solo se aceptan enlaces http(s).
function parseLinks(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf("|"); // el nombre puede tener "|" sin romper el enlace
      const label = i >= 0 ? l.slice(0, i).trim() : "";
      let url = (i >= 0 ? l.slice(i + 1) : l).trim();
      if (url && !/^[a-z][a-z0-9+.-]*:/i.test(url)) url = `https://${url}`;
      return { label, url };
    })
    .filter((l) => /^https?:\/\/[^\s/]+\.[^\s/]+/.test(l.url));
}

// El editor manda el vocabulario como JSON; se limpia y se descartan filas sin palabra.
function parseVocabulary(raw: FormDataEntryValue | null) {
  try {
    const data = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(data)) return [];
    return data
      .map((v) => ({
        word: String(v?.word ?? "").trim().slice(0, 120),
        meaning: String(v?.meaning ?? "").trim().slice(0, 300),
        example: String(v?.example ?? "").trim().slice(0, 500),
      }))
      .filter((v) => v.word)
      .slice(0, 200);
  } catch {
    return [];
  }
}

const parseLyrics = (raw: FormDataEntryValue | null) => String(raw ?? "").trim() || null;

export async function createItem(formData: FormData) {
  const supabase = await requireAdmin();
  const sectionId = String(formData.get("section_id"));
  const cover = formData.get("cover");
  const links = parseLinks(formData.get("links"));
  const { count } = await supabase
    .from("items").select("*", { count: "exact", head: true }).eq("section_id", sectionId);

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      section_id: sectionId,
      position: count ?? 0, // los ítems nuevos van al final
      title: String(formData.get("title")),
      body: String(formData.get("body") ?? ""),
      links,
      vocabulary: parseVocabulary(formData.get("vocabulary")),
      lyrics: parseLyrics(formData.get("lyrics")),
      cover_url: hasFile(cover) ? await upload(supabase, cover, "covers") : null,
      published: formData.get("published") === "on",
    })
    .select("id")
    .single();
  if (error || !item) throw new Error(error?.message ?? "No se pudo crear el ítem");

  const levelIds = formData.getAll("levels").map(String);
  const genreIds = formData.getAll("genres").map(String);
  if (levelIds.length)
    await supabase.from("item_levels").insert(levelIds.map((level_id) => ({ item_id: item.id, level_id })));
  if (genreIds.length)
    await supabase.from("item_genres").insert(genreIds.map((genre_id) => ({ item_id: item.id, genre_id })));

  for (const f of formData.getAll("files")) {
    if (!hasFile(f)) continue;
    await supabase.from("attachments").insert({
      item_id: item.id,
      file_url: await upload(supabase, f, "files"),
      name: f.name,
      type: f.type === "application/pdf" ? "pdf" : "image",
    });
  }
  revalidatePath("/", "layout");
  redirect(`/admin/sections/${sectionId}`);
}

export async function togglePublished(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase
    .from("items")
    .update({ published: formData.get("published") !== "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

export async function deleteItem(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("items").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

export async function createGenre(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from("genres").insert({ name: String(formData.get("name")).trim() });
  revalidatePath("/admin", "layout");
}

export type StudentState = { error?: string; ok?: string } | undefined;

export async function createStudent(_: StudentState, formData: FormData): Promise<StudentState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  // Envía el correo de invitación; el alumno crea su propia contraseña.
  const { error } = await createAdminClient().auth.admin.inviteUserByEmail(email, {
    data: { name },
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/students");
  return { ok: `Invitación enviada a ${email}. Podrá crear su contraseña desde el correo.` };
}

export async function toggleStudentActive(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase
    .from("profiles")
    .update({ active: formData.get("active") !== "true" })
    .eq("id", String(formData.get("id")))
    .eq("role", "student");
  revalidatePath("/admin/students");
}

export async function deleteStudent(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const { data } = await supabase.from("profiles").select("role").eq("id", id).single();
  if (data?.role !== "student") return;
  await createAdminClient().auth.admin.deleteUser(id);
  revalidatePath("/admin/students");
}

// El navegador sube el PNG directo a Storage; aquí solo se registra en la base de datos.
export async function saveWhiteboard(itemId: string, path: string, name: string) {
  const supabase = await requireAdmin();
  if (!path.startsWith("whiteboards/")) return { error: "Ruta de archivo no válida." };
  const { error } = await supabase.from("attachments").insert({
    item_id: itemId,
    file_url: path,
    name: name.trim() || "Pizarra",
    type: "image",
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function updateItem(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("El ítem necesita un título.");

  const { data: current, error: readError } = await supabase
    .from("items").select("section_id,cover_url").eq("id", id).single();
  if (readError || !current) throw new Error(readError?.message ?? "Ítem no encontrado");

  const update: {
    title: string; body: string; links: { label: string; url: string }[];
    vocabulary: ReturnType<typeof parseVocabulary>; lyrics: string | null;
    published: boolean; cover_url?: string | null;
  } = {
    title,
    body: String(formData.get("body") ?? ""),
    links: parseLinks(formData.get("links")),
    vocabulary: parseVocabulary(formData.get("vocabulary")),
    lyrics: parseLyrics(formData.get("lyrics")),
    published: formData.get("published") === "on",
  };

  const cover = formData.get("cover");
  if (hasFile(cover) || formData.get("remove_cover") === "on") {
    update.cover_url = hasFile(cover) ? await upload(supabase, cover, "covers") : null;
    if (current.cover_url && !current.cover_url.startsWith("http")) {
      await supabase.storage.from("media").remove([current.cover_url]);
    }
  }

  const { error } = await supabase.from("items").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  // Niveles y géneros: se reemplazan por la selección actual.
  const levelIds = formData.getAll("levels").map(String);
  const genreIds = formData.getAll("genres").map(String);
  await supabase.from("item_levels").delete().eq("item_id", id);
  await supabase.from("item_genres").delete().eq("item_id", id);
  if (levelIds.length)
    await supabase.from("item_levels").insert(levelIds.map((level_id) => ({ item_id: id, level_id })));
  if (genreIds.length)
    await supabase.from("item_genres").insert(genreIds.map((genre_id) => ({ item_id: id, genre_id })));

  for (const f of formData.getAll("files")) {
    if (!hasFile(f)) continue;
    await supabase.from("attachments").insert({
      item_id: id,
      file_url: await upload(supabase, f, "files"),
      name: f.name,
      type: f.type === "application/pdf" ? "pdf" : "image",
    });
  }
  revalidatePath("/", "layout");
  redirect(`/admin/sections/${current.section_id}`);
}

export async function removeAttachment(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const { data: att } = await supabase.from("attachments").select("file_url").eq("id", id).single();
  await supabase.from("attachments").delete().eq("id", id);
  if (att?.file_url && !att.file_url.startsWith("http")) {
    await supabase.storage.from("media").remove([att.file_url]);
  }
  revalidatePath("/", "layout");
}

export async function moveItem(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const sectionId = String(formData.get("section_id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;

  const { data: rows } = await supabase
    .from("items").select("id").eq("section_id", sectionId)
    .order("position").order("created_at");
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];

  // Se renumera todo para que no queden empates.
  await Promise.all(ids.map((rid, position) => supabase.from("items").update({ position }).eq("id", rid)));
  revalidatePath("/", "layout");
}

export type ResetState = { error?: string; ok?: string } | undefined;

// El alumno recibe un correo y crea él mismo su nueva contraseña.
export async function resetStudentPassword(_: ResetState, formData: FormData): Promise<ResetState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const { data, error } = await createAdminClient().auth.admin.getUserById(id);
  const email = data?.user?.email;
  if (error || !email) return { error: "No se encontró el email de este alumno." };

  const h = await headers();
  const origin = h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error: sendError } = await createPublicClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login`,
  });
  if (sendError) return { error: sendError.message };
  return { ok: `Enviamos un enlace a ${email}.` };
}
