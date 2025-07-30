import { Article } from "./types"

export default function NewsList({ articles, title }: { articles: Article[]; title: string }) {
  if (articles.length === 0) {
    return <p className="text-slate-500 italic">No hay noticias disponibles sobre {title}.</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 border border-slate-200"
        >
          {article.urlToImage && (
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-48 object-cover rounded-t-xl"
            />
          )}
          <div className="p-4 space-y-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-blue-700 hover:underline"
            >
              {article.title}
            </a>

            {/* Descripción opcional */}
            {/* {article.description && (
              <p className="text-sm text-slate-600">{article.description}</p>
            )} */}

            <div className="text-xs text-slate-500">
              {article.source.name} • {new Date(article.publishedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
