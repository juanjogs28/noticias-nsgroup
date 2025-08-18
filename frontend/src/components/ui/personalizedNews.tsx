import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "./newsList";

interface RawMeltwaterDocument {
  content: string | { title?: string; summary?: string; image?: string };
  url: string;
  published_date: string;
  source?: { name?: string };
  metrics?: {
    engagement?: { total?: number | null };
  };
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

// Convierte los documentos raw a objetos Article
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
  const [ecosocialArticles, setEcosocialArticles] = useState<Article[]>([]);
  const [engagementArticles, setEngagementArticles] = useState<Article[]>([]);
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

        // Separar país en ecosocial y engagement
        const paisRaw = res.data.pais || [];
        const paisArticles = adaptResults(paisRaw);

        const ecosocial: Article[] = [];
        const engagement: Article[] = [];

        paisRaw.forEach((doc, idx) => {
          if (doc.metrics?.engagement?.total && doc.metrics.engagement.total > 0) {
            engagement.push(paisArticles[idx]);
          } else {
            ecosocial.push(paisArticles[idx]);
          }
        });

        setEcosocialArticles(ecosocial);
        setEngagementArticles(engagement);

        // Sector
        setSectorArticles(adaptResults(res.data.sector || []));
      } catch (err) {
        console.error("Error cargando noticias:", err);
        setError(true);
      }
    };

    fetchNews();
  }, []);

  if (error)
    return <p className="text-red-500 text-center py-10">❌ Error al cargar noticias</p>;

  if (!ecosocialArticles.length && !engagementArticles.length && !sectorArticles.length)
    return <p className="text-slate-500 text-center py-10">No hay noticias disponibles</p>;

  return (
    <section className="py-12 px-4 space-y-12">
      {ecosocialArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center">🌱 Noticias País - Ecosocial</h2>
          <NewsList articles={ecosocialArticles} title="Ecosocial" />
        </div>
      )}

      {engagementArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center">🔥 Noticias País - Engagement</h2>
          <NewsList articles={engagementArticles} title="Engagement" />
        </div>
      )}

      {sectorArticles.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-center">📌 Noticias Sector</h2>
          <NewsList articles={sectorArticles} title="Noticias Sectoriales" />
        </div>
      )}
    </section>
  );
}
