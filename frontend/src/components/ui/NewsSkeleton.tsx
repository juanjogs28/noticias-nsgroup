import React from "react";

interface NewsSkeletonProps {
  count?: number;
}

export default function NewsSkeleton({ count = 10 }: NewsSkeletonProps) {
  return (
    <div className="news-grid-dashboard">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden animate-pulse"
        >
          {/* Skeleton de imagen */}
          <div className="h-56 w-full bg-gradient-to-br from-slate-200 to-slate-300 relative">
            {/* Badge skeleton */}
            <div className="absolute top-4 left-4 w-20 h-6 bg-slate-300 rounded-full"></div>
          </div>
          
          {/* Skeleton de contenido */}
          <div className="p-6 space-y-4">
            {/* Título skeleton */}
            <div className="space-y-2">
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
            </div>
            
            {/* Descripción skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
            </div>
            
            {/* Footer skeleton */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
            
            {/* Botón skeleton */}
            <div className="h-4 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
