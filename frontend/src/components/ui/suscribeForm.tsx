import React, { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { buildApiUrl, API_CONFIG } from "../../config/api"

type FormData = {
  email: string
  country: string
  sector: string
}

interface SubscribeFormProps {
  onSuccess?: (email: string, country: string, sector: string) => void
}

export default function SubscribeForm({ onSuccess }: SubscribeFormProps) {
  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      country: "",
      sector: "",
    },
  })

  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail")
    if (storedEmail) {
      setLoadingPrefs(true)
      fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.PREFERENCES}/${storedEmail}`))
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            form.reset({
              email: storedEmail,
              country: data.country,
              sector: data.sector,
            })
            setIsSubscribed(true)
          } else {
            localStorage.removeItem("userEmail")
            localStorage.removeItem("userCountry")
            localStorage.removeItem("userSector")
            setIsSubscribed(false)
          }
        })
        .catch(() => {
          setIsSubscribed(false)
        })
        .finally(() => setLoadingPrefs(false))
    }
  }, [form])

  const onSubmit = async (data: FormData) => {
    try {
      let url = buildApiUrl(API_CONFIG.ENDPOINTS.SUBSCRIBE)
      let method: "POST" | "PUT" = "POST"

      const storedEmail = localStorage.getItem("userEmail")

      if (storedEmail && storedEmail === data.email) {
        url = buildApiUrl(API_CONFIG.ENDPOINTS.PREFERENCES)
        method = "PUT"
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        localStorage.setItem("userEmail", data.email)
        localStorage.setItem("userCountry", data.country)
        localStorage.setItem("userSector", data.sector)

        setIsSubscribed(true)

        if (onSuccess) {
          onSuccess(data.email, data.country, data.sector)
        }

        toast.success(
          method === "POST"
            ? "✅ Suscripción exitosa"
            : "✅ Preferencias actualizadas"
        )
      } else {
        toast.error("⚠️ " + result.message)
      }
    } catch (error) {
      console.error("❌ Error:", error)
      toast.error("❌ Error al enviar el formulario")
    }
  }

  if (loadingPrefs) {
    return <p>Cargando preferencias...</p>
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 max-w-md mx-auto"
    >
      {/* Email */}
      <Controller
        name="email"
        control={form.control}
        rules={{
          required: "Email es requerido",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Formato de email inválido",
          },
        }}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <label className="block font-medium" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="tu@email.com"
              {...field}
              className={`w-full border rounded px-3 py-2 ${
                fieldState.error ? "border-red-500" : ""
              }`}
              disabled={isSubscribed}
            />
            {fieldState.error && (
              <p className="text-sm text-red-600">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      {/* País */}
      <Controller
        name="country"
        control={form.control}
        rules={{ required: "El país es obligatorio" }}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <label className="block font-medium" htmlFor="country">
              País
            </label>
            <select
              id="country"
              {...field}
              className={`w-full border rounded px-3 py-2 ${
                fieldState.error ? "border-red-500" : ""
              }`}
            >
              <option value="">Seleccioná un país</option>
              <option value="uy">Uruguay</option>
              <option value="ar">Argentina</option>
              <option value="cl">Chile</option>
              <option value="mx">México</option>
              <option value="py">Paraguay</option>
              <option value="ec">Ecuador</option>
              <option value="pa">Panamá</option>
              <option value="pe">Perú</option>
            </select>
            {fieldState.error && (
              <p className="text-sm text-red-600">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Sector */}
      <Controller
        name="sector"
        control={form.control}
        rules={{ required: "Seleccioná un sector" }}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <label className="block font-medium" htmlFor="sector">
              Sector de Noticias
            </label>
            <select
              id="sector"
              {...field}
              className={`w-full border rounded px-3 py-2 ${
                fieldState.error ? "border-red-500" : ""
              }`}
            >
              <option value="">Seleccioná un sector</option>
              <option value="health">Salud</option>
              <option value="sports">Deportes</option>
              <option value="economy">Economía</option>
              <option value="politics">Política</option>
              <option value="general">General</option>
            </select>
            {fieldState.error && (
              <p className="text-sm text-red-600">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {isSubscribed ? "Actualizar preferencias" : "Suscribirse"}
      </button>

      {isSubscribed && <UnsubscribeButton />}
    </form>
  )
}

// Botón para darse de baja
function UnsubscribeButton() {
  const email = localStorage.getItem("userEmail")

  const handleUnsubscribe = async () => {
    if (!email) {
      toast.error("⚠️ No hay usuario suscripto")
      return
    }

    const confirmed = window.confirm("¿Seguro quieres darte de baja?")
    if (!confirmed) return

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.UNSUBSCRIBE), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.success) {
        localStorage.removeItem("userEmail")
        localStorage.removeItem("userCountry")
        localStorage.removeItem("userSector")

        toast("🛑 Te diste de baja", {
          description: "Podés volver cuando quieras ❤️",
        })

        window.location.reload()
      } else {
        toast.error("⚠️ " + result.message)
      }
    } catch (error) {
      console.error("❌ Error al darse de baja:", error)
      toast.error("❌ Error al darse de baja")
    }
  }

  return (
    <button
      type="button"
      onClick={handleUnsubscribe}
      className="mt-4 ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
    >
      Darse de baja
    </button>
  )
}
