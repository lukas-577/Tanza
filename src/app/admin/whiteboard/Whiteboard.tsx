"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveWhiteboard } from "../actions";

type Tool = "pen" | "highlighter" | "eraser" | "text";
type Option = { id: string; label: string };
type Box = { x: number; y: number; w: number; h: number };

const W = 1200;
const H = 700;
const PAD = 8; // margen interno del recuadro de texto, en px del lienzo
const INK = "#1e2a3b";
const COLORS = [
  { name: "Tinta", value: INK },
  { name: "Rojo de corrección", value: "#d64550" },
  { name: "Azul", value: "#3f8fd8" },
  { name: "Verde", value: "#2f9e6e" },
  { name: "Amarillo", value: "#fde047" },
];
const TOOLS: { id: Tool; label: string }[] = [
  { id: "pen", label: "Lápiz" },
  { id: "highlighter", label: "Marcador" },
  { id: "eraser", label: "Borrador" },
  { id: "text", label: "Texto" },
];

const btn = "rounded-full border border-rule bg-white px-3 py-1.5 text-sm hover:border-ink-soft disabled:opacity-40";
const btnOn = "rounded-full border border-ink bg-ink px-3 py-1.5 text-sm text-white";

// Posiciones en % y tamaños en cqw: el recuadro sigue al lienzo al cambiar el ancho de pantalla.
const pctStyle = (b: Box) => ({
  left: `${(b.x / W) * 100}%`,
  top: `${(b.y / H) * 100}%`,
  width: `${(b.w / W) * 100}%`,
  height: `${(b.h / H) * 100}%`,
});

function wrapLines(c: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (line && c.measureText(test).width > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

export function Whiteboard({ items, initialItemId }: { items: Option[]; initialItemId?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const drawing = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const last = useRef({ x: 0, y: 0 });
  const history = useRef<ImageData[]>([]);
  const textDone = useRef(true);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState(4);
  const [canUndo, setCanUndo] = useState(false);
  const [draft, setDraft] = useState<Box | null>(null); // recuadro mientras se arrastra
  const [textBox, setTextBox] = useState<Box | null>(null); // recuadro listo para escribir
  const [itemId, setItemId] = useState(initialItemId && items.some((i) => i.id === initialItemId) ? initialItemId : "");
  const [name, setName] = useState("Pizarra");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const textColor = color === "#fde047" ? INK : color; // el amarillo no se lee como texto
  const fontPx = size * 3 + 16;

  const getCtx = () => canvasRef.current!.getContext("2d")!;

  useEffect(() => {
    const c = getCtx();
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
  }, []);

  // Enfoca el recuadro apenas aparece.
  useEffect(() => {
    if (textBox) taRef.current?.focus();
  }, [textBox]);

  function point(e: { clientX: number; clientY: number }) {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.min(W, Math.max(0, ((e.clientX - r.left) * W) / r.width)),
      y: Math.min(H, Math.max(0, ((e.clientY - r.top) * H) / r.height)),
    };
  }

  function snapshot() {
    const h = history.current;
    h.push(getCtx().getImageData(0, 0, W, H));
    if (h.length > 30) h.shift();
    setCanUndo(true);
  }

  function strokeSegment(from: { x: number; y: number }, to: { x: number; y: number }) {
    const c = getCtx();
    c.lineCap = "round";
    c.lineJoin = "round";
    if (tool === "eraser") {
      c.globalCompositeOperation = "source-over";
      c.strokeStyle = "#ffffff";
      c.lineWidth = size * 4;
    } else if (tool === "highlighter") {
      c.globalCompositeOperation = "multiply"; // el texto de abajo sigue visible
      c.strokeStyle = "#fde047";
      c.lineWidth = size * 4;
    } else {
      c.globalCompositeOperation = "source-over";
      c.strokeStyle = color;
      c.lineWidth = size;
    }
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.lineTo(to.x, to.y);
    c.stroke();
    c.globalCompositeOperation = "source-over";
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = point(e);
    if (tool === "text") {
      if (textBox) void commitText(); // coloca el texto anterior antes de abrir otro recuadro
      dragStart.current = p;
      setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    snapshot();
    drawing.current = true;
    last.current = p;
    e.currentTarget.setPointerCapture(e.pointerId);
    strokeSegment(p, p);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (dragStart.current) {
      const p = point(e);
      const s = dragStart.current;
      setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
      return;
    }
    if (!drawing.current) return;
    const p = point(e);
    strokeSegment(last.current, p);
    last.current = p;
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    const s = dragStart.current;
    if (!s) return;
    dragStart.current = null;
    const p = point(e);
    let box: Box = { x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) };
    // Un simple clic crea un recuadro de tamaño cómodo.
    if (box.w < 60 || box.h < 40) box = { x: s.x, y: s.y, w: 360, h: fontPx * 1.2 * 2 + PAD * 2 };
    box.w = Math.min(box.w, W - box.x);
    box.h = Math.min(box.h, H - box.y);
    setDraft(null);
    textDone.current = false;
    setTextBox(box);
  }

  async function commitText() {
    const box = textBox;
    if (!box || textDone.current) return;
    textDone.current = true;
    const value = taRef.current?.value ?? "";
    setTextBox(null);
    if (!value.trim()) return;

    const family = getComputedStyle(document.body).getPropertyValue("--font-caveat").trim() || "cursive";
    try {
      await document.fonts.load(`${fontPx}px ${family}`);
    } catch {}
    snapshot();
    const c = getCtx();
    c.globalCompositeOperation = "source-over";
    c.fillStyle = textColor;
    c.font = `${fontPx}px ${family}`;
    c.textBaseline = "top";
    wrapLines(c, value, box.w - PAD * 2).forEach((line, i) =>
      c.fillText(line, box.x + PAD, box.y + PAD + i * fontPx * 1.2)
    );
  }

  function cancelText() {
    textDone.current = true;
    setTextBox(null);
  }

  function undo() {
    const h = history.current;
    const prev = h.pop();
    if (prev) getCtx().putImageData(prev, 0, 0);
    setCanUndo(h.length > 0);
  }

  function clearAll() {
    snapshot();
    const c = getCtx();
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
  }

  function toBlob() {
    return new Promise<Blob | null>((resolve) => canvasRef.current!.toBlob(resolve, "image/png"));
  }

  async function download() {
    const blob = await toBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name.trim() || "pizarra"}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function save() {
    setStatus(null);
    if (!itemId) {
      setStatus({ kind: "error", text: "Elige a qué ítem se agrega la imagen." });
      return;
    }
    setSaving(true);
    try {
      if (textBox) await commitText(); // no perder un texto a medio escribir
      const blob = await toBlob();
      if (!blob) throw new Error("No se pudo generar la imagen.");
      const path = `whiteboards/${crypto.randomUUID()}.png`;
      const { error } = await createClient()
        .storage.from("media")
        .upload(path, blob, { contentType: "image/png" });
      if (error) throw new Error(error.message);
      const res = await saveWhiteboard(itemId, path, `${name.trim() || "Pizarra"}.png`);
      if ("error" in res && res.error) throw new Error(res.error);
      setStatus({ kind: "ok", text: "Guardada. Ya aparece en el ítem para tus alumnos." });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Herramientas de dibujo">
        {TOOLS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTool(t.id)}
            aria-pressed={tool === t.id} className={tool === t.id ? btnOn : btn}>
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden />
        {COLORS.map((c) => (
          <button key={c.value} type="button" onClick={() => setColor(c.value)}
            aria-label={c.name} aria-pressed={color === c.value}
            className={`h-7 w-7 rounded-full border-2 ${color === c.value ? "border-ink" : "border-white shadow"}`}
            style={{ background: c.value }} />
        ))}
        <label className="ml-1 flex items-center gap-2 text-sm text-ink-soft">
          Grosor
          <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden />
        <button type="button" onClick={undo} disabled={!canUndo} className={btn}>Deshacer</button>
        <button type="button" onClick={clearAll} className={btn}>Borrar todo</button>
      </div>

      <div
        className="relative overflow-hidden rounded-lg border border-rule bg-white shadow-sm"
        style={{ containerType: "inline-size" }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full touch-none"
          style={{ cursor: tool === "text" ? "text" : "crosshair", aspectRatio: `${W} / ${H}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseDown={(e) => tool === "text" && e.preventDefault()}
          aria-label="Pizarra para dibujar y escribir"
        />

        {draft && (
          <div className="pointer-events-none absolute border-2 border-dashed border-phones bg-phones/5"
            style={pctStyle(draft)} aria-hidden />
        )}

        {textBox && (
          <>
            <textarea
              ref={taRef}
              placeholder="Escribe aquí…"
              aria-label="Texto de la pizarra"
              className="absolute resize-none overflow-hidden border-2 border-dashed border-phones bg-white/70 font-hand outline-none"
              style={{
                ...pctStyle(textBox),
                fontSize: `${(fontPx / W) * 100}cqw`,
                lineHeight: 1.2,
                padding: `${(PAD / W) * 100}cqw`,
                color: textColor,
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelText();
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void commitText();
              }}
              onBlur={() => void commitText()}
            />
            <div
              className="absolute flex gap-1"
              style={{
                left: `${(textBox.x / W) * 100}%`,
                top: `${((textBox.y + textBox.h) / H) * 100}%`,
                marginTop: 4,
              }}
              // Evita que pulsar los botones le quite el foco al recuadro antes de tiempo.
              onMouseDown={(e) => e.preventDefault()}
            >
              <button type="button" onClick={() => void commitText()}
                className="rounded-full bg-ink px-3 py-1 text-sm text-white">Colocar texto</button>
              <button type="button" onClick={cancelText}
                className="rounded-full border border-rule bg-white px-3 py-1 text-sm">Cancelar</button>
            </div>
          </>
        )}
      </div>
      {tool === "text" && (
        <p className="text-sm text-ink-soft">
          Arrastra sobre la pizarra para dibujar el recuadro y escribe dentro. Pulsa «Colocar texto» o haz clic fuera para fijarlo.
        </p>
      )}

      <div className="grid gap-3 rounded-lg border border-line p-4 sm:grid-cols-2">
        <label className="block text-sm text-ink-soft sm:col-span-2">Guardar en el ítem
          <select value={itemId} onChange={(e) => setItemId(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink">
            <option value="">Elige un ítem…</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </select>
        </label>
        <label className="block text-sm text-ink-soft">Nombre del archivo
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink" />
        </label>
        <div className="flex items-end gap-2">
          <button type="button" onClick={save} disabled={saving}
            className="rounded-md bg-ink px-4 py-2 font-medium text-white disabled:opacity-60">
            {saving ? "Guardando…" : "Guardar en el ítem"}
          </button>
          <button type="button" onClick={download} className="rounded-md border border-line px-4 py-2 font-medium">
            Descargar PNG
          </button>
        </div>
        {status && (
          <p role={status.kind === "error" ? "alert" : "status"}
            className={`text-sm sm:col-span-2 ${status.kind === "error" ? "text-red-700" : "text-green-800"}`}>
            {status.text}
          </p>
        )}
        {!items.length && (
          <p className="text-sm text-ink-soft sm:col-span-2">Aún no hay ítems. Crea uno en una sección y vuelve aquí.</p>
        )}
      </div>
    </div>
  );
}
