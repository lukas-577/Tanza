import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { getProfile } from "@/lib/data";
import { signOut } from "@/app/login/actions";

export async function Header() {
  const profile = await getProfile();
  return (
    <>
      <div className="sky h-28 sm:h-36" aria-hidden />
      <header className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="-mt-10 flex items-end justify-between gap-4">
          <Link href="/" className="block">
            <span className="text-5xl" aria-hidden>🎧</span>
            <span className="mt-2 block font-serif text-3xl font-semibold sm:text-5xl">
              The Tanza Teaching Experience
            </span>
          </Link>
          <nav className="flex items-center gap-4 pb-2 text-sm text-ink-soft">
            {profile?.role === "admin" && (
              <Link href="/admin" className="hover:text-ink">Administrar</Link>
            )}
            <form action={signOut}>
              <SubmitButton className="hover:text-ink">Salir</SubmitButton>
            </form>
          </nav>
        </div>
      </header>
    </>
  );
}
