import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "../components/ui/newsList";

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando noticias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">❌ Error cargando noticias</p>
          <p className="text-gray-600">Intenta recargar la página o verifica tu conexión</p>
        </div>
      </div>
    );
  }
    
  if (!paisArticles.length && !sectorArticles.length)
    return (
      <p className="text-slate-500 text-center py-10">
        No hay noticias disponibles
      </p>
    );

  const paisEngagement = paisArticles.filter((a) => a.engagementScore !== undefined);
  const paisEcoSocial = paisArticles.filter((a) => a.socialEchoScore !== undefined);

  return (
    <div
      className="min-h-screen bg-gray-100"
      style={{
        backgroundImage: "url('/textures/texture-light.png')",
        backgroundRepeat: "repeat",
      }}
    >
      {/* Header */}
      <header className="bg-indigo-600 text-white py-6 shadow-md">
        <h1 className="text-3xl font-bold text-center">Noticias Personalizadas</h1>
        <p className="text-center mt-1 text-indigo-200">Tus noticias de sector y país</p>
      </header>

      <main className="py-12 px-4 space-y-12 max-w-6xl mx-auto">
        {/* Sector */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">📌 Noticias Sector</h2>
          <NewsList articles={sectorArticles} title="Noticias Sectoriales" />
        </section>

        {/* País */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-center">🗺 Noticias País</h2>

          {/* Engagement */}
          {paisEngagement.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-medium mb-4">🔥 Engagement</h3>
              <NewsList articles={paisEngagement} title="Engagement" />
            </div>
          )}

          {/* EcoSocial */}
          {paisEcoSocial.length > 0 && (
            <div>
              <h3 className="text-xl font-medium mb-4">🌱 EcoSocial</h3>
              <NewsList articles={paisEcoSocial} title="EcoSocial" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
