import { createClient } from "@supabase/supabase-js";

// Cliente sin sesión (flujo implícito) para enviar correos de recuperación.
// El enlace del correo trae la sesión en la dirección y la lee HashSession en /login.
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
