import { useEffect, useState } from "react"
import { fetchNewsByCountry, fetchNewsByCategory } from "@/api/meltwater"
import NewsList from "@/components/ui/newsList"

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

export default function PersonalizedNews() {
  const [countryNews, setCountryNews] = useState<Article[]>([])
  const [categoryNews, setCategoryNews] = useState<Article[]>([])

  useEffect(() => {
    const country = localStorage.getItem("userCountry") || "us"
    const category = localStorage.getItem("userSector") || "technology"

    console.log("Fetching noticias para:", { country, category })

    fetchNewsByCountry(country)
      .then(setCountryNews)
      .catch(console.error)

    fetchNewsByCategory(category)
      .then(setCategoryNews)
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Noticias de {localStorage.getItem("userCountry")?.toUpperCase() || "US"}
        </h2>
        <NewsList articles={countryNews} title="tu país" />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Noticias sobre {localStorage.getItem("userSector") || "Tecnología"}
        </h2>
        <NewsList articles={categoryNews} title="tu sector" />
      </section>
    </div>
  )
}
