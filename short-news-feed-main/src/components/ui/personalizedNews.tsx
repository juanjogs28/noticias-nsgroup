import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "./newsList";

interface RawMeltwaterDocument {
  content: string | { title?: string; summary?: string; image?: string };
  url: string;
  published_date: string;
  source?: { name?: string };
}

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: { name: string };
}

interface PersonalizedNewsResponse {
  success: boolean;
  pais: RawMeltwaterDocument[];
  sector: RawMeltwaterDocument[];
}

function adaptResults(raw: RawMeltwaterDocument[]): Article[] {
  return raw.map((doc) => {
    let title = "Sin título";
    if (typeof doc.content === "object" && doc.content) title = doc.content.title ?? title;

    let description = "";
    if (typeof doc.content === "string") description = doc.content;
    else if (typeof doc.content === "object" && doc.content) description = doc.content.summary || "";

    return {
      title,
      url: doc.url,
      urlToImage: typeof doc.content === "object" && doc.content?.image ? doc.content.image : "",
      description,
      publishedAt: doc.published_date,
      source: { name: doc.source?.name || "Fuente desconocida" },
    };
  });
}

export default function PersonalizedNews() {
  const [paisArticles, setPaisArticles] = useState<Article[]>([]);
  const [sectorArticles, setSectorArticles] = useState<Article[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const fetchNews = async () => {
      try {
        const res = await axios.post<PersonalizedNewsResponse>(
          "http://localhost:3001/api/news/personalized",
          { email }
        );

        setPaisArticles(adaptResults(res.data.pais));
        setSectorArticles(adaptResults(res.data.sector));
      } catch (err) {
        console.error("Error cargando noticias:", err);
        setError(true);
      }
    };

    fetchNews();
  }, []);

  if (error)
    return <p className="text-red-500 text-center py-10">❌ Error al cargar noticias</p>;

  if (!paisArticles.length && !sectorArticles.length)
    return <p className="text-slate-500 text-center py-10">No hay noticias disponibles</p>;

  return (
    <section className="py-12 px-4 space-y-12">
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">🗺 Noticias País</h2>
        <NewsList articles={paisArticles} title="Noticias Nacionales" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">📌 Noticias Sector</h2>
        <NewsList articles={sectorArticles} title="Noticias Sectoriales" />
      </div>
    </section>
  );
}
