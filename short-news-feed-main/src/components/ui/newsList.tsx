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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <a
          key={article.url}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col"
        >
          <div className="h-48 w-full overflow-hidden">
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
            <p className="text-gray-700 flex-1">{article.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              {article.source.name} · {new Date(article.publishedAt).toLocaleDateString()}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
