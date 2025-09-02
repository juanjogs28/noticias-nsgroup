require("dotenv").config();

const BASE_URL = "http://localhost:3001";
const ADMIN_PASSWORD = "AdminNSG-+";

async function testAuth() {
  console.log("🧪 Probando autenticación de admin...\n");

  // Test 1: Acceso sin contraseña (debe fallar)
  console.log("1️⃣ Test: Acceso sin contraseña");
  try {
    const response = await fetch(`${BASE_URL}/api/admin`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 2: Acceso con contraseña incorrecta (debe fallar)
  console.log("2️⃣ Test: Acceso con contraseña incorrecta");
  try {
    const response = await fetch(`${BASE_URL}/api/admin?password=wrongpassword`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 3: Acceso con contraseña correcta en query (debe funcionar)
  console.log("3️⃣ Test: Acceso con contraseña correcta en query");
  try {
    const response = await fetch(`${BASE_URL}/api/admin?password=${ADMIN_PASSWORD}`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 4: Acceso con contraseña en header Authorization (debe funcionar)
  console.log("4️⃣ Test: Acceso con contraseña en header Authorization");
  try {
    const response = await fetch(`${BASE_URL}/api/admin`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`
      }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  // Test 5: Acceso a suscriptores con contraseña (debe funcionar)
  console.log("5️⃣ Test: Acceso a suscriptores con contraseña");
  try {
    const response = await fetch(`${BASE_URL}/api/admin/subscribers?password=${ADMIN_PASSWORD}`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log("");

  console.log("✅ Tests de autenticación completados");
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth };
