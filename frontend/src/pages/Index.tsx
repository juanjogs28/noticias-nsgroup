import { useEffect, useState } from "react";
import axios from "axios";
import NewsList from "../components/ui/newsList";
import WordCloud, { WordFrequency } from "../components/ui/WordCloud";
import SectionSkeleton from "../components/ui/SectionSkeleton";
import { buildApiUrl, API_CONFIG } from "../config/api";

interface MeltwaterArticle {
  title: string;
  url: string;
  urlToImage: string;
  description: string;
  publishedAt: string;
  source: {
    name: string;
    metrics?: {
      reach: number;
      ave: number;
    };
  };
  engagementScore?: number;
  socialEchoScore?: number;
  contentScore?: number;
  location?: {
    country_code: string;
  };
  enrichments?: {
    sentiment: string;
    keyphrases: string[];
  };
  metrics?: {
    views: number;
  };
}

interface NewsResponse {
  success: boolean;
  pais: any[];
  sector: any[];
}

function adaptResults(raw: any[]): MeltwaterArticle[] {
  console.log('🔧 adaptResults - Datos de entrada:', raw);
  
  const adapted = raw.map((doc, index) => {
    // Generar título basado en el tipo de contenido
    const isSocial = doc.content_type === "social post";
    const originalSocialTitle = isSocial 
      ? (doc.content?.title || doc.content?.text || doc.content?.message || doc.content?.caption || doc.content?.headline || doc.title)
      : undefined;
    let title = originalSocialTitle || doc.content?.title;
    if (!title) {
      if (isSocial) {
        // Para posts de redes sociales, usar keyphrases o un título genérico
        if (doc.enrichments?.keyphrases && doc.enrichments.keyphrases.length > 0) {
          title = `Post sobre: ${doc.enrichments.keyphrases.slice(0, 2).join(", ")}`;
        } else {
          title = `Post de ${doc.source?.name || "red social"}`;
        }
      } else {
        title = "Sin título";
      }
    }
    // Normalizar longitud para UI
    if (title && typeof title === 'string') {
      title = title.replace(/\s+/g, ' ').trim();
      if (title.length > 140) title = title.slice(0, 137) + '…';
    }

    // Generar descripción basada en el tipo de contenido
    let description = doc.content?.opening_text || doc.content?.description || (isSocial ? (doc.content?.text || doc.content?.message || doc.content?.caption) : undefined);
    if (!description) {
      if (doc.content_type === "social post") {
        // Para posts de redes sociales, usar keyphrases como descripción
        if (doc.enrichments?.keyphrases && doc.enrichments.keyphrases.length > 0) {
          description = `Temas: ${doc.enrichments.keyphrases.join(", ")}`;
        } else {
          description = `Contenido de ${doc.source?.name || "red social"}`;
        }
      } else {
        description = "";
      }
    }
    if (description && typeof description === 'string') {
      description = description.replace(/\s+/g, ' ').trim();
      if (description.length > 200) description = description.slice(0, 197) + '…';
    }

    // Generar URL si no existe (para posts de redes sociales)
    let url = doc.url;
    if (!url && doc.content_type === "social post") {
      // Crear una URL ficticia basada en el external_id o id
      const postId = doc.external_id || doc.id;
      if (postId) {
        url = `https://twitter.com/i/web/status/${postId}`;
      } else {
        url = "#";
      }
    }

    const adaptedDoc = {
      title,
      url: url || "#",
      urlToImage: doc.content?.image || "/placeholder.svg",
      description,
      publishedAt: doc.published_date,
      source: {
        name: doc.source?.name || "Fuente desconocida",
        metrics: doc.source?.metrics ? {
          reach: doc.source.metrics.reach || 0,
          ave: doc.source.metrics.ave || 0
        } : undefined
      },
      engagementScore: doc.metrics?.engagement?.total ?? 
        (doc.metrics?.engagement ? 
          (doc.metrics.engagement.likes || 0) + 
          (doc.metrics.engagement.replies || 0) + 
          (doc.metrics.engagement.reposts || 0) + 
          (doc.metrics.engagement.shares || 0) + 
          (doc.metrics.engagement.comments || 0) + 
          (doc.metrics.engagement.quotes || 0) + 
          (doc.metrics.engagement.reactions || 0) : 0),
      socialEchoScore: doc.metrics?.social_echo?.total ?? 
        (doc.metrics?.social_echo ? 
          (doc.metrics.social_echo.x || 0) + 
          (doc.metrics.social_echo.facebook || 0) + 
          (doc.metrics.social_echo.reddit || 0) : 0),
      location: doc.location ? {
        country_code: doc.location.country_code
      } : undefined,
      enrichments: doc.enrichments ? {
        sentiment: doc.enrichments.sentiment || 'neutral',
        keyphrases: doc.enrichments.keyphrases || []
      } : undefined,
      metrics: doc.metrics ? {
        views: doc.metrics.views || 0
      } : undefined,
    };
    
    // Log detallado de cada documento adaptado
    console.log(`📄 Documento ${index + 1} adaptado:`, {
      original: doc,
      adapted: adaptedDoc
    });
    
    return adaptedDoc;
  });
  
  console.log('🔧 adaptResults - Resultado final:', adapted);
  return adapted;
}

// Funciones auxiliares para normalización
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5; // Evitar división por cero
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Función para calcular el ContentScore compuesto
function calculateContentScore(article: MeltwaterArticle, allArticles: MeltwaterArticle[]): number {
  // Extraer métricas del artículo
  const reach = article.source?.metrics?.reach || 0;
  const engagement = article.engagementScore || 0;
  const ave = article.source?.metrics?.ave || 0;
  const views = article.metrics?.views || (engagement * 1.5); // Usar views reales si están disponibles

  // Calcular valores mínimos y máximos de todas las noticias para normalización
  const allReach = allArticles.map(a => a.source?.metrics?.reach || 0).filter(r => r > 0);
  const allEngagement = allArticles.map(a => a.engagementScore || 0).filter(e => e > 0);
  const allAve = allArticles.map(a => a.source?.metrics?.ave || 0).filter(a => a > 0);
  const allViews = allArticles.map(a => a.metrics?.views || (a.engagementScore || 0) * 1.5).filter(v => v > 0);

  const minReach = Math.min(...allReach, 0);
  const maxReach = Math.max(...allReach, 1);
  const minEngagement = Math.min(...allEngagement, 0);
  const maxEngagement = Math.max(...allEngagement, 1);
  const minAve = Math.min(...allAve, 0);
  const maxAve = Math.max(...allAve, 1);
  const minViews = Math.min(...allViews, 0);
  const maxViews = Math.max(...allViews, 1);

  // Normalizar valores
  const reachNorm = normalizeValue(reach, minReach, maxReach);
  const engagementNorm = normalizeValue(engagement, minEngagement, maxEngagement);
  const aveNorm = normalizeValue(ave, minAve, maxAve);
  const viewsNorm = normalizeValue(views, minViews, maxViews);

  // Pesos ajustables según estrategia
  // Estrategia: 40% Visibilidad (Reach), 30% Engagement, 20% Impacto (AVE), 10% Views
  const w1 = 0.4; // Reach - Visibilidad
  const w2 = 0.3; // Engagement - Relevancia para usuario
  const w3 = 0.2; // AVE - Impacto mediático
  const w4 = 0.1; // Views - Consumo real

  // Calcular ContentScore compuesto
  const contentScore = w1 * reachNorm + w2 * engagementNorm + w3 * aveNorm + w4 * viewsNorm;

  // Logs de debug removidos para limpiar la consola

  return contentScore;
}

// Función para ordenar artículos por ContentScore
function sortArticlesByContentScore(articles: MeltwaterArticle[]): MeltwaterArticle[] {
  const sortedArticles = [...articles].sort((a, b) => {
    const scoreA = calculateContentScore(a, articles);
    const scoreB = calculateContentScore(b, articles);
    return scoreB - scoreA; // Orden descendente (mayor score primero)
  });

  return sortedArticles;
}

// Función específica para ordenar artículos del país por socialEchoScore con fallback a engagement
function sortPaisArticlesBySocialEcho(articles: MeltwaterArticle[]): MeltwaterArticle[] {
  const sortedArticles = [...articles].sort((a, b) => {
    // Priorizar socialEchoScore si está disponible
    const socialEchoA = a.socialEchoScore || 0;
    const socialEchoB = b.socialEchoScore || 0;
    
    // Si ambos tienen socialEchoScore, ordenar por ese valor
    if (socialEchoA > 0 && socialEchoB > 0) {
      return socialEchoB - socialEchoA;
    }
    
    // Si solo uno tiene socialEchoScore, priorizarlo
    if (socialEchoA > 0 && socialEchoB === 0) {
      return -1;
    }
    if (socialEchoA === 0 && socialEchoB > 0) {
      return 1;
    }
    
    // Si ninguno tiene socialEchoScore, usar engagement como fallback
    const engagementA = a.engagementScore || 0;
    const engagementB = b.engagementScore || 0;
    return engagementB - engagementA;
  });

  return sortedArticles;
}

// Función para asignar ContentScore a cada artículo
function assignContentScores(articles: MeltwaterArticle[]): MeltwaterArticle[] {
  return articles.map(article => ({
    ...article,
    contentScore: calculateContentScore(article, articles)
  }));
}

// Función para generar un identificador único para cada artículo
function generateArticleId(article: MeltwaterArticle): string {
  // Usar URL como ID principal, si no está disponible usar título + fuente
  if (article.url && article.url !== '#') {
    return article.url;
  }
  return `${article.source?.name || 'unknown'}_${article.title}`.replace(/\s+/g, '_').toLowerCase();
}

// Normaliza el título para comparar artículos equivalentes entre fuentes distintas
function normalizeTitleForKey(title: string | undefined): string {
  if (!title) return '';
  // quitar acentos
  const noAccents = title.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
  return noAccents
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '') // quitar URLs
    .replace(/[#@][\w-]+/g, ' ') // quitar hashtags y menciones
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // quitar emojis
    .replace(/\([^)]*\)/g, ' ') // quitar paréntesis y contenido
    .replace(/[^a-z0-9\s]/g, ' ') // quitar signos/puntuación
    .replace(/\s+/g, ' ') // colapsar espacios
    .trim();
}

// Canonicaliza URL: sin protocolo, sin www, sin query/fragment y sin slash final
function canonicalizeUrl(rawUrl: string | undefined): string {
  if (!rawUrl || rawUrl === '#') return '';
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.replace(/\/$/, '');
    return `${host}${path}`;
  } catch {
    return rawUrl.toLowerCase();
  }
}

// Normaliza descripción para key adicional
function normalizeDescription(desc: string | undefined): string {
  if (!desc) return '';
  const noAccents = desc.normalize('NFD').replace(/\p{Diacritic}+/gu, '');
  return noAccents
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140); // limitar para claves estables
}

// Función para filtrar artículos duplicados
function filterUniqueArticles(articles: MeltwaterArticle[], shownArticles: Set<string>): MeltwaterArticle[] {
  const uniqueArticles: MeltwaterArticle[] = [];
  const newShownArticles = new Set<string>();

  for (const article of articles) {
    const articleId = generateArticleId(article);
    const canonicalUrlKey = canonicalizeUrl(article.url);
    const titleKey = normalizeTitleForKey(article.title);
    const descKey = normalizeDescription(article.description);
    const seenById = shownArticles.has(`id:${articleId}`) || newShownArticles.has(`id:${articleId}`);
    const seenByCanonical = canonicalUrlKey !== '' && (shownArticles.has(`url:${canonicalUrlKey}`) || newShownArticles.has(`url:${canonicalUrlKey}`));
    const seenByTitle = titleKey !== '' && (shownArticles.has(`title:${titleKey}`) || newShownArticles.has(`title:${titleKey}`));
    const seenByDesc = descKey !== '' && (shownArticles.has(`desc:${descKey}`) || newShownArticles.has(`desc:${descKey}`));

    // Si el artículo ya fue mostrado, lo saltamos
    if (seenById || seenByCanonical || seenByTitle || seenByDesc) {
      continue;
    }

    // Si es un artículo nuevo, lo agregamos
      uniqueArticles.push(article);
    newShownArticles.add(`id:${articleId}`);
    if (canonicalUrlKey) newShownArticles.add(`url:${canonicalUrlKey}`);
    if (titleKey) newShownArticles.add(`title:${titleKey}`);
    if (descKey) newShownArticles.add(`desc:${descKey}`);
  }

  return uniqueArticles;
}

// Marca artículos como mostrados en un Set con claves por id y por título normalizado
function markShown(shown: Set<string>, articles: MeltwaterArticle[]): void {
  for (const article of articles) {
    const id = generateArticleId(article);
    const canonicalUrlKey = canonicalizeUrl(article.url);
    const titleKey = normalizeTitleForKey(article.title);
    const descKey = normalizeDescription(article.description);
    shown.add(`id:${id}`);
    if (canonicalUrlKey) shown.add(`url:${canonicalUrlKey}`);
    if (titleKey) shown.add(`title:${titleKey}`);
    if (descKey) shown.add(`desc:${descKey}`);
  }
}

// Función para obtener artículos únicos ordenados por ContentScore
function getUniqueTopArticles(articles: MeltwaterArticle[], shownArticles: Set<string>, limit: number = 50): MeltwaterArticle[] {
  // Primero ordenar por ContentScore
  const sortedArticles = sortArticlesByContentScore(articles);

  // Luego filtrar duplicados
  const uniqueArticles = filterUniqueArticles(sortedArticles, shownArticles);

  // Tomar el límite solicitado
  const result = uniqueArticles.slice(0, limit);

  return assignContentScores(result);
}

// Función específica para obtener artículos del país ordenados por socialEchoScore
function getUniqueTopPaisArticles(articles: MeltwaterArticle[], shownArticles: Set<string>, limit: number = 50): MeltwaterArticle[] {
  console.log('🔍 DEBUG getUniqueTopPaisArticles - INICIANDO FUNCIÓN');
  console.log('  Total artículos de entrada:', articles.length);
  console.log('  Artículos ya mostrados:', shownArticles.size);
  
  // TEMPORAL: Incluir TODOS los artículos del país (medios + redes) para llegar a 50
  const filteredArticles = articles;
  
  console.log('  Artículos después de filtrar redes sociales:', filteredArticles.length);

  // Separar artículos con y sin socialEchoScore
  const articlesWithSocialEcho = filteredArticles.filter(article => (article.socialEchoScore || 0) > 0);
  const articlesWithoutSocialEcho = filteredArticles.filter(article => (article.socialEchoScore || 0) === 0);
  
  console.log('  Artículos con SocialEcho:', articlesWithSocialEcho.length);
  console.log('  Artículos sin SocialEcho:', articlesWithoutSocialEcho.length);

  // Ordenar cada grupo por su métrica correspondiente
  const sortedWithSocialEcho = sortPaisArticlesBySocialEcho(articlesWithSocialEcho);
  const sortedWithoutSocialEcho = articlesWithoutSocialEcho.sort((a, b) => {
    const engagementA = a.engagementScore || 0;
    const engagementB = b.engagementScore || 0;
    return engagementB - engagementA;
  });

  // Combinar: primero los que tienen socialEchoScore, luego los de engagement
  const combinedArticles = [...sortedWithSocialEcho, ...sortedWithoutSocialEcho];
  
  console.log('  Artículos combinados:', combinedArticles.length);

  // Filtrar duplicados
  const uniqueArticles = filterUniqueArticles(combinedArticles, shownArticles);
  
  console.log('  Artículos únicos después de filtrar duplicados:', uniqueArticles.length);

  // Tomar el límite solicitado
  let result = uniqueArticles.slice(0, limit);
  
  console.log('  Resultado final antes de rellenar:', result.length);

  // Rellenar si faltan elementos: primero engagement, luego ContentScore (manteniendo exclusión de redes sociales)
  if (result.length < limit) {
    const selectedIds = new Set(result.map(a => generateArticleId(a)));

    // Candidatos por engagement dentro de fuentes no sociales
    const engagementCandidates = [...articlesWithoutSocialEcho]
      .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));

    for (const candidate of engagementCandidates) {
      if (result.length >= limit) break;
      const id = generateArticleId(candidate);
      if (!selectedIds.has(id) && !shownArticles.has(id)) {
        result.push(candidate);
        selectedIds.add(id);
      }
    }

    // Si aún faltan, usar ContentScore de TODOS los artículos (misma métrica que sector)
    if (result.length < limit) {
      const allNonSocialArticles = articles;
      
      // Usar la misma lógica de ContentScore que el sector
      const contentScoreCandidates = allNonSocialArticles
        .sort((a, b) => {
          const scoreA = calculateContentScore(a, allNonSocialArticles);
          const scoreB = calculateContentScore(b, allNonSocialArticles);
          return scoreB - scoreA;
        });

      for (const candidate of contentScoreCandidates) {
        if (result.length >= limit) break;
        const id = generateArticleId(candidate);
        if (!selectedIds.has(id) && !shownArticles.has(id)) {
          result.push(candidate);
          selectedIds.add(id);
        }
      }
    }

    // Si aún faltan, usar CUALQUIER artículo por ContentScore (incluyendo duplicados si es necesario)
    if (result.length < limit) {
      const allNonSocialArticles = articles;
      
      const contentScoreCandidates = allNonSocialArticles
        .sort((a, b) => {
          const scoreA = calculateContentScore(a, allNonSocialArticles);
          const scoreB = calculateContentScore(b, allNonSocialArticles);
          return scoreB - scoreA;
        });

      for (const candidate of contentScoreCandidates) {
        if (result.length >= limit) break;
        const id = generateArticleId(candidate);
        if (!selectedIds.has(id)) {
          result.push(candidate);
          selectedIds.add(id);
        }
      }
    }

    // Como último recurso, permitir candidatos ya mostrados para no dejar huecos
    if (result.length < limit) {
      for (const candidate of engagementCandidates) {
        if (result.length >= limit) break;
        const id = generateArticleId(candidate);
        if (!selectedIds.has(id)) {
          result.push(candidate);
          selectedIds.add(id);
        }
      }
    }
  }

  console.log('  🎯 RESULTADO FINAL getUniqueTopPaisArticles:', result.length);
  result.forEach((article, index) => {
    console.log(`    ${index + 1}. ${article.title} | Fuente: ${article.source.name} | SocialEcho: ${article.socialEchoScore} | Engagement: ${article.engagementScore}`);
  });

  return assignContentScores(result);
}

// Función específica para obtener artículos de redes sociales ordenados por engagement
function getUniqueSocialMediaArticles(articles: MeltwaterArticle[], shownArticles: Set<string>, limit: number = 50): MeltwaterArticle[] {
  // Fuentes de redes sociales permitidas (nombres legibles)
  const allowedSources = ['instagram', 'facebook', 'twitter', 'reddit', 'youtube', 'tiktok', 'threads', 'linkedin'];

  // Dominios sociales reconocidos para URL
  const socialHosts = new Set([
    'twitter.com', 'x.com',
    'instagram.com', 'www.instagram.com',
    'facebook.com', 'www.facebook.com', 'm.facebook.com',
    'reddit.com', 'www.reddit.com',
    'youtube.com', 'www.youtube.com', 'youtu.be',
    'tiktok.com', 'www.tiktok.com',
    'threads.net', 'www.threads.net',
    'linkedin.com', 'www.linkedin.com'
  ]);

  const getHost = (url?: string) => {
    if (!url) return '';
    try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
  };

  // Extra: detección por dominio en el objeto source si lo expone Meltwater
  const getSourceDomain = (article: MeltwaterArticle) => {
    const raw: any = article as any;
    const d: string | undefined = raw?.source?.domain || raw?.source_domain || raw?.domain;
    return (d || '').toLowerCase();
  };

  const isSocialArticle = (article: MeltwaterArticle) => {
    // 1) Por tipo de contenido
    // @ts-ignore: raw field may exist from API adaptation
    if (article && (article as any).content_type === 'social post') return true;

    // 2) Por dominio de la URL
    const host = getHost(article.url);
    if (host && socialHosts.has(host)) return true;

    // 2b) Por dominio de la fuente (si viene)
    const srcDomain = getSourceDomain(article);
    if (srcDomain && socialHosts.has(srcDomain)) return true;

    // 3) Por nombre de la fuente (tokens seguros, sin usar 'x' genérico)
    const sourceName = article.source?.name?.toLowerCase() || '';
    if (allowedSources.some(token => sourceName.includes(token))) return true;

    // 4) Heurística por URL path (por si es shortlink redirigido)
    const url = article.url || '';
    if (/instagram\.com|facebook\.com|twitter\.com|x\.com|reddit\.com|tiktok\.com|threads\.net|(youtube\.com|youtu\.be)/i.test(url)) return true;

    // 5) Detección por campos de contenido social (más amplia)
    const raw: any = article as any;
    const hasSocialFields = raw?.content?.text || raw?.content?.message || raw?.content?.caption || 
                           raw?.content?.post_text || raw?.content?.status_text || raw?.content?.tweet_text;
    const hasSocialMetrics = raw?.metrics?.likes || raw?.metrics?.shares || raw?.metrics?.comments || 
                           raw?.metrics?.retweets || raw?.metrics?.reactions;
    if (hasSocialFields && hasSocialMetrics) return true;

    // 6) Detección por engagement social específico
    const socialEngagement = (article.engagementScore || 0) > 0;
    const hasSocialEcho = (article.socialEchoScore || 0) > 0;
    if (socialEngagement && (hasSocialEcho || sourceName.includes('social') || sourceName.includes('post'))) return true;

    return false;
  };
  
  // Filtrar artículos solo sociales
  const socialMediaArticles = articles.filter(isSocialArticle);
  
  // Filtrar posts sociales con datos completos (título y descripción válidos)
  const completeSocialArticles = socialMediaArticles.filter(article => {
    const hasValidTitle = article.title && article.title.trim().length > 3 && 
                         !article.title.includes('Post sobre:') && 
                         !article.title.includes('Post de');
    const hasValidDescription = article.description && article.description.trim().length > 5;
    const hasValidImage = article.urlToImage && article.urlToImage !== '/placeholder.svg';
    
    // Al menos título válido O (descripción válida Y imagen válida)
    return hasValidTitle || (hasValidDescription && hasValidImage);
  });
  
  // Debug: Log de detección de redes sociales
  console.log('🔍 DEBUG REDES SOCIALES:');
  console.log(`  Total artículos: ${articles.length}`);
  console.log(`  Artículos sociales detectados: ${socialMediaArticles.length}`);
  console.log(`  Artículos sociales completos: ${completeSocialArticles.length}`);
  console.log('  Fuentes detectadas:', [...new Set(socialMediaArticles.map(a => a.source.name))]);
  console.log('  URLs de redes:', socialMediaArticles.slice(0, 5).map(a => a.url));
  
  // Debug: Analizar por qué no se detectan otras redes
  const allSources = [...new Set(articles.map(a => a.source.name))];
  console.log('  Todas las fuentes disponibles:', allSources);
  
  // Debug: Verificar detección por cada método
  const byContentType = articles.filter(a => (a as any).content_type === 'social post');
  const byHost = articles.filter(a => {
    const host = getHost(a.url);
    return host && socialHosts.has(host);
  });
  const bySourceName = articles.filter(a => {
    const sourceName = a.source?.name?.toLowerCase() || '';
    return allowedSources.some(token => sourceName.includes(token));
  });
  const byUrlRegex = articles.filter(a => {
    const url = a.url || '';
    return /instagram\.com|facebook\.com|twitter\.com|x\.com|reddit\.com|tiktok\.com|threads\.net|(youtube\.com|youtu\.be)/i.test(url);
  });
  
  console.log('  Por content_type:', byContentType.length);
  console.log('  Por host:', byHost.length);
  console.log('  Por nombre fuente:', bySourceName.length);
  console.log('  Por URL regex:', byUrlRegex.length);

  // Ordenar únicamente por engagement (usar solo los completos)
  const sortedArticles = completeSocialArticles.sort((a, b) => {
    const engagementA = a.engagementScore || 0;
    const engagementB = b.engagementScore || 0;
    return engagementB - engagementA; // Orden descendente (mayor engagement primero)
  });

  // Filtrar duplicados
  const uniqueArticles = filterUniqueArticles(sortedArticles, shownArticles);

  // Tomar el límite solicitado
  let result = uniqueArticles.slice(0, limit);

  // Rellenar si faltan elementos: intentar con más posts sociales por engagement (sin incluir no sociales)
  if (result.length < limit) {
    const selectedIds = new Set(result.map(a => generateArticleId(a)));

    // 1) Intentar con más posts sociales ordenados por engagement
    const moreSocialCandidates = [...completeSocialArticles]
      .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));

    for (const candidate of moreSocialCandidates) {
      if (result.length >= limit) break;
      const id = generateArticleId(candidate);
      if (!selectedIds.has(id) && !shownArticles.has(id)) {
        result.push(candidate);
        selectedIds.add(id);
      }
    }

    // 2) Último recurso: permitir duplicados sociales ya mostrados para no dejar huecos (mantener social-only)
    if (result.length < limit) {
      const fallbackPool = [...completeSocialArticles]
        .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));
      for (const candidate of fallbackPool) {
        if (result.length >= limit) break;
        const id = generateArticleId(candidate);
        if (!selectedIds.has(id)) {
          result.push(candidate);
          selectedIds.add(id);
        }
      }
    }
  }

  return assignContentScores(result);
}

// Función para calcular métricas relevantes basadas en la API de Meltwater
function calculateRelevantMetrics(articles: MeltwaterArticle[]) {
  // Ordenar artículos por ContentScore para priorizar los más importantes
  const sortedArticles = sortArticlesByContentScore(articles);

  // 1. ENGAGEMENT TOTAL - La métrica más importante para medir interacción
  const totalEngagement = articles.reduce((sum, article) => sum + (article.engagementScore || 0), 0);

  // 2. ALCANCE TOTAL - Cuántas personas ven el contenido
  const totalReach = articles.reduce((sum, article) => {
    // Usar el reach del source si está disponible, sino aproximar con engagement
    const sourceReach = article.source?.metrics?.reach || 0;
    return sum + (sourceReach > 0 ? sourceReach : (article.engagementScore || 0) * 10);
  }, 0);

  // 3. NÚMERO DE ARTÍCULOS - Cantidad total de contenido monitoreado
  const totalArticles = articles.length;

  // 4. SENTIMIENTO PROMEDIO - Análisis de opinión pública
  const sentimentData = articles.reduce((acc, article) => {
    const sentiment = article.enrichments?.sentiment;
    if (sentiment) {
      acc.count++;
      acc.score += sentiment === 'positive' ? 1 : sentiment === 'negative' ? -1 : 0;
    }
    return acc;
  }, { count: 0, score: 0 });

  const avgSentiment = sentimentData.count > 0 ? (sentimentData.score / sentimentData.count) : 0;

  // 5. FUENTES MONITOREADAS - Diversidad de cobertura
  const uniqueSources = new Set(articles.map(article => article.source.name)).size;

  // 6. TEMAS PRINCIPALES - Keywords más frecuentes
  const topKeywords = articles
    .flatMap(article => article.enrichments?.keyphrases || [])
    .reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const mostFrequentKeyword = Object.keys(topKeywords).reduce((a, b) =>
    topKeywords[a] > topKeywords[b] ? a : b, 'Sin datos'
  );

  return {
    totalEngagement: Math.max(totalEngagement, 0),
    totalReach: Math.max(totalReach, 0),
    totalArticles: Math.max(totalArticles, 0),
    avgSentiment,
    uniqueSources: Math.max(uniqueSources, 0),
    topTopic: mostFrequentKeyword,
    sortedArticles: sortedArticles.slice(0, 10) // Top 10 artículos por ContentScore
  };
}

// Funciones auxiliares para formatear métricas
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getSentimentColor(sentiment: number): string {
  if (sentiment > 0.1) return 'text-green-400';
  if (sentiment < -0.1) return 'text-red-400';
  return 'text-yellow-400';
}

function getSentimentLabel(sentiment: number): string {
  if (sentiment > 0.1) return 'Positivo';
  if (sentiment < -0.1) return 'Negativo';
  return 'Neutral';
}

// Función para obtener el país desde la configuración
async function getCountryName(articles: MeltwaterArticle[] = []): Promise<string> {
  try {
    const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.DEFAULT_CONFIG));
    if (response.data.success && response.data.config.defaultCountrySearchId) {
      // Intentar inferir el país desde los artículos si están disponibles
      if (articles.length > 0) {
        const countries = articles
          .map(article => article.location?.country_code)
          .filter(code => code && code !== 'zz') // Filtrar códigos válidos
          .reduce((acc, code) => {
            acc[code] = (acc[code] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

        const mostCommonCountry = Object.keys(countries).reduce((a, b) =>
          countries[a] > countries[b] ? a : b, ''
        );

        if (mostCommonCountry) {
          // Mapear códigos de país a nombres
          const countryNames: Record<string, string> = {
            'es': 'España',
            'mx': 'México',
            'ar': 'Argentina',
            'co': 'Colombia',
            'ec': 'Ecuador',
            'pe': 'Perú',
            'cl': 'Chile',
            'uy': 'Uruguay',
            'py': 'Paraguay',
            'bo': 'Bolivia'
          };
          return countryNames[mostCommonCountry] || "País Hispanoamericano";
        }
      }
      return "País Configurado";
    }
  } catch (error) {
    console.error("Error obteniendo configuración del país:", error);
  }
  return "País"; // Valor por defecto
}

export default function Index() {
  const [paisArticles, setPaisArticles] = useState<MeltwaterArticle[]>([]);
  const [sectorArticles, setSectorArticles] = useState<MeltwaterArticle[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEngagement: 0,
    totalReach: 0,
    totalArticles: 0,
    avgSentiment: 0,
    uniqueSources: 0,
    topTopic: 'Sin datos'
  });
  const [countryName, setCountryName] = useState("País");
  const [shownArticles, setShownArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get("email");
        const countryId = urlParams.get("countryId");
        const sectorId = urlParams.get("sectorId");

        // Si hay parámetros de URL, usarlos directamente
        if (countryId || sectorId) {
          const response = await axios.post<NewsResponse>(buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED), {
            countryId,
            sectorId
          });

          if (response.data.success) {
            // Log de la respuesta cruda de la API
            console.log('🔍 RESPUESTA CRUDA DE LA API (con parámetros URL):');
            console.log('📊 Datos del sector (raw):', response.data.sector);
            console.log('📊 Datos del país (raw):', response.data.pais);
            console.log('📊 Total sector:', response.data.sector?.length || 0);
            console.log('📊 Total país:', response.data.pais?.length || 0);
            
            const sectorData = adaptResults(response.data.sector);
            const paisData = adaptResults(response.data.pais);
            
            // Log de los datos después de adaptResults
            console.log('🔄 DESPUÉS DE adaptResults:');
            console.log('📊 Sector adaptado:', sectorData);
            console.log('📊 País adaptado:', paisData);
            
            setSectorArticles(sectorData);
            setPaisArticles(paisData);

            // Resetear artículos mostrados para nueva carga
            setShownArticles(new Set());

            // Calcular métricas relevantes basadas en todos los artículos
            const allArticles = [...sectorData, ...paisData];
            const calculatedMetrics = calculateRelevantMetrics(allArticles);
            setMetrics(calculatedMetrics);

            // Obtener nombre del país
            const country = await getCountryName([...sectorData, ...paisData]);
            setCountryName(country);
          } else {
            setError(true);
          }
          return;
        }

        // Si hay email en URL o localStorage, usarlo
        if (emailParam) localStorage.setItem("userEmail", emailParam);
        const email = emailParam || localStorage.getItem("userEmail");
        
        if (email) {
          const response = await axios.post<NewsResponse>(buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED), { email });
          if (response.data.success) {
            // Log de la respuesta cruda de la API
            console.log('🔍 RESPUESTA CRUDA DE LA API (con email):');
            console.log('📊 Datos del sector (raw):', response.data.sector);
            console.log('📊 Datos del país (raw):', response.data.pais);
            console.log('📊 Total sector:', response.data.sector?.length || 0);
            console.log('📊 Total país:', response.data.pais?.length || 0);
            
            const sectorData = adaptResults(response.data.sector);
            const paisData = adaptResults(response.data.pais);
            
            // Log de los datos después de adaptResults
            console.log('🔄 DESPUÉS DE adaptResults:');
            console.log('📊 Sector adaptado:', sectorData);
            console.log('📊 País adaptado:', paisData);
            
            setSectorArticles(sectorData);
            setPaisArticles(paisData);

            // Resetear artículos mostrados para nueva carga
            setShownArticles(new Set());

            // Calcular métricas relevantes basadas en todos los artículos
            const allArticles = [...sectorData, ...paisData];
            const calculatedMetrics = calculateRelevantMetrics(allArticles);
            setMetrics(calculatedMetrics);

            // Obtener nombre del país
            const country = await getCountryName([...sectorData, ...paisData]);
            setCountryName(country);
          } else {
            setError(true);
          }
          return;
        }

        // Si no hay nada, cargar noticias por defecto
        const response = await axios.post<NewsResponse>(buildApiUrl(API_CONFIG.ENDPOINTS.NEWS_PERSONALIZED), {
          email: "default"
        });
        
        if (response.data.success) {
          // Log de la respuesta cruda de la API
          console.log('🔍 RESPUESTA CRUDA DE LA API (default):');
          console.log('📊 Datos del sector (raw):', response.data.sector);
          console.log('📊 Datos del país (raw):', response.data.pais);
          console.log('📊 Total sector:', response.data.sector?.length || 0);
          console.log('📊 Total país:', response.data.pais?.length || 0);
          
          const sectorData = adaptResults(response.data.sector);
          const paisData = adaptResults(response.data.pais);
          
          // Log de los datos después de adaptResults
          console.log('🔄 DESPUÉS DE adaptResults:');
          console.log('📊 Sector adaptado:', sectorData);
          console.log('📊 País adaptado:', paisData);
          
          setSectorArticles(sectorData);
          setPaisArticles(paisData);

          // Calcular métricas relevantes basadas en todos los artículos
          const allArticles = [...sectorData, ...paisData];
          const calculatedMetrics = calculateRelevantMetrics(allArticles);
          setMetrics(calculatedMetrics);

          // Obtener nombre del país
          const country = await getCountryName();
          setCountryName(country);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error cargando noticias:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen tech-background network-pattern">
        {/* Partículas flotantes */}
        <div className="particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        {/* Header tecnológico */}
        <header className="tech-header">
          <div className="container-spacing section-spacing relative z-10">
            <div className="text-center">
              <h1 className="tech-title text-5xl mb-4">
                NEWSROOM
              </h1>
              <p className="tech-subtitle text-xl mb-4">
                Media & Social Dynamics Suite
              </p>
            </div>
          </div>
        </header>

        <main className="dashboard-container">
          {/* Skeleton para Sector */}
          <SectionSkeleton 
            title="Noticias del Sector"
            showDescription={true}
            articleCount={10}
          />

          {/* Skeleton para País */}
          <SectionSkeleton 
            title="Noticias del País"
            showDescription={true}
            articleCount={10}
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Error al cargar noticias</h2>
          <p className="text-gray-300 mb-6">Intenta recargar la página o verifica tu conexión a internet</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
    
  if (!paisArticles.length && !sectorArticles.length)
    return (
      <div className="min-h-screen tech-background network-pattern flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">No hay noticias disponibles</h2>
          <p className="text-gray-300">En este momento no hay contenido disponible para mostrar</p>
        </div>
      </div>
    );

  const paisEngagement = paisArticles.filter((a) => a.engagementScore !== undefined);
  const paisEcoSocial = paisArticles.filter((a) => a.socialEchoScore !== undefined);
  
  // Logs generales de datos disponibles
  console.log('📊 DATOS DISPONIBLES:');
  console.log(`  Sector: ${sectorArticles.length} artículos`);
  console.log(`  País: ${paisArticles.length} artículos`);
  console.log(`  País con Engagement: ${paisEngagement.length} artículos`);
  console.log(`  País con SocialEcho: ${paisEcoSocial.length} artículos`);
  
  // Log de fuentes disponibles
  const sectorSources = [...new Set(sectorArticles.map(a => a.source.name))];
  const paisSources = [...new Set(paisArticles.map(a => a.source.name))];
  console.log('📰 FUENTES SECTOR:', sectorSources);
  console.log('📰 FUENTES PAÍS:', paisSources);

  return (
    <div className="min-h-screen tech-background network-pattern">
      {/* Partículas flotantes */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Header Dashboard */}
      <header className="dashboard-header">
        <div className="dashboard-container">
          <h1 className="dashboard-title">
            NEWSROOM
          </h1>
          <p className="dashboard-subtitle">
            Media & Social Dynamics Suite
          </p>
        </div>
      </header>

      <main className="dashboard-container">
     
        {/* TOP 10 Temas - Sector */}
        {sectorArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">TOP 10 Contenido - Sector</h2>
                <p className="section-description">
                  Las noticias más relevantes ordenadas por ContentScore (alcance, engagement, impacto)
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
              <NewsList articles={(() => {
                // Sección 1: Sector (ContentScore)
                const articles = getUniqueTopArticles(sectorArticles, shownArticles, 50);
                // Marcar como mostrados para evitar duplicados con las siguientes secciones
                markShown(shownArticles, articles);
                console.log('🔵 TOP 50 SECTOR - Artículos mostrados:', articles.length);
                articles.forEach((article, index) => {
                  console.log(`  ${index + 1}. ${article.title} | Fuente: ${article.source.name} | ContentScore: ${article.contentScore?.toFixed(3)} | Engagement: ${article.engagementScore}`);
                });
                return articles;
              })()} title="Noticias Sectoriales" />
            </div>
          </div>
        )}

        {/* Nube de Palabras - Sector */}
        {sectorArticles.length > 0 && (() => {
          const freqMap = new Map<string, number>();
          const addWords = (words?: string[]) => {
            if (!words) return;
            for (const w of words) {
              if (!w) continue;
              const key = w.toLowerCase();
              freqMap.set(key, (freqMap.get(key) || 0) + 1);
            }
          };
          // tomar keyphrases solo del sector
          sectorArticles.forEach(a => addWords(a.enrichments?.keyphrases));
          const words: WordFrequency[] = Array.from(freqMap.entries()).map(([word, count]) => ({ word, count }));
          if (words.length === 0) return null;
          return (
            <div className="news-section">
              <div className="section-header-dashboard">
                <div className="section-icon-dashboard">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 12h18M3 19h18" />
                  </svg>
                </div>
                <div>
                  <h2 className="section-title-dashboard">Nube de Palabras - Sector</h2>
                  <p className="section-description">Palabras clave más mencionadas en noticias sectoriales; mayor tamaño indica mayor relevancia</p>
                </div>
              </div>
              <WordCloud words={words} maxWords={40} />
            </div>
          );
        })()}

        {/* TOP 50 Contenido - País */}
        {paisArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">TOP 50 Contenido - {countryName}</h2>
                <p className="section-description">
                  Las noticias más impactantes del país ordenadas por Social Echo Score (eco social, engagement como fallback). Incluye medios tradicionales y redes sociales.
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
              <NewsList articles={(() => {
                console.log('🚀 INICIANDO getUniqueTopPaisArticles con:', paisArticles.length, 'artículos del país');
                console.log('🚀 ARTÍCULOS DEL PAÍS DISPONIBLES:', paisArticles.map(a => `${a.title} | ${a.source.name}`));
                // Sección 2: País - Mostrar artículos del país (medios tradicionales) ordenados por SocialEcho/ContentScore
                const articles = getUniqueTopPaisArticles(paisArticles, shownArticles, 50);
                // Marcar como mostrados para evitar duplicados con la sección de redes
                markShown(shownArticles, articles);
                console.log('🟢 TOP 50 PAÍS - Artículos mostrados:', articles.length);
                articles.forEach((article, index) => {
                  console.log(`  ${index + 1}. ${article.title} | Fuente: ${article.source.name} | SocialEcho: ${article.socialEchoScore} | Engagement: ${article.engagementScore} | ContentScore: ${article.contentScore?.toFixed(3)}`);
                });
                return articles;
              })()} title="Noticias del País" />
            </div>
            </div>
          )}

        {/* Nube de Palabras - País */}
        {paisArticles.length > 0 && (() => {
          const freqMap = new Map<string, number>();
          const addWords = (words?: string[]) => {
            if (!words) return;
            for (const w of words) {
              if (!w) continue;
              const key = w.toLowerCase();
              freqMap.set(key, (freqMap.get(key) || 0) + 1);
            }
          };
          // tomar keyphrases solo del país
          paisArticles.forEach(a => addWords(a.enrichments?.keyphrases));
          const words: WordFrequency[] = Array.from(freqMap.entries()).map(([word, count]) => ({ word, count }));
          if (words.length === 0) return null;
          return (
            <div className="news-section">
              <div className="section-header-dashboard">
                <div className="section-icon-dashboard">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 12h18M3 19h18" />
                  </svg>
                </div>
                <div>
                  <h2 className="section-title-dashboard">Nube de Palabras - País</h2>
                  <p className="section-description">Palabras clave más mencionadas en noticias del país; mayor tamaño indica mayor relevancia</p>
                </div>
              </div>
              <WordCloud words={words} maxWords={40} />
            </div>
          );
        })()}

        {/* Contenido Más Relevante */}
        {paisArticles.length > 0 && (
          <div className="news-section">
            <div className="section-header-dashboard">
              <div className="section-icon-dashboard">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h2 className="section-title-dashboard">Contenido Más Relevante</h2>
                <p className="section-description">
                  Contenido de redes sociales (Instagram, Facebook, Twitter/X, Reddit, YouTube) ordenado por engagement para identificar oportunidades de HOT NEWS
                </p>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-transparent">
              <div className="news-grid-dashboard">
                {(() => {
                  // Sección 3: Redes Sociales - Solo artículos que NO fueron mostrados en la sección País
                  const articles = getUniqueSocialMediaArticles(paisArticles, shownArticles, 50);
                  console.log('🔴 TOP 50 REDES SOCIALES - Artículos mostrados:', articles.length);
                  articles.forEach((article, index) => {
                    console.log(`  ${index + 1}. ${article.title} | Fuente: ${article.source.name} | Engagement: ${article.engagementScore} | SocialEcho: ${article.socialEchoScore}`);
                  });
                  return articles;
                })().map((article, index) => (
                  <a
                    key={`${article.url}-${index}`}
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
                      </div>
                      {index < 2 && <span className="news-tag">Actualidad</span>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
