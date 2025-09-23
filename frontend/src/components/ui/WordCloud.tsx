import React from "react";

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
  const shuffled = [...items].sort(() => rng() - 0.5);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6 shadow-sm">
      <div className="relative overflow-hidden" style={{height: 260}}>
        {shuffled.map((item, idx) => {
          const s = scale(item.count);
          const fontSize = Math.round(14 * s);
          const opacity = Math.min(1, 0.55 + (s - 0.8) * 0.35);
          const weight = s > 1.8 ? 800 : s > 1.4 ? 700 : s > 1.1 ? 600 : 500;

          // Posiciones y rotación pseudo-aleatorias
          const rLocal = mulberry32(hash(item.word) ^ seed ^ idx);
          const topPct = 5 + rLocal() * 80;  // 5%..85%
          const leftPct = 4 + rLocal() * 88; // 4%..92%
          const rotateDeg = Math.round((rLocal() - 0.5) * 16); // -8..8 deg

          return (
            <span
              key={`${item.word}-${idx}`}
              className="absolute text-white/90 hover:text-cyan-300 transition-colors select-none"
              style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                transform: `translate(-50%, -50%) rotate(${rotateDeg}deg)`,
                fontSize: `${fontSize}px`,
                fontWeight: weight as any,
                opacity,
                whiteSpace: 'nowrap',
              }}
              title={`${item.word} (${item.count})`}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}


