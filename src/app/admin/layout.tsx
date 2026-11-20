import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { Header } from "@/components/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (profile?.role !== "admin") redirect("/");
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </>
  );
}
