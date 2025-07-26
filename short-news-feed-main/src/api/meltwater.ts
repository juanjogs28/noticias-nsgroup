// src/api/meltwater.ts (nuevo propósito: proxy al backend)

export async function fetchPersonalizedNews(country: string, sector: string) {
  const res = await fetch("http://localhost:3001/api/news", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, sector }),
  });

  if (!res.ok) throw new Error("Error al obtener noticias");

  const data = await res.json();
  return data.data.documents || [];
}
