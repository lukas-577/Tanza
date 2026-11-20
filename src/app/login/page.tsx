import { redirect } from "next/navigation";
import { getProfile } from "@/lib/session";
import { GoogleButton } from "./GoogleButton";
import { EmailForm } from "./EmailForm";

const messages: Record<string, string> = {
  inactive: "Tu cuenta está desactivada. Habla con tu profesora.",
  not_registered: "Ese correo de Google no está registrado. Pídele a tu profesora que te agregue.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const profile = await getProfile();
  if (profile?.active) redirect("/");

  const message = error
    ? messages[error] ??
      "No pudimos iniciar sesión con Google. Revisa que uses el correo que te registró tu profesora."
    : null;

  return (
    <main className="flex-1">
      <div className="sky h-40" aria-hidden />
      <div className="mx-auto -mt-10 w-full max-w-sm px-4">
        <span className="text-5xl" aria-hidden>🎧</span>
        <h1 className="mt-2 text-3xl">The Tanza Teaching Experience</h1>
        <p className="mt-3 font-hand text-3xl">Welcome back!</p>
        <p className="mt-2 text-ink-soft">Entra con el email que le diste a tu profesora.</p>
        <div className="mt-8 space-y-4">
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <EmailForm />
          <p className="flex items-center gap-3 text-sm text-ink-soft" aria-hidden>
            <span className="h-px flex-1 bg-line" /> o <span className="h-px flex-1 bg-line" />
          </p>
          <GoogleButton />
        </div>
      </div>
    </main>
  );
}
