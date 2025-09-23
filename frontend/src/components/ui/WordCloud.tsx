import React, { useEffect, useMemo, useRef, useState } from "react";

export interface WordFrequency {
  word: string;
  count: number;
}

interface Props {
  words: WordFrequency[];
  maxWords?: number;
}

function normalizeWord(text: string): string {
  return text
    .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúüñ\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function WordCloud({ words, maxWords = 40 }: Props) {
  const filtered = words
    .filter(w => w.word && w.count > 0)
    .map(w => ({ word: normalizeWord(w.word), count: w.count }))
    .filter(w => w.word.length > 1);

  const dedupMap = new Map<string, number>();
  for (const w of filtered) {
    dedupMap.set(w.word, (dedupMap.get(w.word) || 0) + w.count);
  }

  const items = Array.from(dedupMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxWords);

  if (items.length === 0) {
    return null;
  }

  const counts = items.map(i => i.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const scale = (c: number) => {
    if (max === min) return 1.0; // valor medio si todos iguales
    // expandir rango para diferencias más marcadas: 0.8x a 2.2x
    return 0.8 + (c - min) / (max - min) * 1.4;
  };

  // Utilidades para pseudo-aleatoriedad estable por palabra
  const hash = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
  };
  const mulberry32 = (seed: number) => {
    return () => {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };

  // Desordenar (shuffle) con RNG basado en contenido para estabilidad
  const seed = items.reduce((acc, it) => acc ^ hash(it.word), 0) || 1;
  const rng = mulberry32(seed);
  // Ordenar por tamaño (frecuencia) para colocar primero palabras grandes
  const sortedBySize = [...items].sort((a, b) => b.count - a.count);

  // Layout sin solapamientos
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 260 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new (window as any).ResizeObserver?.(update);
    if (ro && el) ro.observe(el);
    return () => ro && ro.disconnect();
  }, []);

  type Placed = { word: string; fontSize: number; weight: number; opacity: number; x: number; y: number };

  const placed = useMemo<Placed[]>(() => {
    const W = containerSize.width || 600;
    const H = containerSize.height || 260;
    const basePad = 6;

    // Aproximación de ancho por carácter según fontSize
    const textWidth = (w: string, fs: number) => Math.max(8, w.length * fs * 0.55);
    const textHeight = (fs: number) => fs * 1.1;

    const boxes: { x: number; y: number; w: number; h: number }[] = [];
    const results: Placed[] = [];

    const collides = (x: number, y: number, w: number, h: number) => {
      for (const b of boxes) {
        if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return true;
      }
      return false;
    };

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    // Centro base
    const cx = W / 2;
    const cy = H / 2;

    sortedBySize.forEach((item, idx) => {
      const s = scale(item.count);
      const fs0 = Math.round(14 * s);
      const weight0 = s > 1.8 ? 800 : s > 1.4 ? 700 : s > 1.1 ? 600 : 500;
      const opacity0 = Math.min(1, 0.55 + (s - 0.8) * 0.35);

      // RNG estable por palabra
      const r = mulberry32(hash(item.word) ^ seed ^ idx);
      const angle0 = r() * Math.PI * 2;

      // Intentar con reducciones progresivas de tamaño si no cabe
      const sizeSteps = [1, 0.9, 0.8, 0.7];
      let placedX = 0;
      let placedY = 0;
      let finalW = 0;
      let finalH = 0;
      let fs = fs0;
      let weight = weight0;
      let opacity = opacity0;
      let found = false;

      for (const factor of sizeSteps) {
        fs = Math.max(12, Math.round(fs0 * factor));
        weight = weight0; // mantener peso relativo
        opacity = opacity0;
        const pad = basePad + Math.round(fs * 0.08);
        const w = textWidth(item.word, fs) + pad * 2;
        const h = textHeight(fs) + pad * 2;

        const maxTurns = 1400;
        const spiralStep = 3 + r() * 3; // paso de espiral

        for (let t = 0; t < maxTurns; t++) {
          const radius = 2 + (t * spiralStep) / 4;
          const angle = angle0 + t * 0.15;
          const x = cx + radius * Math.cos(angle) - w / 2;
          const y = cy + radius * Math.sin(angle) - h / 2;

          // Limitar a contenedor
          const clampedX = clamp(x, pad, W - w - pad);
          const clampedY = clamp(y, pad, H - h - pad);

          if (!collides(clampedX, clampedY, w, h)) {
            placedX = clampedX;
            placedY = clampedY;
            finalW = w;
            finalH = h;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      if (!found) {
        // Omitir palabra si no se puede colocar sin solapar
        return;
      }

      boxes.push({ x: placedX, y: placedY, w: finalW, h: finalH });
      results.push({ word: item.word, fontSize: fs, weight, opacity, x: placedX + finalW / 2, y: placedY + finalH / 2 });
    });

    return results;
  }, [sortedBySize, scale, containerSize.width, containerSize.height]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6 shadow-sm">
      <div ref={containerRef} className="relative overflow-hidden" style={{height: 260}}>
        {placed.map((p, idx) => {
          // Color coherente con el estilo (gama azul-cyan-violeta), variando con tamaño y un RNG por palabra
          const localSeed = hash(p.word) ^ seed ^ idx;
          const r = mulberry32(localSeed);
          const sFactor = Math.min(1.0, Math.max(0.0, (p.fontSize - 12) / 24));
          const hueBase = 190 + sFactor * 50; // 190..240 (cyan a azul)
          const hueJitter = (r() - 0.5) * 16; // +-8°
          const hue = Math.max(180, Math.min(250, hueBase + hueJitter));
          const sat = 65 + sFactor * 20; // 65%..85%
          const light = 70 - sFactor * 20; // 70%..50%
          const color = `hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% ${light.toFixed(0)}% / ${Math.max(0.6, p.opacity).toFixed(2)})`;

          return (
            <span
              key={`${p.word}-${idx}`}
              className="absolute transition-colors select-none hover:brightness-125"
              style={{
                top: `${p.y}px`,
                left: `${p.x}px`,
                transform: `translate(-50%, -50%)`,
                fontSize: `${p.fontSize}px`,
                fontWeight: p.weight as any,
                color,
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px rgba(0,0,0,0.25)',
              }}
              title={`${p.word}`}
            >
              {p.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}


