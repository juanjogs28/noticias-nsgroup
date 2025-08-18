import React from "react";

interface MeltwaterArticle {
  title: string;
  url: string;
  urlToImage: string;
  description: string;
  publishedAt: string;
  source: { name: string };
}

interface Props {
  articles: MeltwaterArticle[];
  title?: string;
}

export default function NewsList({ articles, title }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
      {articles.map((article) => (
        <a
          key={article.url}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group h-full"
        >
          <article className="news-card bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl hover:shadow-black/20 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
            <div className="news-card-image relative w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
              {article.urlToImage ? (
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                  <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              )}
              
              {/* Overlay sutil al hacer hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Badge de fuente */}
              <div className="absolute top-4 left-4 bg-black/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {article.source.name}
              </div>
              
              {/* Indicador de enlace externo */}
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
            
            <div className="news-card-content p-6">
              <div className="news-card-title">
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-red-600 transition-colors duration-300 line-clamp-2">
                  {article.title}
                </h3>
              </div>
              
              <div className="news-card-description">
                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                  {article.description}
                </p>
              </div>
              
              <div className="news-card-footer">
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span className="font-medium text-slate-700">
                      {new Date(article.publishedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(article.publishedAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Botón de acción sutil */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="inline-flex items-center text-sm font-semibold text-red-600 group-hover:text-red-700 transition-colors duration-200 bg-red-50 group-hover:bg-red-100 px-3 py-2 rounded-lg">
                    Leer artículo completo
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </a>
      ))}
    </div>
  );
}
