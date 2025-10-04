import { Button } from "./button";
import { Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  hasMore?: boolean;
  className?: string;
}

export default function LoadMoreButton({ 
  onClick, 
  loading = false, 
  hasMore = true,
  className = ""
}: LoadMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <div className={`flex justify-center mt-6 ${className}`}>
      <Button
        onClick={onClick}
        disabled={loading}
        variant="outline"
        className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cargando más noticias...
          </>
        ) : (
          "Cargar más noticias"
        )}
      </Button>
    </div>
  );
}
