// ServiceWorker deshabilitado para evitar interceptación de requests
// Este archivo vacío previene que el navegador registre un ServiceWorker automático
self.addEventListener('install', (event) => {
  // No hacer nada - deshabilitar ServiceWorker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // No hacer nada - deshabilitar ServiceWorker
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // No interceptar ninguna request - dejar que pasen directamente
  return;
});
