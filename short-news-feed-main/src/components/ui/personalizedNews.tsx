import { useEffect, useState } from "react"
import { fetchNewsByCountry, fetchNewsByCategory } from "@/api/meltwater"


export interface Article {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

function NewsList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return <p>No hay noticias disponibles.</p>

  return (
    <ul>
      {articles.map((article, idx) => (
        <li key={idx} className="mb-4">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600"
          >
            {article.title}
          </a>
          {article.description && <p>{article.description}</p>}
          <small>
            {article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}
          </small>
        </li>
      ))}
    </ul>
  )
}

export default function PersonalizedNews() {
  const [countryNews, setCountryNews] = useState<Article[]>([])
  const [categoryNews, setCategoryNews] = useState<Article[]>([])

  useEffect(() => {
    const country = localStorage.getItem("userCountry") || "us"
    const category = localStorage.getItem("userSector") || "technology"

    fetchNewsByCountry(country)
      .then(setCountryNews)
      .catch(console.error)

    fetchNewsByCategory(category)
      .then(setCategoryNews)
      .catch(console.error)
    
    
  }, [])

  return (
    <div>
      <section>
        <h2>Noticias de {localStorage.getItem("userCountry") || "US"}</h2>
        <NewsList articles={countryNews} />
      </section>

      <section>
        <h2>Noticias sobre {localStorage.getItem("userSector") || "Tecnología"}</h2>
        <NewsList articles={categoryNews} />
      </section>
    </div>
    
  )
  
}
