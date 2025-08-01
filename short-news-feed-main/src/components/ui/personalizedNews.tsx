import { useEffect, useState } from "react"
import { fetchPersonalizedNews } from "@/api/meltwater"
import { Article, RawMeltwaterDocument } from "./types"
import NewsList from "./newsList"
import { Pyramid } from "lucide-react";


const countryNames: Record<string, string> = {
  uy: "Uruguay",
  ar: "Argentina",
  py: "Paraguay",
  ec: "Ecuador",
  cl: "Chile",
  pa: "Panamá",
  mx: "México",
  pe: "Perú",
};

const sectorNames: Record<string, string> = {
  health: "Salud",
  general: "Actualidad",
  sports: "Deportes",
  economy: "Economía",
  politics: "Política",
};


export default function PersonalizedNews() {
  const [userCountry, setUserCountry] = useState("uruguay");
  const [userSector, setUserSector] = useState("deportes");
  const [countryArticles, setCountryArticles] = useState<Article[]>([])
  const [sectorArticles, setSectorArticles] = useState<Article[]>([])
  const [error, setError] = useState(false)
  

function adaptResults(raw: RawMeltwaterDocument[]): Article[] {
  return raw.map((doc) => {
    let title = "Sin título";
    
    if (typeof doc.content === "object" && doc.content !== null) {
      title = doc.content.title ?? title;
    }

    let description = "";
    if (typeof doc.content === "string") {
      description = doc.content;
    } else if (typeof doc.content === "object" && doc.content !== null) {
      description = doc.content.summary || "";
    }

    return {
      title,
      url: doc.url,
      urlToImage:
        typeof doc.content === "object" && doc.content !== null
          ? doc.content.image ?? ""
          : "",
      description,
      publishedAt: doc.published_date,
      source: { name: doc.source?.name || "Fuente desconocida" },
    };
  });
}


useEffect(() => {
  const country = localStorage.getItem("userCountry") || "uruguay";
  const sector = localStorage.getItem("userSector") || "tecnología";

  setUserCountry(country);
  setUserSector(sector);

  fetchPersonalizedNews(country, "general")
    .then(res => setCountryArticles(adaptResults(res.data)))
    .catch(err => {
      console.error("Error cargando noticias del país:", err);
      setError(true);
    });

  fetchPersonalizedNews(country, sector)
    .then(res => setSectorArticles(adaptResults(res.data)))
    .catch(err => {
      console.error("Error cargando noticias del sector:", err);
      setError(true);
    });
}, []);


  if (error) {
    return <p className="text-red-500 text-center">❌ Error al cargar noticias</p>
  }

  if (countryArticles.length === 0 && sectorArticles.length === 0) {
    return <p className="text-slate-500 text-center">No hay noticias disponibles</p>
  }

  return (
    <section className="py-12 px-4 space-y-12">
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">🗺 Noticias de {countryNames[userCountry]??userCountry}</h2>
        <NewsList articles={countryArticles} title="noticias nacionales" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">📌 Noticias de {sectorNames[userSector]??userSector} </h2>
        <NewsList articles={sectorArticles} title="noticias sectoriales" />
      </div>
    </section>
  )
}
