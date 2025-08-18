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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Fondo con patrón sutil */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Header estilo periódico */}
        <header className="relative bg-black border-b-4 border-red-600 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center">
              <h1 className="text-6xl font-black text-white mb-4 tracking-wider font-serif">
                NEWSROOM
              </h1>
              
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
                Información relevante y actualizada de tu sector y región, seleccionada especialmente para ti
              </p>
              
              {/* Fecha actual */}
              <div className="mt-6 text-sm text-slate-400 font-mono">
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

        <main className="relative max-w-7xl mx-auto px-6 py-20 space-y-24">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-900/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Error al cargar noticias</h2>
          <p className="text-slate-300 mb-6">Intenta recargar la página o verifica tu conexión a internet</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
    
  if (!paisArticles.length && !sectorArticles.length)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-slate-700/50 border border-slate-600/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">No hay noticias disponibles</h2>
          <p className="text-slate-300">En este momento no hay contenido disponible para mostrar</p>
        </div>
      </div>
    );

  const paisEngagement = paisArticles.filter((a) => a.engagementScore !== undefined);
  const paisEcoSocial = paisArticles.filter((a) => a.socialEchoScore !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Fondo con patrón sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header estilo periódico */}
      <header className="relative bg-black border-b-4 border-red-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
           
            <h1 className="text-6xl font-black text-white mb-4 tracking-wider font-serif">
              NEWSROOM
            </h1>
            
        
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
              Información relevante y actualizada de tu sector y región, seleccionada especialmente para ti
            </p>
            
            {/* Fecha actual */}
            <div className="mt-6 text-sm text-slate-400 font-mono">
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

      <main className="relative max-w-7xl mx-auto px-6 py-20 space-y-24">
        {/* Sección de Sector */}
        {sectorArticles.length > 0 && (
          <section>
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-8 py-4 mb-8">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-white">NOTICIAS DEL SECTOR</h2>
              </div>
              <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                Información especializada y análisis del sector empresarial
              </p>
            </div>
            <NewsList articles={sectorArticles} title="Noticias Sectoriales" />
          </section>
        )}

        {/* Sección de País */}
        {paisArticles.length > 0 && (
          <section>
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-8 py-4 mb-8">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-white">NOTICIAS DEL PAÍS</h2>
              </div>
              <p className="text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
                Análisis y reportes de la situación económica y empresarial nacional
              </p>
            </div>

            {/* Engagement */}
            {paisEngagement.length > 0 && (
              <div className="mb-20">
                <div className="flex items-center justify-center mb-12">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-6">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white">ALTO ENGAGEMENT</h3>
                </div>
                <NewsList articles={paisEngagement} title="Engagement" />
              </div>
            )}

            {/* EcoSocial */}
            {paisEcoSocial.length > 0 && (
              <div>
                <div className="flex items-center justify-center mb-12">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mr-6">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white">IMPACTO SOCIAL</h3>
                </div>
                <NewsList articles={paisEcoSocial} title="EcoSocial" />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
