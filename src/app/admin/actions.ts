"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const update: { title: string; position?: number; cover_url?: string } = { title };
  const position = Number(formData.get("position"));
  if (Number.isFinite(position)) update.position = position;

  const cover = formData.get("cover");
  if (hasFile(cover)) {
    const { data: old } = await supabase.from("sections").select("cover_url").eq("id", id).single();
    update.cover_url = await upload(supabase, cover, "covers");
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

export async function createItem(formData: FormData) {
  const supabase = await requireAdmin();
  const sectionId = String(formData.get("section_id"));
  const cover = formData.get("cover");

  const links = String(formData.get("links") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, url] = l.includes("|") ? l.split("|").map((s) => s.trim()) : ["", l];
      return { label, url };
    })
    .filter((l) => /^https?:\/\//.test(l.url));

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      section_id: sectionId,
      title: String(formData.get("title")),
      body: String(formData.get("body") ?? ""),
      links,
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
