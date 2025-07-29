import { useEffect, useState } from "react"
import { fetchPersonalizedNews } from "@/api/meltwater"
import { Article, RawMeltwaterDocument } from "./types"
import NewsList from "./newsList"

export default function PersonalizedNews() {
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    const country = localStorage.getItem("userCountry") || "uy"
    const sector = localStorage.getItem("userSector") || "technology"

    fetchPersonalizedNews(country, sector)
      .then((documents: RawMeltwaterDocument[]) => {
        const adapted: Article[] = documents.map((doc) => ({
          title: doc.title ?? "Sin título",
          url: doc.url,
          urlToImage:
            typeof doc.content === "object" && doc.content?.image
              ? doc.content.image
              : "",
          description:
            typeof doc.content === "string"
              ? doc.content
              : doc.content?.summary || "",
          publishedAt: doc.published_date,
          source: {
            name: doc.source?.name || "Fuente desconocida",
          },
        }))
        setArticles(adapted)
      })
      .catch((err) => {
        console.error("Error cargando noticias:", err)
        setError(true)
      })
  }, [])

  if (error) {
    return <p className="text-red-500 text-center">❌ Error al cargar noticias</p>
  }

  if (articles.length === 0) {
    return <p className="text-slate-500 text-center">No hay noticias disponibles</p>
  }

  return (
    <section className="py-12 px-4">
      <h2 className="text-2xl font-semibold mb-6 text-center">Noticias para vos</h2>
      <NewsList articles={articles} title="seleccionadas" />
    </section>
  )
}
