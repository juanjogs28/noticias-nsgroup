// src/api/meltwater.ts

const NEWSAPI_KEY = "ec94a8709e064c53b41012fb8d970c74"
const BASE_URL = "https://newsapi.org/v2/top-headlines"

export async function fetchNewsByCountry(country: string) {
  const url = `${BASE_URL}?country=${country}&apiKey=${NEWSAPI_KEY}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error NewsAPI: ${res.status}`)

  const data = await res.json()
  return data.articles || []
}
export async function fetchNewsByCategory(category: string) {
  const country = typeof window !== "undefined" ? localStorage.getItem("userCountry") || "us" : "us";
  const url = `${BASE_URL}?country=${country}&category=${category}&apiKey=${NEWSAPI_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error NewsAPI: ${res.status}`);

  const data = await res.json();
  return data.articles || [];
}


