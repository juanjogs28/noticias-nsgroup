// src/components/AdminPanel.tsx
import { useState, useEffect } from "react";
import axios from "axios";

type User = { _id: string; nombre: string; email: string; searchId: string };

export default function AdminPanel() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [searchId, setSearchId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  interface UsersResponse {
  success: boolean;
  users: User[];
}
  async function fetchUsers() {
    try {
     const res = await axios.get<UsersResponse>("http://localhost:3001/api/admin/users");
        setUsers(res.data.users || [])
    } catch (error) {
      console.error("Error cargando usuarios", error);
    }
  }

  async function createUser() {
    if (!nombre || !email || !searchId) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:3001/api/admin/users", { nombre, email, searchId });
      setNombre(""); setEmail(""); setSearchId("");
      fetchUsers();
    } catch (error) {
      console.error("Error creando usuario", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string) {
    try {
      await axios.delete(`http://localhost:3001/api/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error("Error borrando usuario", error);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">📋 Panel Admin</h2>

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Search ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={createUser}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Agregar"}
        </button>
      </div>

      {/* Lista de usuarios */}
      <h3 className="text-xl font-semibold mb-2">Usuarios registrados</h3>
      <ul className="divide-y divide-gray-200">
        {users.map((u) => (
          <li key={u._id} className="flex justify-between items-center py-2">
            <span>{u.nombre} ({u.email}) - SearchID: {u.searchId}</span>
            <button
              onClick={() => deleteUser(u._id)}
              className="text-red-600 hover:text-red-800"
            >
              ❌
            </button>
          </li>
        ))}
        {users.length === 0 && <li className="text-gray-500 py-2">No hay usuarios registrados</li>}
      </ul>
    </div>
  );
}
