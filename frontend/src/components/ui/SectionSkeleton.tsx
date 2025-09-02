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
  articleCount = 6 
}: SectionSkeletonProps) {
  return (
    <section className="animate-fadeIn">
      <div className="text-center mb-16">
        {/* Header skeleton */}
        <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-8 py-4 mb-8">
          <div className="w-10 h-10 bg-slate-300 rounded-full mr-4 animate-pulse"></div>
          <div className="h-8 bg-slate-300 rounded w-64 animate-pulse"></div>
        </div>
        
        {/* Descripción skeleton */}
        {showDescription && (
          <div className="space-y-2 mb-8">
            <div className="h-5 bg-slate-300 rounded w-96 mx-auto animate-pulse"></div>
            <div className="h-5 bg-slate-300 rounded w-80 mx-auto animate-pulse"></div>
          </div>
        )}
      </div>
      
      {/* Noticias skeleton */}
      <NewsSkeleton count={articleCount} />
    </section>
  );
}
