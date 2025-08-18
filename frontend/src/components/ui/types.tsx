// src/types.ts

export interface Article {
  title: string
  url: string
  urlToImage?: string
  description?: string
  publishedAt: string
  source: {
    name: string
  }
}
// src/types.ts

export interface RawMeltwaterDocument {
  title: string | null
  url: string
  content?: {
     title?: string;       // <-- agregalo acá
    opening_text?: string; // si quieres
    image?: string
    summary?: string
  } | string | null
  published_date: string
  source?: {
    name?: string
  }
}



