const fetch = require('node-fetch');

// Configuración de la API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = 'test@example.com';

// Función para hacer petición a la API
async function testPagination() {
  console.log('🧪 INICIANDO PRUEBAS DE PAGINACIÓN');
  console.log('=====================================\n');

  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    newsCounts: [],
    averageNewsPerRequest: 0,
    minNews: Infinity,
    maxNews: 0,
    exactly10Count: 0,
    lessThan10Count: 0,
    moreThan10Count: 0
  };

  // Hacer 10 peticiones para verificar consistencia
  for (let i = 1; i <= 10; i++) {
    console.log(`📡 Petición ${i}/10...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/news/personalized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: TEST_EMAIL
        })
      });

      results.totalRequests++;

      if (response.ok) {
        const data = await response.json();
        results.successfulRequests++;
        
        if (data.success) {
          const paisCount = data.pais ? data.pais.length : 0;
          const sectorCount = data.sector ? data.sector.length : 0;
          const totalNews = paisCount + sectorCount;
          
          results.newsCounts.push(totalNews);
          results.minNews = Math.min(results.minNews, totalNews);
          results.maxNews = Math.max(results.maxNews, totalNews);
          
          // Categorizar por cantidad
          if (totalNews === 10) {
            results.exactly10Count++;
          } else if (totalNews < 10) {
            results.lessThan10Count++;
          } else {
            results.moreThan10Count++;
          }
          
          console.log(`   ✅ Éxito: ${totalNews} noticias (país: ${paisCount}, sector: ${sectorCount})`);
          console.log(`   📊 Fuente: ${data.source || 'desconocida'}`);
        } else {
          console.log(`   ⚠️  Respuesta con error: ${data.message || 'Error desconocido'}`);
        }
      } else {
        results.failedRequests++;
        const errorText = await response.text();
        console.log(`   ❌ Error HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      results.failedRequests++;
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }

    // Esperar 1 segundo entre peticiones para evitar saturar
    if (i < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Calcular estadísticas
  if (results.newsCounts.length > 0) {
    results.averageNewsPerRequest = results.newsCounts.reduce((sum, count) => sum + count, 0) / results.newsCounts.length;
  }

  // Generar reporte
  console.log('\n📊 REPORTE DE PRUEBAS DE PAGINACIÓN');
  console.log('=====================================');
  console.log(`Total de peticiones: ${results.totalRequests}`);
  console.log(`Peticiones exitosas: ${results.successfulRequests}`);
  console.log(`Peticiones fallidas: ${results.failedRequests}`);
  console.log(`Tasa de éxito: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%`);
  
  if (results.newsCounts.length > 0) {
    console.log('\n📈 ESTADÍSTICAS DE NOTICIAS:');
    console.log(`Promedio de noticias por petición: ${results.averageNewsPerRequest.toFixed(2)}`);
    console.log(`Mínimo de noticias: ${results.minNews}`);
    console.log(`Máximo de noticias: ${results.maxNews}`);
    console.log(`Desviación estándar: ${calculateStandardDeviation(results.newsCounts).toFixed(2)}`);
    
    console.log('\n🎯 ANÁLISIS DE PAGINACIÓN:');
    console.log(`Peticiones con exactamente 10 noticias: ${results.exactly10Count} (${((results.exactly10Count / results.successfulRequests) * 100).toFixed(1)}%)`);
    console.log(`Peticiones con menos de 10 noticias: ${results.lessThan10Count} (${((results.lessThan10Count / results.successfulRequests) * 100).toFixed(1)}%)`);
    console.log(`Peticiones con más de 10 noticias: ${results.moreThan10Count} (${((results.moreThan10Count / results.successfulRequests) * 100).toFixed(1)}%)`);
    
    console.log('\n📋 DISTRIBUCIÓN DE NOTICIAS:');
    const distribution = {};
    results.newsCounts.forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    Object.keys(distribution).sort((a, b) => parseInt(a) - parseInt(b)).forEach(count => {
      const percentage = ((distribution[count] / results.successfulRequests) * 100).toFixed(1);
      console.log(`   ${count} noticias: ${distribution[count]} veces (${percentage}%)`);
    });
  }

  // Conclusión
  console.log('\n🔍 CONCLUSIÓN:');
  if (results.exactly10Count === results.successfulRequests) {
    console.log('✅ CONFIRMADO: La API devuelve exactamente 10 noticias por petición');
  } else if (results.exactly10Count > 0) {
    console.log('⚠️  PARCIALMENTE CONFIRMADO: Algunas peticiones devuelven 10 noticias, pero no todas');
  } else {
    console.log('❌ NO CONFIRMADO: La API NO devuelve consistentemente 10 noticias por petición');
  }

  return results;
}

// Función para calcular desviación estándar
function calculateStandardDeviation(numbers) {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  return Math.sqrt(avgSquaredDiff);
}

// Ejecutar pruebas
if (require.main === module) {
  testPagination()
    .then(results => {
      console.log('\n🏁 Pruebas completadas');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error ejecutando pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testPagination };
