// src/components/AdminPanel.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import EditSubscriberModal from "./EditSubscriberModal";
import SearchManagement from "./SearchManagement";
import SubscriptionManagement from "./SubscriptionManagement";
import { buildApiUrl, API_CONFIG } from "../../config/api";

interface Subscriber {
  _id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
}

interface ScheduleTime {
  _id: string;
  time: string;
  isActive: boolean;
  createdAt: string;
  description: string;
}

export default function AdminPanel() {
  const [email, setEmail] = useState("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // Estados para horarios de envío
  const [scheduleTimes, setScheduleTimes] = useState<ScheduleTime[]>([]);
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [newScheduleDescription, setNewScheduleDescription] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  // Estados para envío manual
  const [manualSendLoading, setManualSendLoading] = useState(false);
  const [manualSendMessage, setManualSendMessage] = useState("");
  
  // Estados para configuración por defecto
  const [defaultConfig, setDefaultConfig] = useState({
    defaultCountrySearchId: "",
    defaultSectorSearchId: ""
  });
  const [defaultConfigLoading, setDefaultConfigLoading] = useState(false);

  // Estados para edición de suscriptores
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estado para refrescar SubscriptionManagement cuando se crea una búsqueda
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Función para autenticar
  const authenticate = async () => {
    if (!password.trim()) {
      setAuthError("Por favor ingresa la contraseña");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      // Probar autenticación con header Authorization
      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN), {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      
      if (response.status === 200) {
        setIsAuthenticated(true);
        setAuthError("");
        // Una vez autenticado, cargar suscriptores y configuración
        fetchSubscribers();
        fetchScheduleTimes();
        fetchDefaultConfig();
        // No limpiar la contraseña aquí porque se necesita para las llamadas API
      }
    } catch (err: any) {
      console.error("Error de autenticación:", err);
      if (err.response?.status === 401) {
        setAuthError("Contraseña requerida");
      } else if (err.response?.status === 403) {
        setAuthError("Contraseña incorrecta");
      } else {
        setAuthError("Error de autenticación");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setSubscribers([]);
    setError("");
    setSuccessMessage("");
  };

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get<{ subscribers: Subscriber[] }>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIBERS),
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      setSubscribers(res.data.subscribers || []);
    } catch (err) {
      console.error("Error cargando suscriptores:", err);
      setError("Error cargando suscriptores");
    }
  };

  const fetchScheduleTimes = async () => {
    try {
      const res = await axios.get<{ scheduleTimes: ScheduleTime[] }>(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULE_TIMES),
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      setScheduleTimes(res.data.scheduleTimes || []);
    } catch (err) {
      console.error("Error cargando horarios:", err);
      setError("Error cargando horarios de envío");
    }
  };

  const sendManualNewsletter = async () => {
    try {
      setManualSendLoading(true);
      setManualSendMessage("");
      
      const res = await axios.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_MANUAL_NEWSLETTER),
        {},
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      if (res.data.success) {
        setManualSendMessage("✅ Newsletter enviado exitosamente");
        setTimeout(() => setManualSendMessage(""), 5000);
      }
    } catch (err: any) {
      console.error("Error enviando newsletter:", err);
      setManualSendMessage("❌ Error enviando newsletter: " + (err.response?.data?.message || err.message));
      setTimeout(() => setManualSendMessage(""), 5000);
    } finally {
      setManualSendLoading(false);
    }
  };

  const fetchDefaultConfig = async () => {
    try {
      const res = await axios.get(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DEFAULT_CONFIG),
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      if (res.data.success) {
        setDefaultConfig({
          defaultCountrySearchId: res.data.config.defaultCountrySearchId || "",
          defaultSectorSearchId: res.data.config.defaultSectorSearchId || ""
        });
      }
    } catch (err) {
      console.error("Error cargando configuración por defecto:", err);
      setError("Error cargando configuración por defecto");
    }
  };

  const updateDefaultConfig = async () => {
    try {
      setDefaultConfigLoading(true);
      
      const res = await axios.patch(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DEFAULT_CONFIG),
        defaultConfig,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      if (res.data.success) {
        setError(""); // Limpiar errores previos
        // Mostrar mensaje de éxito temporal
        setSuccessMessage("✅ Configuración por defecto actualizada");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err: any) {
      console.error("Error actualizando configuración por defecto:", err);
      setError("Error actualizando configuración por defecto: " + (err.response?.data?.message || err.message));
    } finally {
      setDefaultConfigLoading(false);
    }
  };

  const addScheduleTime = async () => {
    if (!newScheduleTime.trim()) {
      setError("El horario es requerido");
      return;
    }

    try {
      setScheduleLoading(true);
      
      const res = await axios.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULE_TIMES),
        {
          time: newScheduleTime,
          description: newScheduleDescription
        },
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      if (res.data.success) {
        setNewScheduleTime("");
        setNewScheduleDescription("");
        fetchScheduleTimes();
        setError(""); // Limpiar errores previos
        setSuccessMessage("✅ Horario agregado exitosamente");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err: any) {
      console.error("Error agregando horario:", err);
      setError("Error agregando horario: " + (err.response?.data?.message || err.message));
    } finally {
      setScheduleLoading(false);
    }
  };

  const toggleScheduleTime = async (id: string, isActive: boolean) => {
    try {
      const res = await axios.patch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULE_TIMES)}/${id}`,
        { isActive },
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      if (res.data.success) {
        fetchScheduleTimes();
        setSuccessMessage(`✅ Horario ${isActive ? 'activado' : 'desactivado'} exitosamente`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error actualizando horario:", err);
      setError("Error actualizando horario");
    }
  };

  const deleteScheduleTime = async (id: string) => {
    try {
      await axios.delete(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SCHEDULE_TIMES)}/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      fetchScheduleTimes();
      setSuccessMessage("✅ Horario eliminado exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error eliminando horario:", err);
      setError("Error eliminando horario");
    }
  };

  const createSubscriber = async () => {
    if (!email) {
      setError("El email es obligatorio");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIBERS), {
        email,
      }, {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      setEmail("");
      fetchSubscribers();
      setSuccessMessage("✅ Suscriptor creado exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error creando suscriptor:", err);
      setError(err.response?.data?.message || "Error creando suscriptor");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscriber = async (id: string) => {
    try {
      await axios.delete(`${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIBERS)}/${id}`, {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      fetchSubscribers();
      setSuccessMessage("✅ Suscriptor eliminado exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error borrando suscriptor:", err);
      setError("Error borrando suscriptor");
    }
  };

  // Función para abrir modal de edición
  const openEditModal = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setIsEditModalOpen(true);
  };

  // Función para guardar cambios del suscriptor
  const saveSubscriberChanges = async (updatedData: Partial<Subscriber>) => {
    if (!editingSubscriber) return;

    try {
      await axios.patch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIBERS)}/${editingSubscriber._id}`,
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${password}`
          }
        }
      );
      
      // Recargar suscriptores y cerrar modal
      await fetchSubscribers();
      setIsEditModalOpen(false);
      setEditingSubscriber(null);
      
      // Mostrar mensaje de éxito
      setSuccessMessage("✅ Suscriptor actualizado exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Error actualizando suscriptor");
    }
  };

  const updateDefaultFlags = async (id: string, field: 'country' | 'sector', value: boolean) => {
    try {
      const updateData: any = {};
      if (field === 'country') {
        updateData.isDefaultCountry = value;
      } else {
        updateData.isDefaultSector = value;
      }

      await axios.patch(`${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_SUBSCRIBERS)}/${id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      fetchSubscribers();
    } catch (err) {
      console.error("Error actualizando suscriptor:", err);
      setError("Error actualizando suscriptor");
    }
  };

  // Si no está autenticado, mostrar formulario de login
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🔐 Admin Panel</h1>
          <p className="text-gray-600 mt-2">Ingresa la contraseña para continuar</p>
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {authError}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); authenticate(); }} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
              required
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {authLoading ? "Verificando..." : "Acceder"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔐 Acceso restringido al personal autorizado</p>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar panel de admin
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📋 Panel Admin</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">🔐 Sesión activa</span>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

              {error && <p className="text-red-500 mb-4">{error}</p>}
        {successMessage && <p className="text-green-600 font-bold mb-4">{successMessage}</p>}

      {/* Configuración por defecto */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">⚙️ Configuración por Defecto</h3>
        <p className="text-blue-700 text-sm mb-3">
          Esta configuración se usa cuando un usuario no está logueado y no proporciona sector ni país.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="ID búsqueda país por defecto"
            value={defaultConfig.defaultCountrySearchId}
            onChange={(e) => setDefaultConfig({...defaultConfig, defaultCountrySearchId: e.target.value})}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="ID búsqueda sector por defecto"
            value={defaultConfig.defaultSectorSearchId}
            onChange={(e) => setDefaultConfig({...defaultConfig, defaultSectorSearchId: e.target.value})}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={updateDefaultConfig}
            disabled={defaultConfigLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {defaultConfigLoading ? "Guardando..." : "💾 Guardar Configuración"}
          </button>
        </div>
      </div>

      {/* Botón de envío manual */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-green-800 mb-3">📧 Envío Manual</h3>
        <p className="text-green-700 text-sm mb-3">
          Envía el newsletter inmediatamente a todos los suscriptores activos.
        </p>
        <div className="flex items-center space-x-4">
          <button
            onClick={sendManualNewsletter}
            disabled={manualSendLoading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
          >
            {manualSendLoading ? "⏳ Enviando..." : "📤 Enviar Ahora"}
          </button>
          {manualSendMessage && (
            <span className={`text-sm ${manualSendMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {manualSendMessage}
            </span>
          )}
        </div>
      </div>

      {/* Gestión de horarios de envío */}
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">⏰ Horarios de Envío</h3>
        <p className="text-purple-700 text-sm mb-3">
          Configura los horarios automáticos de envío de newsletters.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          <input
            type="time"
            value={newScheduleTime}
            onChange={(e) => setNewScheduleTime(e.target.value)}
            className="border rounded px-3 py-2"
            placeholder="HH:MM"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newScheduleDescription}
            onChange={(e) => setNewScheduleDescription(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={addScheduleTime}
            disabled={scheduleLoading || !newScheduleTime.trim()}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {scheduleLoading ? "Agregando..." : "➕ Agregar Horario"}
          </button>
        </div>
        
        {/* Lista de horarios */}
        <div className="space-y-2">
          {scheduleTimes.map((schedule) => (
            <div key={schedule._id} className="flex items-center justify-between bg-white p-3 rounded border">
              <div className="flex items-center space-x-4">
                <span className="font-mono text-lg">{schedule.time}</span>
                <span className="text-gray-600">{schedule.description || "Sin descripción"}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {schedule.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleScheduleTime(schedule._id, !schedule.isActive)}
                  className={`px-3 py-1 rounded text-sm ${
                    schedule.isActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {schedule.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => deleteScheduleTime(schedule._id)}
                  className="text-red-600 hover:text-red-800 px-2 py-1"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
          {scheduleTimes.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay horarios configurados</p>
          )}
        </div>
      </div>

      {/* Gestión de búsquedas */}
      <SearchManagement 
        password={password}
        onError={setError}
        onSuccess={setSuccessMessage}
        onSearchCreated={() => setRefreshTrigger(prev => prev + 1)}
      />

      {/* Gestión de suscripciones */}
      <SubscriptionManagement 
        password={password}
        onError={setError}
        onSuccess={setSuccessMessage}
        refreshTrigger={refreshTrigger}
      />

      {/* Formulario de suscriptores */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">👥 Gestión de Suscriptores</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <button
            onClick={createSubscriber}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "➕ Agregar Suscriptor"}
          </button>
        </div>
      </div>

      {/* Lista de suscriptores */}
      <h3 className="text-xl font-semibold mb-2">Suscriptores</h3>
      <ul className="divide-y divide-gray-200">
        {subscribers.map((s) => (
          <li key={s._id} className="flex justify-between items-center py-3">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{s.email}</span>
                <span className="text-sm text-gray-500">
                  {new Date(s.subscribedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  s.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {s.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openEditModal(s)}
                className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => deleteSubscriber(s._id)}
                className="text-red-600 hover:text-red-800 px-2 py-1"
              >
                ❌
              </button>
            </div>
          </li>
        ))}
        {subscribers.length === 0 && (
          <li className="text-gray-500 py-2">No hay suscriptores registrados</li>
        )}
      </ul>

      {/* Modal de edición */}
      <EditSubscriberModal
        subscriber={editingSubscriber}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSubscriber(null);
        }}
        onSave={saveSubscriberChanges}
      />
    </div>
  );
}
