import { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl, API_CONFIG } from "../../config/api";

interface Subscriber {
  _id: string;
  email: string;
  isActive: boolean;
}

interface Search {
  _id: string;
  name: string;
  countrySearchId: string;
  sectorSearchId: string;
  isActive: boolean;
}

interface Subscription {
  _id: string;
  subscriberId: {
    _id: string;
    email: string;
    isActive: boolean;
  };
  searchId: {
    _id: string;
    name: string;
    countrySearchId: string;
    sectorSearchId: string;
    isActive: boolean;
  };
  isActive: boolean;
  subscribedAt: string;
}

interface SubscriptionManagementProps {
  password: string;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function SubscriptionManagement({ password, onError, onSuccess }: SubscriptionManagementProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    subscriberId: "",
    searchId: ""
  });

  const fetchData = async () => {
    try {
      const [subscriptionsRes, subscribersRes, searchesRes] = await Promise.all([
        axios.get<{ subscriptions: Subscription[] }>(
          buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIPTIONS),
          { headers: { 'Authorization': `Bearer ${password}` } }
        ),
        axios.get<{ subscribers: Subscriber[] }>(
          buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIBERS),
          { headers: { 'Authorization': `Bearer ${password}` } }
        ),
        axios.get<{ searches: Search[] }>(
          buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SEARCHES),
          { headers: { 'Authorization': `Bearer ${password}` } }
        )
      ]);

      setSubscriptions(subscriptionsRes.data.subscriptions || []);
      setSubscribers(subscribersRes.data.subscribers || []);
      setSearches(searchesRes.data.searches || []);
    } catch (err) {
      console.error("Error cargando datos:", err);
      onError("Error cargando datos");
    }
  };

  const createSubscription = async () => {
    if (!newSubscription.subscriberId || !newSubscription.searchId) {
      onError("Selecciona un suscriptor y una búsqueda");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIPTIONS),
        newSubscription,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      setNewSubscription({ subscriberId: "", searchId: "" });
      fetchData();
      onSuccess("✅ Suscripción creada exitosamente");
    } catch (err: any) {
      console.error("Error creando suscripción:", err);
      onError(err.response?.data?.message || "Error creando suscripción");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (id: string, isActive: boolean) => {
    try {
      await axios.patch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIPTIONS)}/${id}`,
        { isActive },
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      fetchData();
      onSuccess(`✅ Suscripción ${isActive ? 'activada' : 'desactivada'} exitosamente`);
    } catch (err: any) {
      console.error("Error actualizando suscripción:", err);
      onError(err.response?.data?.message || "Error actualizando suscripción");
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta suscripción?")) {
      return;
    }

    try {
      await axios.delete(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIPTIONS)}/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      fetchData();
      onSuccess("✅ Suscripción eliminada exitosamente");
    } catch (err: any) {
      console.error("Error eliminando suscripción:", err);
      onError(err.response?.data?.message || "Error eliminando suscripción");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">🔗 Gestión de Suscripciones</h3>
      
      {/* Formulario para crear suscripción */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select
          value={newSubscription.subscriberId}
          onChange={(e) => setNewSubscription({...newSubscription, subscriberId: e.target.value})}
          className="border rounded px-3 py-2"
        >
          <option value="">Seleccionar suscriptor</option>
          {subscribers.map((subscriber) => (
            <option key={subscriber._id} value={subscriber._id}>
              {subscriber.email}
            </option>
          ))}
        </select>
        
        <select
          value={newSubscription.searchId}
          onChange={(e) => setNewSubscription({...newSubscription, searchId: e.target.value})}
          className="border rounded px-3 py-2"
        >
          <option value="">Seleccionar búsqueda</option>
          {searches.map((search) => (
            <option key={search._id} value={search._id}>
              {search.name} ({search.countrySearchId}, {search.sectorSearchId})
            </option>
          ))}
        </select>
        
        <button
          onClick={createSubscription}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Creando..." : "➕ Crear Suscripción"}
        </button>
      </div>

      {/* Lista de suscripciones */}
      <div className="space-y-2">
        {subscriptions.map((subscription) => (
          <div key={subscription._id} className="flex items-center justify-between bg-white p-3 rounded border">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{subscription.subscriberId.email}</span>
                <span className="text-sm text-gray-600">
                  → {subscription.searchId.name}
                </span>
                <span className="text-sm text-gray-500">
                  ({subscription.searchId.countrySearchId}, {subscription.searchId.sectorSearchId})
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(subscription.subscribedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded ${
                subscription.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {subscription.isActive ? 'Activa' : 'Inactiva'}
              </span>
              <button
                onClick={() => toggleSubscription(subscription._id, !subscription.isActive)}
                className={`px-3 py-1 rounded text-sm ${
                  subscription.isActive 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {subscription.isActive ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => deleteSubscription(subscription._id)}
                className="text-red-600 hover:text-red-800 px-2 py-1"
              >
                ❌
              </button>
            </div>
          </div>
        ))}
        {subscriptions.length === 0 && (
          <p className="text-gray-500 text-center py-4">No hay suscripciones creadas</p>
        )}
      </div>
    </div>
  );
}
