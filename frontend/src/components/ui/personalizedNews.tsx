import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "./newsList";
import SectionSkeleton from "./SectionSkeleton";

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
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Error al cargar noticias</h2>
          <p className="text-gray-300">Hubo un problema al cargar tu contenido personalizado</p>
        </div>
      </div>
    );

  if (!ecosocialArticles.length && !engagementArticles.length && !sectorArticles.length)
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">No hay noticias disponibles</h2>
          <p className="text-gray-300">En este momento no hay contenido personalizado para mostrar</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen tech-background network-pattern">
      {/* Partículas flotantes */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Header tecnológico */}
      <header className="tech-header">
        <div className="container-spacing section-spacing relative z-10">
          <div className="text-center">
            <h1 className="tech-title text-5xl mb-4">
              NEWSROOM
            </h1>
            <p className="tech-subtitle text-xl mb-4">
              Contenido Personalizado
            </p>
            <div className="text-sm text-gray-400 font-mono">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="container-spacing section-spacing space-y-16">
        {/* Sección de Sector */}
        {sectorArticles.length > 0 && (
          <section>
            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-6 py-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">NOTICIAS DEL SECTOR</h2>
              </div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Información especializada y análisis del sector empresarial
              </p>
            </div>
            <NewsList articles={sectorArticles} title="Noticias Sectoriales" />
          </section>
        )}

        {/* Sección de País - Ecosocial */}
        {ecosocialArticles.length > 0 && (
          <section>
            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-6 py-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">IMPACTO SOCIAL</h2>
              </div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Análisis y reportes de la situación económica y empresarial nacional
              </p>
            </div>
            <NewsList articles={ecosocialArticles} title="Impacto Social" />
          </section>
        )}

        {/* Sección de País - Engagement */}
        {engagementArticles.length > 0 && (
          <section>
            <div className="text-center mb-12 relative z-10">
              <div className="inline-flex items-center bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg px-6 py-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">ALTO ENGAGEMENT</h2>
              </div>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Contenido con mayor impacto y participación de la audiencia
              </p>
            </div>
            <NewsList articles={engagementArticles} title="Alto Engagement" />
          </section>
        )}
      </main>
    </div>
  );
}
