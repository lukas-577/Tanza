import { PageSkeleton } from "@/components/PageSkeleton";

// Las páginas pintan su propio <Header />; aquí solo se replica la franja de cielo para que nada salte.
export default function Loading() {
  return (
    <>
      <div className="sky h-28 sm:h-36" aria-hidden />
      <PageSkeleton />
    </>
  );
}
