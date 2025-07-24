        
import { TrendingUp } from "lucide-react"
import PersonalizedNews from "@/components/ui/personalizedNews"
import SubscribeForm from "@/components/ui/suscribeForm"
import { Button } from "@/components/ui/button"

export default function Index() {
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
                <p className="text-sm text-slate-600">Resumen de Noticias Personalizado</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero + Suscripción */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Recibí noticias que sí te importan.
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Elegí tu país y sector de interés. Te enviaremos contenido personalizado todos los días.
          </p>
          <div className="max-w-md mx-auto mb-4">
            <SubscribeForm />
          </div>
          <p className="text-sm text-slate-500">
            📧 Sin spam • 💡 Cancela cuando quieras
          </p>
        </div>
      </section>

      {/* Noticias Personalizadas */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="container mx-auto max-w-5xl">
          <h3 className="text-3xl font-semibold text-slate-900 text-center mb-10">
            Tu resumen personalizado
          </h3>
          <PersonalizedNews />
        </div>
      </section>

      {/* Opcional: Noticias Globales */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h3 className="text-3xl font-semibold text-slate-900 mb-4">
            🌍 Contenido viral global
          </h3>
          <p className="text-slate-600 mb-8">
            Noticias que están dando que hablar en todo el mundo.
          </p>
          {/* Si querés usar tu sección original, podrías importar aquí <TrendingNewsSection /> */}
          <Button variant="link" onClick={() => alert("Sección aún en construcción")}>
            Ver tendencias globales
          </Button>
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
          <p className="text-slate-400 mb-2">
            Noticias que te interesan, directo a tu inbox.
          </p>
          <p className="text-sm text-slate-500">© 2024 NS Group. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
