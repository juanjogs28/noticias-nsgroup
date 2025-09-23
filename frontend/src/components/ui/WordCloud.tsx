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
    if (max === min) return 0.6; // valor medio si todos iguales
    return 0.6 + (c - min) / (max - min) * 1.1; // 0.6x a 1.7x
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6 shadow-sm">
      <div className="flex flex-wrap gap-3 md:gap-4">
        {items.map((item, idx) => {
          const s = scale(item.count);
          const fontSize = `${Math.round(14 * s)}px`;
          const opacity = 0.6 + (s - 0.6) * 0.3;
          const weight = s > 1.3 ? 700 : s > 1.0 ? 600 : 500;
          return (
            <span
              key={`${item.word}-${idx}`}
              className="text-white hover:text-cyan-300 transition-colors"
              style={{
                fontSize,
                fontWeight: weight as any,
                opacity,
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


