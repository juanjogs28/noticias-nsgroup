// Script de pruebas para verificar que el servidor funciona correctamente

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Función para probar el endpoint de salud
async function testHealthEndpoint() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health endpoint funcionando:', data);
      return true;
    } else {
      console.log('❌ Health endpoint falló:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en health endpoint:', error.message);
    return false;
  }
}

// Función para probar la suscripción
async function testSubscribeEndpoint() {
  try {
    const testEmail = `test${Date.now()}@example.com`;
    
    const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Subscribe endpoint funcionando:', data);
      return true;
    } else {
      console.log('❌ Subscribe endpoint falló:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en subscribe endpoint:', error.message);
    return false;
  }
}

// Función para probar obtener suscriptores
async function testSubscribersEndpoint() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/subscribers`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Subscribers endpoint funcionando:', data);
      return true;
    } else {
      console.log('❌ Subscribers endpoint falló:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en subscribers endpoint:', error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🧪 Iniciando pruebas del servidor...\n');
  
  const healthTest = await testHealthEndpoint();
  const subscribeTest = await testSubscribeEndpoint();
  const subscribersTest = await testSubscribersEndpoint();
  
  console.log('\n📊 Resumen de pruebas:');
  console.log(`Health endpoint: ${healthTest ? '✅' : '❌'}`);
  console.log(`Subscribe endpoint: ${subscribeTest ? '✅' : '❌'}`);
  console.log(`Subscribers endpoint: ${subscribersTest ? '✅' : '❌'}`);
  
  const allPassed = healthTest && subscribeTest && subscribersTest;
  console.log(`\n${allPassed ? '🎉 Todas las pruebas pasaron' : '⚠️ Algunas pruebas fallaron'}`);
}

// Ejecutar pruebas
runAllTests().catch(console.error); 