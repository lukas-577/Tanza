"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setPassword(_: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== String(formData.get("confirm") ?? "")) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "El enlace venció. Pide a tu profesora una nueva invitación." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/");
}
