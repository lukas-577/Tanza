// Esqueleto de cuaderno mientras llega la página: subrayador que se dibuja + renglones vacíos.
export function PageSkeleton({ bare = false }: { bare?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={bare ? undefined : "mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6"}>
      <span className="sr-only">Cargando…</span>
      <p aria-hidden className="inline-block font-hand text-4xl">
        <span className="marker-draw px-1">One sec…</span>
      </p>
      <ul aria-hidden className="ruled mt-8 border-b border-rule">
        {[72, 55, 64, 48, 60].map((w, i) => (
          <li key={i} className="px-2 py-4">
            <span className="block h-4 rounded-sm bg-sky" style={{ width: `${w}%` }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
