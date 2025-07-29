// src/api/meltwater.ts (nuevo propósito: proxy al backend)
export async function fetchPersonalizedNews(country: string, sector: string): Promise<Article[]> {
  const response = await fetch("http://localhost:3001/api/news", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, sector }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Error desconocido");
  }

  return result.data; // aquí retornás solo el arreglo de artículos
}
