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

export default function WordCloud({ words, maxWords = 30 }: Props) {
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
  const logMin = Math.log1p(min);
  const logMax = Math.log1p(max);
  const norm = (c: number) => {
    if (logMax === logMin) return 0.5;
    return (Math.log1p(c) - logMin) / (logMax - logMin);
  };
  // Precalcular ranking para diferenciar tamaños incluso con empates
  const ranked = useMemo(() => {
    const arr = [...items].sort((a, b) => b.count - a.count);
    const rankMap = new Map<string, number>();
    arr.forEach((it, i) => rankMap.set(it.word, i));
    return { arr, rankMap };
  }, [items]);

  // Tamaño en píxeles con énfasis en grandes y diferenciación por ranking: 16..72px
  const sizeFor = (word: string, count: number) => {
    const n = ranked.arr.length || 1;
    const rank = ranked.rankMap.get(word) ?? 0; // 0 = más grande
    const tRank = n <= 1 ? 1 : 1 - rank / (n - 1); // 1..0
    // combinar ranking con escala log para evitar grupos planos
    const tLog = norm(count);
    const t = Math.min(1, Math.max(0, 0.65 * (tRank ** 0.7) + 0.35 * (tLog ** 0.7)));
    // pequeña variación por palabra para evitar empates visuales
    const jitter = ((hash(word) % 5) - 2) * 0.5; // -1..+1 px
    return Math.round(16 + t * 56 + jitter);
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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 360 });

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
    const H = containerSize.height || 360;
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
      const fs0 = sizeFor(item.word, item.count);
      const weight0 = fs0 >= 56 ? 800 : fs0 >= 40 ? 700 : fs0 >= 26 ? 600 : 500;
      const opacity0 = Math.min(1, 0.65 + (fs0 - 16) / 56 * 0.3);

      // RNG estable por palabra
      const r = mulberry32(hash(item.word) ^ seed ^ idx);
      const angle0 = r() * Math.PI * 2;
      // Inclinación sutil: grandes menos inclinación, chicas más
      const maxTilt = fs0 >= 56 ? 3 : fs0 >= 40 ? 5 : 8; // grados
      const tiltDeg = Math.round((r() - 0.5) * 2 * maxTilt);

      // Intentar con reducciones progresivas de tamaño si no cabe
      const sizeSteps = [1, 0.94, 0.88, 0.82, 0.76];
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
      results.push({ word: item.word, fontSize: fs, weight, opacity, x: placedX + finalW / 2, y: placedY + finalH / 2, tilt: tiltDeg } as any);
    });

    return results;
  }, [sortedBySize, sizeFor, containerSize.width, containerSize.height]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6 shadow-sm">
      <div ref={containerRef} className="relative overflow-hidden" style={{height: 360}}>
        {placed.map((p, idx) => {
          // Colores en gama amarillo/dorado, variando con tamaño y un jitter sutil
          const localSeed = hash(p.word) ^ seed ^ idx;
          const r = mulberry32(localSeed);
          const sFactor = Math.min(1.0, Math.max(0.0, (p.fontSize - 12) / 28));
          // Dorados: hue ~ 42-52 (amarillo-dorado)
          const hueBase = 44 + sFactor * 6; // 44..50
          const hueJitter = (r() - 0.5) * 6; // +-3°
          const hue = Math.max(38, Math.min(52, hueBase + hueJitter));
          const sat = 72 + sFactor * 18; // 72%..90%
          const light = 58 - sFactor * 14; // 58%..44%
          const color = `hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% ${light.toFixed(0)}% / ${Math.max(0.8, p.opacity).toFixed(2)})`;

          return (
            <span
              key={`${p.word}-${idx}`}
              className="absolute transition-transform transition-colors select-none hover:brightness-125"
              style={{
                top: `${p.y}px`,
                left: `${p.x}px`,
                transform: `translate(-50%, -50%) rotate(${(p as any).tilt || 0}deg)`,
                fontSize: `${p.fontSize}px`,
                fontWeight: p.weight as any,
                color,
                whiteSpace: 'nowrap',
                textShadow: '0 2px 6px rgba(0,0,0,0.35), 0 0 12px rgba(255,220,100,0.15)',
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


