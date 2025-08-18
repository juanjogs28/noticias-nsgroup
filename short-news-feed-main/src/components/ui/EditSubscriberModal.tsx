import { useState, useEffect } from "react";

interface Subscriber {
  _id: string;
  email: string;
  countrySearchId: string;
  sectorSearchId: string;
  subscribedAt: string;
  isActive: boolean;
  isDefaultCountry: boolean;
  isDefaultSector: boolean;
}

interface EditSubscriberModalProps {
  subscriber: Subscriber | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSubscriber: Partial<Subscriber>) => Promise<void>;
}

export default function EditSubscriberModal({ 
  subscriber, 
  isOpen, 
  onClose, 
  onSave 
}: EditSubscriberModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    countrySearchId: "",
    sectorSearchId: "",
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Actualizar formulario cuando cambie el suscriptor
  useEffect(() => {
    if (subscriber) {
      setFormData({
        email: subscriber.email,
        countrySearchId: subscriber.countrySearchId || "",
        sectorSearchId: subscriber.sectorSearchId || "",
        isActive: subscriber.isActive
      });
      setError("");
    }
  }, [subscriber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriber) return;

    setLoading(true);
    setError("");

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Error actualizando suscriptor");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !subscriber) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            ✏️ Editar Suscriptor
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="countrySearchId" className="block text-sm font-medium text-gray-700 mb-1">
              ID Búsqueda País
            </label>
            <input
              type="text"
              id="countrySearchId"
              value={formData.countrySearchId}
              onChange={(e) => handleChange("countrySearchId", e.target.value)}
              placeholder="Dejar vacío si no aplica"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="sectorSearchId" className="block text-sm font-medium text-gray-700 mb-1">
              ID Búsqueda Sector
            </label>
            <input
              type="text"
              id="sectorSearchId"
              value={formData.sectorSearchId}
              onChange={(e) => handleChange("sectorSearchId", e.target.value)}
              placeholder="Dejar vacío si no aplica"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Suscriptor Activo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
