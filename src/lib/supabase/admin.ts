import { createClient } from "@supabase/supabase-js";

// Solo para código de servidor (server actions / server components).
// La service role key salta RLS: nunca debe llegar al navegador.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
