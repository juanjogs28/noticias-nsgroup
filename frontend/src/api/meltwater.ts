import { buildApiUrl, API_CONFIG } from "../config/api";

export async function fetchPersonalizedNews(country: string, sector: string) {
  const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NEWS), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country, sector }),
  })
  console.log(country, sector);
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Error cargando noticias: ${res.status} - ${error}`)
  }

  const json = await res.json()

  if (!json.success || !Array.isArray(json.data)) {
    throw new Error("Estructura inesperada en la respuesta del servidor")
  }

  return json // <- Asegurate que devuelva { success: true, data: [...] }
}
