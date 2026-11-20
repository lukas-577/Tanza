"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_: { error?: string } | undefined, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "Email o contraseña incorrectos." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Siempre responde lo mismo, exista o no el email, para no revelar quién tiene cuenta.
export async function requestPasswordReset(_: { error?: string; ok?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribe tu email." };

  const h = await headers();
  const origin = h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await createPublicClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login`,
  });
  if (error && /rate limit|too many/i.test(error.message)) {
    return { error: "Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo." };
  }
  return { ok: "Si ese email tiene cuenta, te enviamos un enlace para crear una nueva contraseña." };
}
