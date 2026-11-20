"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Si el alumno llega desde el correo de invitación con la sesión en la
// dirección (#access_token=...), la guardamos y lo llevamos a crear su contraseña.
export function HashSession() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");
    if (!access_token || !refresh_token) return;

    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        window.history.replaceState(null, "", window.location.pathname);
        if (!error && (type === "invite" || type === "recovery")) {
          router.replace("/auth/set-password");
        } else if (!error) {
          router.replace("/");
        }
      });
  }, [router]);

  return null;
}
