import React from "react";
import NewsSkeleton from "./NewsSkeleton";

interface SectionSkeletonProps {
  title?: string;
  showDescription?: boolean;
  articleCount?: number;
}

export default function SectionSkeleton({ 
  title = "Cargando...", 
  showDescription = true, 
  articleCount = 10 
}: SectionSkeletonProps) {
  return (
    <section className="news-section animate-fadeIn">
      <div className="section-header-dashboard">
        <div className="section-icon-dashboard">
          <div className="w-6 h-6 bg-slate-300 rounded animate-pulse"></div>
        </div>
        <div>
          <div className="h-8 bg-slate-300 rounded w-64 mb-2 animate-pulse"></div>
          {showDescription && (
            <div className="space-y-2">
              <div className="h-4 bg-slate-300 rounded w-96 animate-pulse"></div>
              <div className="h-4 bg-slate-300 rounded w-80 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Noticias skeleton */}
      <NewsSkeleton count={articleCount} />
    </section>
  );
}
