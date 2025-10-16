// Script para verificar que el frontend muestra 60 noticias por panel

console.log('🧪 VERIFICACIÓN DE 60 NOTICIAS POR PANEL');
console.log('==========================================\n');

const API_BASE_URL = 'http://localhost:3001';

async function test60NewsPerPanel() {
  console.log('📡 Probando endpoint /api/news/personalized...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/personalized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'default'
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Respuesta exitosa del backend:');
      console.log(`   - País: ${data.pais ? data.pais.length : 0} noticias`);
      console.log(`   - Sector: ${data.sector ? data.sector.length : 0} noticias`);
      console.log(`   - Total: ${(data.pais ? data.pais.length : 0) + (data.sector ? data.sector.length : 0)} noticias`);
      console.log(`   - Fuente: ${data.source || 'desconocida'}`);
      
      // Verificar si hay suficientes noticias para 60 por panel
      const totalNews = (data.pais ? data.pais.length : 0) + (data.sector ? data.sector.length : 0);
      
      if (totalNews >= 180) { // 60 x 3 paneles
        console.log('\n✅ SUFICIENTES NOTICIAS DISPONIBLES:');
        console.log(`   - Total disponible: ${totalNews} noticias`);
        console.log(`   - Capacidad por panel: 60 noticias`);
        console.log(`   - Paneles posibles: ${Math.floor(totalNews / 60)}`);
        console.log('   - ✅ El frontend debería mostrar 60 noticias por panel');
      } else if (totalNews >= 60) {
        console.log('\n⚠️  NOTICIAS PARCIALES:');
        console.log(`   - Total disponible: ${totalNews} noticias`);
        console.log(`   - Solo ${Math.floor(totalNews / 60)} panel(es) con 60 noticias`);
        console.log('   - ⚠️  Algunos paneles tendrán menos de 60 noticias');
      } else {
        console.log('\n❌ NOTICIAS INSUFICIENTES:');
        console.log(`   - Total disponible: ${totalNews} noticias`);
        console.log('   - ❌ No hay suficientes noticias para 60 por panel');
      }
      
      // Mostrar distribución por panel
      console.log('\n📊 DISTRIBUCIÓN POR PANEL:');
      const paisCount = data.pais ? data.pais.length : 0;
      const sectorCount = data.sector ? data.sector.length : 0;
      
      console.log(`   - Panel País: ${paisCount} noticias`);
      console.log(`   - Panel Sector: ${sectorCount} noticias`);
      
      if (paisCount >= 60) {
        console.log('   ✅ Panel País: Suficientes noticias (≥60)');
      } else {
        console.log(`   ⚠️  Panel País: Solo ${paisCount} noticias (<60)`);
      }
      
      if (sectorCount >= 60) {
        console.log('   ✅ Panel Sector: Suficientes noticias (≥60)');
      } else {
        console.log(`   ⚠️  Panel Sector: Solo ${sectorCount} noticias (<60)`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Error HTTP ${response.status}: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
    console.log('💡 Asegúrate de que el backend esté ejecutándose en puerto 3001');
  }
}

// Ejecutar prueba
test60NewsPerPanel()
  .then(() => {
    console.log('\n🏁 Verificación completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error en verificación:', error);
    process.exit(1);
  });
