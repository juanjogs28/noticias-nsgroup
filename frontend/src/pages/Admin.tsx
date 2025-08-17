import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut, 
  Plus, 
  Trash2, 
  Eye,
  EyeOff,
  TrendingUp,
  Filter
} from "lucide-react";

interface Subscriber {
  _id: string;
  email: string;
  category: string;
  region: string;
  subscribedAt: string;
  isActive: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [searchEmail, setSearchEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Contraseña hardcodeada
  const ADMIN_PASSWORD = '4dminNSG!';

  // Verificar autenticación al cargar
  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchSubscribers();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      toast({
        title: "✅ Acceso concedido",
        description: "Bienvenido al panel de administración",
      });
      fetchSubscribers();
    } else {
      toast({
        title: "❌ Acceso denegado",
        description: "Contraseña incorrecta",
        variant: "destructive",
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    navigate('/');
    toast({
      title: "👋 Sesión cerrada",
      description: "Has salido del panel de administración",
    });
  };

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
      } else {
        throw new Error('Error al obtener suscriptores');
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudieron cargar los suscriptores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este suscriptor?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/subscribers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "✅ Suscriptor eliminado",
          description: "El suscriptor ha sido eliminado exitosamente",
        });
        fetchSubscribers(); // Recargar lista
      } else {
        throw new Error('Error al eliminar suscriptor');
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el suscriptor",
        variant: "destructive",
      });
    }
  };

  const toggleSubscriberStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/subscribers/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "✅ Estado actualizado",
          description: `Suscriptor ${!currentStatus ? 'activado' : 'desactivado'}`,
        });
        fetchSubscribers(); // Recargar lista
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  // Filtrar suscriptores
  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesCategory = filterCategory === 'all' || subscriber.category === filterCategory;
    const matchesRegion = filterRegion === 'all' || subscriber.region === filterRegion;
    const matchesEmail = searchEmail === '' || subscriber.email.toLowerCase().includes(searchEmail.toLowerCase());
    
    return matchesCategory && matchesRegion && matchesEmail;
  });

  // Obtener estadísticas
  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.isActive).length,
    categories: [...new Set(subscribers.map(s => s.category))].length,
    regions: [...new Set(subscribers.map(s => s.region))].length,
  };

  // Obtener etiquetas
  const getCategoryLabel = (category: string) => {
    const labels = {
      'all': 'Todas',
      'redes-sociales': 'Redes Sociales',
      'tecnologia': 'Tecnología',
      'finanzas': 'Finanzas',
      'medicina': 'Medicina',
      'ciencia': 'Ciencia',
      'medio-ambiente': 'Medio Ambiente',
      'general': 'General'
    };
    return labels[category] || category;
  };

  const getRegionLabel = (region: string) => {
    const labels = {
      'all': 'Todas',
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
    return labels[region] || region;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Si no está autenticado, mostrar formulario de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Panel Admin</CardTitle>
                <CardDescription>NS Group Newsletter</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña de administrador"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                Acceder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
                <p className="text-sm text-slate-600">NS Group Newsletter</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Total Suscriptores</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">Activos</p>
                    <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Filter className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600">Categorías</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.categories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600">Regiones</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.regions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48 h-10">
                    <SelectValue placeholder="Filtrar por categoría" />
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
                <Select value={filterRegion} onValueChange={setFilterRegion}>
                  <SelectTrigger className="w-48 h-10">
                    <SelectValue placeholder="Filtrar por región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las regiones</SelectItem>
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
                <Button 
                  onClick={fetchSubscribers}
                  variant="outline"
                  className="h-10"
                >
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscribers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Suscriptores ({filteredSubscribers.length})
              </CardTitle>
              <CardDescription>
                Gestiona todos los suscriptores del newsletter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-600">Cargando suscriptores...</span>
                  </div>
                </div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">No hay suscriptores</h4>
                  <p className="text-slate-600">
                    {searchEmail || filterCategory !== 'all' || filterRegion !== 'all' 
                      ? 'No se encontraron suscriptores con los filtros aplicados'
                      : 'Aún no hay suscriptores registrados'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Categoría</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Región</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Fecha</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Estado</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscribers.map((subscriber) => (
                        <tr key={subscriber._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <span className="font-mono text-sm">{subscriber.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {getCategoryLabel(subscriber.category)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {getRegionLabel(subscriber.region)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatDate(subscriber.subscribedAt)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={subscriber.isActive ? "default" : "secondary"}
                              className={subscriber.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}
                            >
                              {subscriber.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleSubscriberStatus(subscriber._id, subscriber.isActive)}
                                className="h-8 px-3"
                              >
                                {subscriber.isActive ? 'Desactivar' : 'Activar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteSubscriber(subscriber._id)}
                                className="h-8 px-3"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Admin;
