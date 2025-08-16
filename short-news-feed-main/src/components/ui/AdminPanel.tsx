// src/components/AdminPanel.tsx
import { useEffect, useState } from "react";
import axios from "axios";

interface Subscriber {
  _id: string;
  email: string;
  countrySearchId: string;
  sectorSearchId: string;
  subscribedAt: string;
  isActive: boolean;
}

export default function AdminPanel() {
  const [email, setEmail] = useState("");
  const [countrySearchId, setCountrySearchId] = useState("");
  const [sectorSearchId, setSectorSearchId] = useState("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get<{ subscribers: Subscriber[] }>(
        "http://localhost:3001/api/admin/subscribers"
      );
      setSubscribers(res.data.subscribers || []);
    } catch (err) {
      console.error("Error cargando suscriptores:", err);
      setError("Error cargando suscriptores");
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
      await axios.post("http://localhost:3001/api/admin/subscribers", {
        email,
        countrySearchId,
        sectorSearchId,
      });
      setEmail("");
      setCountrySearchId("");
      setSectorSearchId("");
      fetchSubscribers();
    } catch (err: any) {
      console.error("Error creando suscriptor:", err);
      setError(err.response?.data?.message || "Error creando suscriptor");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscriber = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/admin/subscribers/${id}`);
      fetchSubscribers();
    } catch (err) {
      console.error("Error borrando suscriptor:", err);
      setError("Error borrando suscriptor");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">📋 Panel Admin</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="ID búsqueda país"
          value={countrySearchId}
          onChange={(e) => setCountrySearchId(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="ID búsqueda sector"
          value={sectorSearchId}
          onChange={(e) => setSectorSearchId(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={createSubscriber}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Agregar"}
        </button>
      </div>

      {/* Lista de suscriptores */}
      <h3 className="text-xl font-semibold mb-2">Suscriptores</h3>
      <ul className="divide-y divide-gray-200">
        {subscribers.map((s) => (
          <li key={s._id} className="flex justify-between items-center py-2">
            <span>
              {s.email} | País ID: {s.countrySearchId || "—"} | Sector ID:{" "}
              {s.sectorSearchId || "—"} | {new Date(s.subscribedAt).toLocaleString()}
            </span>
            <button
              onClick={() => deleteSubscriber(s._id)}
              className="text-red-600 hover:text-red-800"
            >
              ❌
            </button>
          </li>
        ))}
        {subscribers.length === 0 && (
          <li className="text-gray-500 py-2">No hay suscriptores registrados</li>
        )}
      </ul>
    </div>
  );
}
