const fetch = require('node-fetch');

// Configuración de la API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Función para probar diferentes escenarios
async function testDetailedPagination() {
  console.log('🧪 PRUEBAS DETALLADAS DE PAGINACIÓN');
  console.log('=====================================\n');

  const testCases = [
    {
      name: 'Email por defecto',
      body: { email: 'default' },
      description: 'Usando configuración por defecto del sistema'
    },
    {
      name: 'Sin email',
      body: {},
      description: 'Sin parámetros de email'
    },
    {
      name: 'Email específico',
      body: { email: 'test@example.com' },
      description: 'Con email específico (puede no existir)'
    },
    {
      name: 'IDs directos',
      body: { 
        countryId: 'test-country-id',
        sectorId: 'test-sector-id'
      },
      description: 'Con IDs directos (pueden no existir)'
    }
  ];

  const results = {
    testCases: [],
    overallStats: {
      totalRequests: 0,
      successfulRequests: 0,
      allNewsCounts: [],
      exactly10Count: 0,
      lessThan10Count: 0,
      moreThan10Count: 0
    }
  };

  for (const testCase of testCases) {
    console.log(`\n🔍 Probando: ${testCase.name}`);
    console.log(`   Descripción: ${testCase.description}`);
    
    const caseResults = {
      name: testCase.name,
      requests: 0,
      successful: 0,
      failed: 0,
      newsCounts: [],
      sources: [],
      errors: []
    };

    // Hacer 5 peticiones para cada caso de prueba
    for (let i = 1; i <= 5; i++) {
      console.log(`   📡 Petición ${i}/5...`);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/news/personalized`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testCase.body)
        });

        caseResults.requests++;
        results.overallStats.totalRequests++;

        if (response.ok) {
          const data = await response.json();
          caseResults.successful++;
          results.overallStats.successfulRequests++;

          if (data.success) {
            const paisCount = data.pais ? data.pais.length : 0;
            const sectorCount = data.sector ? data.sector.length : 0;
            const totalNews = paisCount + sectorCount;
            
            caseResults.newsCounts.push(totalNews);
            caseResults.sources.push(data.source || 'desconocida');
            results.overallStats.allNewsCounts.push(totalNews);
            
            // Categorizar por cantidad
            if (totalNews === 10) {
              results.overallStats.exactly10Count++;
            } else if (totalNews < 10) {
              results.overallStats.lessThan10Count++;
            } else {
              results.overallStats.moreThan10Count++;
            }
            
            console.log(`      ✅ ${totalNews} noticias (país: ${paisCount}, sector: ${sectorCount}) - Fuente: ${data.source}`);
          } else {
            caseResults.errors.push(data.message || 'Error desconocido');
            console.log(`      ⚠️  Error: ${data.message || 'Error desconocido'}`);
          }
        } else {
          caseResults.failed++;
          const errorText = await response.text();
          caseResults.errors.push(`HTTP ${response.status}: ${errorText}`);
          console.log(`      ❌ HTTP ${response.status}: ${errorText}`);
        }
      } catch (error) {
        caseResults.failed++;
        caseResults.errors.push(error.message);
        console.log(`      ❌ Error de conexión: ${error.message}`);
      }

      // Esperar 500ms entre peticiones
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Calcular estadísticas del caso
    if (caseResults.newsCounts.length > 0) {
      caseResults.averageNews = caseResults.newsCounts.reduce((sum, count) => sum + count, 0) / caseResults.newsCounts.length;
      caseResults.minNews = Math.min(...caseResults.newsCounts);
      caseResults.maxNews = Math.max(...caseResults.newsCounts);
      caseResults.exactly10Count = caseResults.newsCounts.filter(count => count === 10).length;
    }

    results.testCases.push(caseResults);
    
    console.log(`   📊 Resultados: ${caseResults.successful}/${caseResults.requests} exitosas`);
    if (caseResults.newsCounts.length > 0) {
      console.log(`   📈 Noticias: promedio ${caseResults.averageNews.toFixed(2)}, rango ${caseResults.minNews}-${caseResults.maxNews}`);
      console.log(`   🎯 Con 10 noticias: ${caseResults.exactly10Count}/${caseResults.successful} (${((caseResults.exactly10Count / caseResults.successful) * 100).toFixed(1)}%)`);
    }
  }

  // Generar reporte detallado
  console.log('\n\n📊 REPORTE DETALLADO DE PAGINACIÓN');
  console.log('=====================================');

  // Estadísticas por caso de prueba
  results.testCases.forEach(testCase => {
    console.log(`\n🔍 ${testCase.name}:`);
    console.log(`   Peticiones: ${testCase.requests} (${testCase.successful} exitosas, ${testCase.failed} fallidas)`);
    
    if (testCase.newsCounts.length > 0) {
      console.log(`   Noticias: promedio ${testCase.averageNews.toFixed(2)}, rango ${testCase.minNews}-${testCase.maxNews}`);
      console.log(`   Con 10 noticias: ${testCase.exactly10Count}/${testCase.successful} (${((testCase.exactly10Count / testCase.successful) * 100).toFixed(1)}%)`);
      
      // Mostrar distribución
      const distribution = {};
      testCase.newsCounts.forEach(count => {
        distribution[count] = (distribution[count] || 0) + 1;
      });
      
      console.log(`   Distribución: ${Object.keys(distribution).sort((a, b) => parseInt(a) - parseInt(b)).map(count => `${count}(${distribution[count]})`).join(', ')}`);
    }
    
    if (testCase.errors.length > 0) {
      console.log(`   Errores: ${testCase.errors.slice(0, 3).join(', ')}${testCase.errors.length > 3 ? '...' : ''}`);
    }
  });

  // Estadísticas generales
  console.log('\n📈 ESTADÍSTICAS GENERALES:');
  console.log(`Total de peticiones: ${results.overallStats.totalRequests}`);
  console.log(`Peticiones exitosas: ${results.overallStats.successfulRequests}`);
  console.log(`Tasa de éxito: ${((results.overallStats.successfulRequests / results.overallStats.totalRequests) * 100).toFixed(1)}%`);

  if (results.overallStats.allNewsCounts.length > 0) {
    const avgNews = results.overallStats.allNewsCounts.reduce((sum, count) => sum + count, 0) / results.overallStats.allNewsCounts.length;
    const minNews = Math.min(...results.overallStats.allNewsCounts);
    const maxNews = Math.max(...results.overallStats.allNewsCounts);
    
    console.log(`\n📊 NOTICIAS POR PETICIÓN:`);
    console.log(`Promedio: ${avgNews.toFixed(2)}`);
    console.log(`Rango: ${minNews} - ${maxNews}`);
    console.log(`Con exactamente 10: ${results.overallStats.exactly10Count} (${((results.overallStats.exactly10Count / results.overallStats.successfulRequests) * 100).toFixed(1)}%)`);
    console.log(`Con menos de 10: ${results.overallStats.lessThan10Count} (${((results.overallStats.lessThan10Count / results.overallStats.successfulRequests) * 100).toFixed(1)}%)`);
    console.log(`Con más de 10: ${results.overallStats.moreThan10Count} (${((results.overallStats.moreThan10Count / results.overallStats.successfulRequests) * 100).toFixed(1)}%)`);

    // Distribución general
    const distribution = {};
    results.overallStats.allNewsCounts.forEach(count => {
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    console.log(`\n📋 DISTRIBUCIÓN GENERAL:`);
    Object.keys(distribution).sort((a, b) => parseInt(a) - parseInt(b)).forEach(count => {
      const percentage = ((distribution[count] / results.overallStats.successfulRequests) * 100).toFixed(1);
      console.log(`   ${count} noticias: ${distribution[count]} veces (${percentage}%)`);
    });
  }

  // Conclusión final
  console.log('\n🔍 CONCLUSIÓN FINAL:');
  const exactly10Percentage = (results.overallStats.exactly10Count / results.overallStats.successfulRequests) * 100;
  
  if (exactly10Percentage === 100) {
    console.log('✅ CONFIRMADO: La API devuelve EXACTAMENTE 10 noticias en TODAS las peticiones');
  } else if (exactly10Percentage >= 80) {
    console.log('⚠️  MAYORMENTE CONFIRMADO: La API devuelve 10 noticias en la mayoría de peticiones');
  } else if (exactly10Percentage >= 50) {
    console.log('⚠️  PARCIALMENTE CONFIRMADO: La API devuelve 10 noticias en algunas peticiones');
  } else {
    console.log('❌ NO CONFIRMADO: La API NO devuelve consistentemente 10 noticias por petición');
  }

  return results;
}

// Ejecutar pruebas
if (require.main === module) {
  testDetailedPagination()
    .then(results => {
      console.log('\n🏁 Pruebas detalladas completadas');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error ejecutando pruebas detalladas:', error);
      process.exit(1);
    });
}

module.exports = { testDetailedPagination };
