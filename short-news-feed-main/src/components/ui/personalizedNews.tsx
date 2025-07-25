
import { useEffect, useState } from "react"
import { fetchPersonalizedNews } from "@/api/meltwater"


// src/components/ui/PersonalizedNews.tsx

export interface Article {
  title: string
  url: string
  published_at: string
  content?: string
  image_url?: string
  source?: string
}

export default function PersonalizedNews() {
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    const country = localStorage.getItem("userCountry") || "uruguay"
    const sector = localStorage.getItem("userSector") || "tecnología"

    fetchPersonalizedNews(country, sector)
      .then(setArticles)
      .catch(err => {
        console.error("Error cargando noticias:", err)
        setError(true)
      })
  }, [])

  if (error) {
    return <p className="text-red-500 text-center">Error al cargar noticias</p>
  }

  if (articles.length === 0) {
    return <p className="text-slate-500 text-center">No hay noticias disponibles</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, idx) => (
        <div key={idx} className="bg-white rounded shadow p-4 space-y-2">
          {article.image_url && (
            <img src={article.image_url} alt={article.title} className="w-full h-40 object-cover rounded" />
          )}
          <h3 className="text-lg font-semibold text-slate-900">{article.title}</h3>
          <p className="text-sm text-slate-600">{article.content?.slice(0, 150)}...</p>
          <div className="text-xs text-slate-400">
            {article.source} • {new Date(article.published_at).toLocaleDateString()}
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            Leer más →
          </a>
        </div>
      ))}
    </div>
  )
}
