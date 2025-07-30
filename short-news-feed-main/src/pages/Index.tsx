import { TrendingUp } from "lucide-react"
import PersonalizedNews from "@/components/ui/personalizedNews"
import SubscribeForm from "@/components/ui/suscribeForm"
import { Button } from "@/components/ui/button"
import GlobalTweetsSection from "@/components/ui/globalTweets"

export default function Index() {
  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-[#111827] text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white flex items-center justify-center hover:bg-slate-100 transition">
              <TrendingUp className="w-6 h-6 text-[#111827]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Newsroom</h1>
              <p className="text-sm text-slate-400">Resumen de Noticias Personalizado</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero + Suscripción */}
      <section className="py-20 px-4 bg-white hover:bg-slate-50 transition">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Recibí noticias que sí te importan
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Elegí tu país y sector de interés. Te enviaremos contenido personalizado todos los días.
          </p>
          <div className="max-w-md mx-auto mb-6">
            <SubscribeForm />
          </div>
          <p className="text-sm text-gray-500">📧 Sin spam • 💡 Cancelá cuando quieras</p>
        </div>
      </section>

      {/* Noticias Personalizadas */}
      <section className="py-20 px-4 bg-[#e5e7eb] hover:bg-[#d9dce0] transition">
        <div className="container mx-auto max-w-5xl">
          <h3 className="text-3xl font-semibold text-center text-[#111827] mb-10">
            Tu resumen personalizado
          </h3>
          <PersonalizedNews />
        </div>
      </section>

  {/* Noticias Globales */}
<section className="py-20 px-4 bg-white">
  <div className="container mx-auto max-w-5xl text-center">
    <h3 className="text-3xl font-semibold text-slate-800 mb-4">
      🌍 Contenido viral global
    </h3>
    <p className="text-slate-600 mb-8">
      Lo más viral en redes sociales del mundo.
    </p>
    <GlobalTweetsSection />
  </div>
</section>


      {/* Footer */}
      <footer className="bg-[#111827] text-gray-300 py-10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Newsroom</span>
          </div>
          <p className="text-gray-400 mb-2">Noticias que te interesan, directo a tu inbox.</p>
          <p className="text-sm text-gray-500">© 2025 NS Group. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
