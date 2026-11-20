import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Usuario de la sesión actual (o null). Se consulta una sola vez por petición. */
export const getProfile = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role, active } = session.user as typeof session.user & {
    role: string;
    active: boolean;
  };
  return { id, name, email, role, active };
});

/** Reemplaza a las políticas RLS: solo entran usuarios con sesión y cuenta activa. */
export async function requireUser() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.active) redirect("/login?error=inactive");
  return profile;
}

export async function requireAdmin() {
  const profile = await getProfile();
  if (profile?.role !== "admin" || !profile.active) redirect("/");
  return profile;
}
