import AdminPanel from "../components/ui/AdminPanel";

export default function AdminPage() {
  return (
    <div className="min-h-screen tech-background network-pattern">
      {/* Partículas flotantes */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* Header del Admin */}
      <header className="tech-header">
        <div className="container-spacing section-spacing relative z-10">
          <div className="text-center">
            <h1 className="tech-title text-4xl mb-2">
              🔐 ADMIN PANEL
            </h1>
            <p className="tech-subtitle text-lg mb-4">
              Gestión del Sistema de Noticias
            </p>
            <div className="text-xs text-gray-400">
              Acceso restringido a administradores autorizados
            </div>
          </div>
        </div>
      </header>

      {/* Contenido del Admin */}
      <main className="container-spacing section-spacing">
        <AdminPanel />
      </main>
    </div>
  );
}
