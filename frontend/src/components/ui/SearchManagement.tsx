import { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl, API_CONFIG } from "../../config/api";

interface Search {
  _id: string;
  name: string;
  countrySearchId: string;
  sectorSearchId: string;
  isActive: boolean;
  createdAt: string;
}

interface SearchManagementProps {
  password: string;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function SearchManagement({ password, onError, onSuccess }: SearchManagementProps) {
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSearch, setNewSearch] = useState({
    name: "",
    countrySearchId: "",
    sectorSearchId: ""
  });

  const fetchSearches = async () => {
    try {
      const res = await axios.get<{ searches: Search[] }>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SEARCHES),
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      setSearches(res.data.searches || []);
    } catch (err) {
      console.error("Error cargando búsquedas:", err);
      onError("Error cargando búsquedas");
    }
  };

  const createSearch = async () => {
    if (!newSearch.name || !newSearch.countrySearchId || !newSearch.sectorSearchId) {
      onError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SEARCHES),
        newSearch,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      setNewSearch({ name: "", countrySearchId: "", sectorSearchId: "" });
      fetchSearches();
      onSuccess("✅ Búsqueda creada exitosamente");
    } catch (err: any) {
      console.error("Error creando búsqueda:", err);
      onError(err.response?.data?.message || "Error creando búsqueda");
    } finally {
      setLoading(false);
    }
  };

  const updateSearch = async (id: string, updates: Partial<Search>) => {
    try {
      await axios.patch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SEARCHES)}/${id}`,
        updates,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      fetchSearches();
      onSuccess("✅ Búsqueda actualizada exitosamente");
    } catch (err: any) {
      console.error("Error actualizando búsqueda:", err);
      onError(err.response?.data?.message || "Error actualizando búsqueda");
    }
  };

  const deleteSearch = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta búsqueda?")) {
      return;
    }

    try {
      await axios.delete(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SEARCHES)}/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      fetchSearches();
      onSuccess("✅ Búsqueda eliminada exitosamente");
    } catch (err: any) {
      console.error("Error eliminando búsqueda:", err);
      onError(err.response?.data?.message || "Error eliminando búsqueda");
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 Gestión de Búsquedas</h3>
      
      {/* Formulario para crear búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Nombre de la búsqueda"
          value={newSearch.name}
          onChange={(e) => setNewSearch({...newSearch, name: e.target.value})}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="ID búsqueda país"
          value={newSearch.countrySearchId}
          onChange={(e) => setNewSearch({...newSearch, countrySearchId: e.target.value})}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="ID búsqueda sector"
          value={newSearch.sectorSearchId}
          onChange={(e) => setNewSearch({...newSearch, sectorSearchId: e.target.value})}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={createSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creando..." : "➕ Crear Búsqueda"}
        </button>
      </div>

      {/* Lista de búsquedas */}
      <div className="space-y-2">
        {searches.map((search) => (
          <div key={search._id} className="flex items-center justify-between bg-white p-3 rounded border">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{search.name}</span>
                <span className="text-sm text-gray-600">
                  País ID: {search.countrySearchId}
                </span>
                <span className="text-sm text-gray-600">
                  Sector ID: {search.sectorSearchId}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(search.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateSearch(search._id, { isActive: !search.isActive })}
                className={`px-3 py-1 rounded text-sm ${
                  search.isActive 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {search.isActive ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => deleteSearch(search._id)}
                className="text-red-600 hover:text-red-800 px-2 py-1"
              >
                ❌
              </button>
            </div>
          </div>
        ))}
        {searches.length === 0 && (
          <p className="text-gray-500 text-center py-4">No hay búsquedas creadas</p>
        )}
      </div>
    </div>
  );
}
