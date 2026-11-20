"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { deleteFiles, uploadFile } from "@/lib/r2";

const hasFile = (f: FormDataEntryValue | null): f is File => f instanceof File && f.size > 0;
const upload = (file: File, folder: string) => uploadFile(file, folder, file.name);
const attachmentType = (f: File) => (f.type === "application/pdf" ? "pdf" : "image");

export async function createSection(formData: FormData) {
  await requireAdmin();
  const cover = formData.get("cover");
  await prisma.section.create({
    data: {
      title: String(formData.get("title")),
      coverUrl: hasFile(cover) ? await upload(cover, "covers") : null,
      position: await prisma.section.count(),
    },
  });
  revalidatePath("/", "layout");
}

export async function updateSection(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const data: { title: string; position?: number; coverUrl?: string | null } = { title };
  const position = Number(formData.get("position"));
  if (Number.isFinite(position)) data.position = position;

  const cover = formData.get("cover");
  let oldCover: string | null | undefined;
  if (hasFile(cover) || formData.get("remove_cover") === "on") {
    oldCover = (await prisma.section.findUnique({ where: { id }, select: { coverUrl: true } }))?.coverUrl;
    data.coverUrl = hasFile(cover) ? await upload(cover, "covers") : null;
  }

  await prisma.section.update({ where: { id }, data });
  await deleteFiles([oldCover]);
  revalidatePath("/", "layout");
}

export async function addDecorations(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const files = formData.getAll("files").filter(hasFile);
  if (!files.length) return;

  const added: string[] = [];
  for (const f of files) added.push(await upload(f, "decorations"));

  await prisma.section.update({ where: { id }, data: { decorations: { push: added } } });
  revalidatePath("/", "layout");
}

export async function removeDecoration(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const path = String(formData.get("path"));
  const section = await prisma.section.findUnique({ where: { id }, select: { decorations: true } });
  if (!section) return;
  await prisma.section.update({
    where: { id },
    data: { decorations: section.decorations.filter((p) => p !== path) },
  });
  if (path.startsWith("decorations/")) await deleteFiles([path]);
  revalidatePath("/", "layout");
}

export async function deleteSection(formData: FormData) {
  await requireAdmin();
  await prisma.section.delete({ where: { id: String(formData.get("id")) } });
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
const connectIds = (ids: string[]) => ids.map((id) => ({ id }));

async function uploadAttachments(itemId: string, formData: FormData) {
  for (const f of formData.getAll("files")) {
    if (!hasFile(f)) continue;
    await prisma.attachment.create({
      data: { itemId, fileUrl: await upload(f, "files"), name: f.name, type: attachmentType(f) },
    });
  }
}

export async function createItem(formData: FormData) {
  await requireAdmin();
  const sectionId = String(formData.get("section_id"));
  const cover = formData.get("cover");

  const item = await prisma.item.create({
    data: {
      sectionId,
      position: await prisma.item.count({ where: { sectionId } }), // los ítems nuevos van al final
      title: String(formData.get("title")),
      body: String(formData.get("body") ?? ""),
      links: parseLinks(formData.get("links")),
      vocabulary: parseVocabulary(formData.get("vocabulary")),
      lyrics: parseLyrics(formData.get("lyrics")),
      coverUrl: hasFile(cover) ? await upload(cover, "covers") : null,
      published: formData.get("published") === "on",
      levels: { connect: connectIds(formData.getAll("levels").map(String)) },
      genres: { connect: connectIds(formData.getAll("genres").map(String)) },
    },
    select: { id: true },
  });

  await uploadAttachments(item.id, formData);
  revalidatePath("/", "layout");
  redirect(`/admin/sections/${sectionId}`);
}

export async function togglePublished(formData: FormData) {
  await requireAdmin();
  await prisma.item.update({
    where: { id: String(formData.get("id")) },
    data: { published: formData.get("published") !== "true" },
  });
  revalidatePath("/", "layout");
}

export async function deleteItem(formData: FormData) {
  await requireAdmin();
  await prisma.item.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/", "layout");
}

export async function createGenre(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name) await prisma.genre.upsert({ where: { name }, update: {}, create: { name } });
  revalidatePath("/admin", "layout");
}

export type StudentState = { error?: string; ok?: string } | undefined;

// Guarda (o reemplaza) la contraseña de un usuario como cuenta "credential" de Better Auth.
async function setCredentialPassword(userId: string, password: string) {
  const hashed = await hashPassword(password);
  const existing = await prisma.account.findFirst({ where: { userId, providerId: "credential" } });
  if (existing) {
    await prisma.account.update({ where: { id: existing.id }, data: { password: hashed } });
  } else {
    await prisma.account.create({
      data: { userId, accountId: userId, providerId: "credential", password: hashed },
    });
  }
}

// Registra al alumno con su Gmail y una contraseña inicial. Puede entrar con email + contraseña
// o con Google (la primera vez con Google se une a este mismo registro).
export async function createStudent(_: StudentState, formData: FormData): Promise<StudentState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) return { error: "Escribe el email." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Ese email ya está registrado." };
  }
  const user = await prisma.user.create({
    data: { email, name: name || email.split("@")[0], role: "student" },
  });
  await setCredentialPassword(user.id, password);
  revalidatePath("/admin/students");
  return { ok: `Listo: ${email} ya puede entrar con su contraseña o con Google.` };
}

export async function resetStudentPassword(_: StudentState, formData: FormData): Promise<StudentState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Mínimo 8 caracteres." };
  const student = await prisma.user.findFirst({ where: { id, role: "student" }, select: { id: true } });
  if (!student) return { error: "Alumno no encontrado." };
  await setCredentialPassword(id, password);
  await prisma.session.deleteMany({ where: { userId: id } }); // cierra sus sesiones abiertas
  return { ok: "Contraseña actualizada." };
}

export async function toggleStudentActive(formData: FormData) {
  await requireAdmin();
  await prisma.user.updateMany({
    where: { id: String(formData.get("id")), role: "student" },
    data: { active: formData.get("active") !== "true" },
  });
  revalidatePath("/admin/students");
}

export async function deleteStudent(formData: FormData) {
  await requireAdmin();
  // Las sesiones y cuentas se borran en cascada.
  await prisma.user.deleteMany({ where: { id: String(formData.get("id")), role: "student" } });
  revalidatePath("/admin/students");
}

// La pizarra se dibuja en el navegador y llega como PNG; se sube a R2 y se registra en el ítem.
export async function saveWhiteboard(formData: FormData) {
  await requireAdmin();
  const itemId = String(formData.get("item_id"));
  const image = formData.get("image");
  const name = String(formData.get("name") ?? "").trim() || "Pizarra";
  if (!(image instanceof Blob) || image.size === 0 || image.type !== "image/png") {
    return { error: "Imagen no válida." };
  }
  if (!(await prisma.item.findUnique({ where: { id: itemId }, select: { id: true } }))) {
    return { error: "El ítem ya no existe." };
  }

  const fileUrl = await uploadFile(image, "whiteboards", `${name}.png`);
  await prisma.attachment.create({ data: { itemId, fileUrl, name: `${name}.png`, type: "image" } });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function updateItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("El ítem necesita un título.");

  const current = await prisma.item.findUnique({ where: { id }, select: { sectionId: true, coverUrl: true } });
  if (!current) throw new Error("Ítem no encontrado");

  const data: {
    coverUrl?: string | null;
  } = {};
  const cover = formData.get("cover");
  let oldCover: string | null = null;
  if (hasFile(cover) || formData.get("remove_cover") === "on") {
    data.coverUrl = hasFile(cover) ? await upload(cover, "covers") : null;
    oldCover = current.coverUrl;
  }

  await prisma.item.update({
    where: { id },
    data: {
      ...data,
      title,
      body: String(formData.get("body") ?? ""),
      links: parseLinks(formData.get("links")),
      vocabulary: parseVocabulary(formData.get("vocabulary")),
      lyrics: parseLyrics(formData.get("lyrics")),
      published: formData.get("published") === "on",
      // Niveles y géneros: se reemplazan por la selección actual.
      levels: { set: connectIds(formData.getAll("levels").map(String)) },
      genres: { set: connectIds(formData.getAll("genres").map(String)) },
    },
  });
  await deleteFiles([oldCover]);

  await uploadAttachments(id, formData);
  revalidatePath("/", "layout");
  redirect(`/admin/sections/${current.sectionId}`);
}

export async function removeAttachment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const att = await prisma.attachment.findUnique({ where: { id }, select: { fileUrl: true } });
  if (!att) return;
  await prisma.attachment.delete({ where: { id } });
  await deleteFiles([att.fileUrl]);
  revalidatePath("/", "layout");
}

export async function moveItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const sectionId = String(formData.get("section_id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;

  const rows = await prisma.item.findMany({
    where: { sectionId },
    select: { id: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  const ids = rows.map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];

  // Se renumera todo para que no queden empates.
  await prisma.$transaction(
    ids.map((rid, position) => prisma.item.update({ where: { id: rid }, data: { position } }))
  );
  revalidatePath("/", "layout");
}
