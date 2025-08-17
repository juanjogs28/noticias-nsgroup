
import { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Mail, Clock, TrendingUp, AlertCircle, Calendar, Globe, Users, Filter } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { formatPublishedDate } from "@/services/newsService";
import { subscribeToNewsletter } from "@/services/subscriptionService";

const Index = () => {
  const [email, setEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('us');
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Fetch real news data
  const { data: newsData, isLoading, error } = useNews('us', 8);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu email",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);
    
    try {
      const response = await subscribeToNewsletter({
        email,
        category: selectedCategory,
        region: selectedRegion
      });
      
      toast({
        title: "¡Suscripción exitosa! 🎉",
        description: response.message,
      });
      
      setEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la suscripción",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const getCategoryFromSource = (sourceName: string) => {
    const lowerSource = sourceName.toLowerCase();
    
    // Para datos de redes sociales, usar categorías más apropiadas
    if (lowerSource.includes('twitter') || lowerSource.includes('social')) {
      return 'redes-sociales';
    } else if (lowerSource.includes('tech') || lowerSource.includes('verge') || lowerSource.includes('wired')) {
      return 'tecnologia';
    } else if (lowerSource.includes('business') || lowerSource.includes('financial') || lowerSource.includes('bloomberg')) {
      return 'finanzas';
    } else if (lowerSource.includes('health') || lowerSource.includes('medical')) {
      return 'medicina';
    } else if (lowerSource.includes('space') || lowerSource.includes('geographic')) {
      return 'ciencia';
    } else if (lowerSource.includes('green') || lowerSource.includes('agri')) {
      return 'medio-ambiente';
    } else {
      return 'general';
    }
  };

  const getCategoryColor = (sourceName: string) => {
    const category = getCategoryFromSource(sourceName);
    
    switch (category) {
      case 'redes-sociales':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'tecnologia':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'finanzas':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'medicina':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'ciencia':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'medio-ambiente':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      default:
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'redes-sociales': 'Redes Sociales',
      'tecnologia': 'Tecnología',
      'finanzas': 'Finanzas',
      'medicina': 'Medicina',
      'ciencia': 'Ciencia',
      'medio-ambiente': 'Medio Ambiente',
      'general': 'General'
    };
    return labels[category] || 'General';
  };

  const handleReadMore = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Información",
        description: "Este contenido no tiene enlace externo disponible",
        variant: "default",
      });
    }
  };

  // Filter articles by category
  const filteredArticles = newsData?.articles?.filter(article => {
    if (selectedCategory === 'all') return true;
    return getCategoryFromSource(article.source.name) === selectedCategory;
  }) || [];

  // Get unique categories from articles
  const availableCategories = newsData?.articles ? 
    [...new Set(newsData.articles.map(article => getCategoryFromSource(article.source.name)))] : [];

  // Get region labels
  const getRegionLabel = (region: string) => {
    const labels = {
      'us': 'Estados Unidos',
      'mx': 'México',
      'es': 'España',
      'ar': 'Argentina',
      'co': 'Colombia',
      'pe': 'Perú',
      'cl': 'Chile',
      'br': 'Brasil',
      'global': 'Global'
    };
    return labels[region] || 'Estados Unidos';
  };

  // Resumen del día hardcodeado
  const todaySummary = {
    date: "15 de Enero, 2025",
    totalNews: newsData?.articles?.length || 5,
    categories: availableCategories.map(cat => getCategoryLabel(cat)),
    highlights: [
      "Tendencias virales en redes sociales",
      "Contenido destacado de portadas mundiales",
      "Engagement alto en posts de actualidad"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">NS Group</h1>
                <p className="text-sm text-slate-600">Resúmenes de Noticias</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {isLoading ? 'Cargando...' : 'Actualizado hoy'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Main Hero Content */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              El contenido más viral,
              <span className="text-blue-600"> resumido para ti</span>
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Mantente al día con las tendencias más importantes de redes sociales. Recibe un resumen diario del contenido más relevante directamente en tu email.
            </p>
          </div>

          {/* Today's Summary Card */}
          <div className="mb-12">
            <Card className="mx-auto max-w-4xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-2xl text-slate-900">Resumen del Día</CardTitle>
                </div>
                <CardDescription className="text-lg text-slate-700">
                  {todaySummary.date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="text-2xl font-bold text-slate-900">{todaySummary.totalNews}</span>
                    </div>
                    <p className="text-slate-600">Noticias Resumidas</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-slate-900">{todaySummary.categories.length}</span>
                    </div>
                    <p className="text-slate-600">Categorías</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-2xl font-bold text-slate-900">12K+</span>
                    </div>
                    <p className="text-slate-600">Lectores Diarios</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 mb-3 text-center">Destacados de Hoy:</h4>
                  <div className="space-y-2">
                    {todaySummary.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-slate-700">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {todaySummary.categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Subscription Form */}
          <div className="text-center">
            <form onSubmit={handleSubscribe} className="space-y-4 max-w-lg mx-auto mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="tu.email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 px-4 text-lg"
                />
                <Button 
                  type="submit" 
                  disabled={isSubscribing}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isSubscribing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Suscribiendo...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Suscribirse
                    </div>
                  )}
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="redes-sociales">Redes Sociales</SelectItem>
                    <SelectItem value="tecnologia">Tecnología</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="medicina">Medicina</SelectItem>
                    <SelectItem value="ciencia">Ciencia</SelectItem>
                    <SelectItem value="medio-ambiente">Medio Ambiente</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecciona región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">Estados Unidos</SelectItem>
                    <SelectItem value="mx">México</SelectItem>
                    <SelectItem value="es">España</SelectItem>
                    <SelectItem value="ar">Argentina</SelectItem>
                    <SelectItem value="co">Colombia</SelectItem>
                    <SelectItem value="pe">Perú</SelectItem>
                    <SelectItem value="cl">Chile</SelectItem>
                    <SelectItem value="br">Brasil</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
            <p className="text-sm text-slate-500">
              📧 Resumen diario • 📱 Sin spam • ✨ Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Contenido Viral de Hoy</h3>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {isLoading ? 'Actualizando...' : 'Última actualización: hace 1 hora'}
                </span>
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-600" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-600">Cargando noticias...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Error al cargar noticias</h4>
                <p className="text-slate-600">
                  No se pudieron cargar las noticias. Por favor, intenta nuevamente más tarde.
                </p>
              </div>
            </div>
          )}

          {/* News Grid */}
          {filteredArticles.length > 0 && (
            <>
              <div className="mb-4 text-sm text-slate-600">
                Mostrando {filteredArticles.length} contenido{filteredArticles.length !== 1 ? 's' : ''}
                {selectedCategory !== 'all' && ` de ${getCategoryLabel(selectedCategory)}`}
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles
                  .filter(article => article.title && article.title !== '[Removed]' && article.title !== 'Sin título')
                  .map((article, index) => (
                  <Card key={`${article.url}-${index}`} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white/70 backdrop-blur-sm hover:-translate-y-1">
                    <div className="relative">
                      {article.urlToImage && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                          <img 
                            src={article.urlToImage} 
                            alt={article.title}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={() => handleReadMore(article.url)}
                          />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className={getCategoryColor(article.source.name)}>
                          {getCategoryLabel(getCategoryFromSource(article.source.name))}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
                        <span>{article.source.name}</span>
                        <span>•</span>
                        <span>{formatPublishedDate(article.publishedAt)}</span>
                        <span>•</span>
                        <span>3 min</span>
                      </div>
                      <CardTitle className="text-lg leading-tight group-hover:text-blue-700 transition-colors cursor-pointer line-clamp-2"
                                 onClick={() => handleReadMore(article.url)}>
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <CardDescription className="text-slate-700 text-sm leading-relaxed mb-4 line-clamp-3">
                        {article.description || 'Contenido de redes sociales'}
                      </CardDescription>
                      <Button 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-semibold w-full justify-start"
                        onClick={() => handleReadMore(article.url)}
                      >
                        <span>Leer más</span>
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* No results message */}
          {filteredArticles.length === 0 && newsData?.articles && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Filter className="w-12 h-12 mx-auto mb-2" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">No se encontraron noticias</h4>
              <p className="text-slate-600">
                No hay noticias disponibles para la categoría seleccionada.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSelectedCategory('all')}
              >
                Ver todas las noticias
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto max-w-2xl text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            ¿Te perdiste algo importante?
          </h3>
          <p className="text-blue-100 text-lg mb-8">
            Suscríbete ahora y recibe todos los días un resumen personalizado con las noticias más relevantes.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="tu.email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 text-lg bg-white"
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="redes-sociales">Redes Sociales</SelectItem>
                  <SelectItem value="tecnologia">Tecnología</SelectItem>
                  <SelectItem value="finanzas">Finanzas</SelectItem>
                  <SelectItem value="medicina">Medicina</SelectItem>
                  <SelectItem value="ciencia">Ciencia</SelectItem>
                  <SelectItem value="medio-ambiente">Medio Ambiente</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">Estados Unidos</SelectItem>
                  <SelectItem value="mx">México</SelectItem>
                  <SelectItem value="es">España</SelectItem>
                  <SelectItem value="ar">Argentina</SelectItem>
                  <SelectItem value="co">Colombia</SelectItem>
                  <SelectItem value="pe">Perú</SelectItem>
                  <SelectItem value="cl">Chile</SelectItem>
                  <SelectItem value="br">Brasil</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubscribing}
              className="h-12 px-8 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            >
              {isSubscribing ? 'Suscribiendo...' : 'Suscribirse'}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">NS Group</span>
          </div>
          <p className="text-slate-400 mb-4">
            Mantente informado con los resúmenes de noticias más relevantes del día.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <p className="text-sm text-slate-500">
              © 2024 NS Group. Todos los derechos reservados.
            </p>
            <a 
              href="/admin" 
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              title="Panel de administración"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
