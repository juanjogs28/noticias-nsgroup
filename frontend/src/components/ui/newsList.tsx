import React from "react";

interface MeltwaterArticle {
  title: string;
  url: string;
  urlToImage: string;
  description: string;
  publishedAt: string;
  source: { name: string };
  engagementScore?: number;
  contentScore?: number;
}

interface Props {
  articles: MeltwaterArticle[];
  title?: string;
}

export default function NewsList({ articles, title }: Props) {
  return (
    <div className="news-grid-dashboard">
      {articles.map((article) => (
        <a
          key={article.url}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-card-dashboard"
        >
          <img
            src={article.urlToImage || '/placeholder.svg'}
            alt={article.title}
            className="news-image-dashboard"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          <div className="news-content-dashboard">
            <h3 className="news-title-dashboard">{article.title}</h3>
            <p className="news-description-dashboard">{article.description}</p>
            <div className="news-meta-dashboard">
              <span className="news-source-dashboard">{article.source.name}</span>
              <span>{new Date(article.publishedAt).toLocaleDateString('es-ES')}</span>
              {/* {article.contentScore && (
                <span className="news-score">
                  Score: {(article.contentScore * 100).toFixed(0)}%
                </span>
              )} */}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
