// src/components/newsList.tsx
import React from "react";

export default function NewsList({ articles, title }) {
  if (!articles || !articles.length) return <p className="text-gray-500 text-center">No hay artículos para mostrar</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          {article.urlToImage && (
            <img src={article.urlToImage} alt={article.title} className="w-full h-48 object-cover" />
          )}
          <div className="p-4 flex flex-col justify-between h-full">
            <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{article.description}</p>
            <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
              <span>{article.source.name}</span>
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 hover:underline text-sm">Leer más</a>
          </div>
        </div>
      ))}
    </div>
  );
}
