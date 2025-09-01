import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "../components/ui/newsList";
import SectionSkeleton from "../components/ui/SectionSkeleton";

interface MeltwaterArticle {
  title: string;
  url: string;
  urlToImage: string;
  description: string;
  publishedAt: string;
  source: { name: string };
  engagementScore?: number;
  socialEchoScore?: number;
}

interface NewsResponse {
  success: boolean;
  pais: any[];
  sector: any[];
}

function adaptResults(raw: any[]): MeltwaterArticle[] {
  return raw.map((doc) => ({
    title: doc.content?.title || "Sin título",
    url: doc.url,
    urlToImage: doc.content?.image || "/fallback-image.png",
    description: doc.content?.opening_text || "",
    publishedAt: doc.published_date,
    source: { name: doc.source?.name || "Fuente desconocida" },
    engagementScore: doc.metrics?.engagement?.total ?? 0,
    socialEchoScore: doc.metrics?.social_echo?.total ?? 0,
  }));
}

export default function Index() {
  const [paisArticles, setPaisArticles] = useState<MeltwaterArticle[]>([]);
  const [sectorArticles, setSectorArticles] = useState<MeltwaterArticle[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");
        const countryId = urlParams.get("countryId");
        const sectorId = urlParams.get("sectorId");

        // Si hay parámetros de URL, usarlos directamente
        if (countryId || sectorId) {
          const response = await axios.post<NewsResponse>("http://localhost:3001/api/news/personalized", {
            countryId,
            sectorId
          });
          
          if (response.data.success) {
            setSectorArticles(adaptResults(response.data.sector));
            setPaisArticles(adaptResults(response.data.pais));
          } else {
            setError(true);
          }
          return;
        }

        // Si hay email en URL o localStorage, usarlo
        if (emailParam) localStorage.setItem("userEmail", emailParam);
        const email = emailParam || localStorage.getItem("userEmail");
        
        if (email) {
          const response = await axios.post<NewsResponse>("http://localhost:3001/api/news/personalized", { email });
          if (response.data.success) {
            setSectorArticles(adaptResults(response.data.sector));
            setPaisArticles(adaptResults(response.data.pais));
          } else {
            setError(true);
          }
          return;
        }

        // Si no hay nada, cargar noticias por defecto
        const response = await axios.post<NewsResponse>("http://localhost:3001/api/news/personalized", { 
          email: "default" 
        });
        
        if (response.data.success) {
          setSectorArticles(adaptResults(response.data.sector));
          setPaisArticles(adaptResults(response.data.pais));
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error cargando noticias:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  if (loading) {
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
                Media & Social Dynamics Suite
              </p>
            </div>
          </div>
        </header>

        <main className="container-spacing section-spacing">
          {/* Skeleton para Sector */}
          <SectionSkeleton 
            title="Noticias del Sector"
            showDescription={true}
            articleCount={6}
          />

          {/* Skeleton para País */}
          <SectionSkeleton 
            title="Noticias del País"
            showDescription={true}
            articleCount={6}
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Error al cargar noticias</h2>
          <p className="text-gray-300 mb-6">Intenta recargar la página o verifica tu conexión a internet</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
    
  if (!paisArticles.length && !sectorArticles.length)
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">No hay noticias disponibles</h2>
          <p className="text-gray-300">En este momento no hay contenido disponible para mostrar</p>
        </div>
      </div>
    );

  const paisEngagement = paisArticles.filter((a) => a.engagementScore !== undefined);
  const paisEcoSocial = paisArticles.filter((a) => a.socialEchoScore !== undefined);

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

      {/* Header Dashboard */}
      <header className="dashboard-header">
        <div className="dashboard-container">
          <h1 className="dashboard-title">
            NEWSROOM
          </h1>
          <p className="dashboard-subtitle">
            Media & Social Dynamics Suite
          </p>
        </div>
      </header>

      <main className="dashboard-container">
        {/* Sección de Métricas */}
        <div className="metrics-section">
          <h2 className="metrics-title">Métricas de Engagement</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="metric-value">1,597</div>
              <div className="metric-label">Personas Participando</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="metric-value">342</div>
              <div className="metric-label">Comentarios</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="metric-value">89</div>
              <div className="metric-label">Alto Engagement</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="metric-value">273</div>
              <div className="metric-label">Medios Monitoreados</div>
            </div>
          </div>
        </div>
        {/* TOP 5 Temas - Sector */}
        {sectorArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">TOP 5 Temas - Sector</h2>
                <p className="section-description">
                  Información especializada y análisis del sector empresarial
                </p>
              </div>
            </div>
            <NewsList articles={sectorArticles.slice(0, 5)} title="Noticias Sectoriales" />
          </div>
        )}

        {/* TOP 5 Temas - Chile */}
        {paisArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">TOP 5 Temas - Chile</h2>
                <p className="section-description">
                  Análisis y reportes de la situación económica y empresarial nacional
                </p>
              </div>
            </div>
            <NewsList articles={paisArticles.slice(0, 5)} title="Noticias del País" />
            </div>
          )}

        {/* Últimas Notas Relacionadas */}
        {(paisEngagement.length > 0 || paisEcoSocial.length > 0) && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            <div>
                <h2 className="section-title-dashboard">Últimas Notas Relacionadas</h2>
                <p className="section-description">
                  Son las notas relacionadas a la entidad monitoreada que pueden convertirse en HOT NEWS dependiendo la "aceleración" que tome la conversación de la gente
                </p>
              </div>
            </div>
            <div className="news-grid-dashboard">
              {[...paisEngagement, ...paisEcoSocial].slice(0, 6).map((article, index) => (
                <a
                  key={`${article.url}-${index}`}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card-dashboard"
                >
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="news-image-dashboard"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="news-content-dashboard">
                    <h3 className="news-title-dashboard">{article.title}</h3>
                    <p className="news-description-dashboard">{article.description}</p>
                    <div className="news-meta-dashboard">
                      <span className="news-source-dashboard">{article.source.name}</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString('es-ES')}</span>
                    </div>
                    {index < 2 && <span className="news-tag">Política</span>}
                  </div>
                </a>
              ))}
            </div>
            </div>
          )}
      </main>
    </div>
  );
}
