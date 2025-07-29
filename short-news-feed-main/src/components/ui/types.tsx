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
  content:
    | string
    | {
        image?: string
        summary?: string
      }
  published_date: string
  source?: {
    name?: string
  }
}

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
