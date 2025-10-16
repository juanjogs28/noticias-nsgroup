require("dotenv").config();
const fetch = require("node-fetch");

const MELTWATER_API_URL = "https://api.meltwater.com";
const MELTWATER_TOKEN = process.env.MELTWATER_API_TOKEN;

async function debugMeltwaterAPI() {
  console.log("🔍 DEBUGGING API DE MELTWATER");
  console.log(`🔑 Token configurado: ${MELTWATER_TOKEN ? 'Sí' : 'No'}`);
  
  if (!MELTWATER_TOKEN) {
    console.error("❌ MELTWATER_API_TOKEN no configurado");
    return;
  }

  const searchId = "27551367"; // País Uruguay
  console.log(`\n🔍 Probando searchId: ${searchId}`);
  
  try {
    const now = new Date();
    const end = now.toISOString().slice(0, 19);
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
    
    console.log(`📅 Rango: ${startDate} a ${end}`);
    
    // Test 1: Límite 10
    console.log("\n🧪 TEST 1: Límite 10");
    const response1 = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
      method: "POST",
      headers: {
        apikey: MELTWATER_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tz: "America/Montevideo",
        start: startDate,
        end: end,
        limit: 10,
        language: "es",
        content_type: "news",
        sort: "relevance"
      }),
    });

    if (response1.ok) {
      const data1 = await response1.json();
      const documents1 = data1.result?.documents || [];
      console.log(`✅ Límite 10: ${documents1.length} artículos`);
    } else {
      console.log(`❌ Límite 10: Error ${response1.status}`);
    }

    // Test 2: Límite 100
    console.log("\n🧪 TEST 2: Límite 100");
    const response2 = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
      method: "POST",
      headers: {
        apikey: MELTWATER_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tz: "America/Montevideo",
        start: startDate,
        end: end,
        limit: 100,
        language: "es",
        content_type: "news",
        sort: "relevance"
      }),
    });

    if (response2.ok) {
      const data2 = await response2.json();
      const documents2 = data2.result?.documents || [];
      console.log(`✅ Límite 100: ${documents2.length} artículos`);
    } else {
      console.log(`❌ Límite 100: Error ${response2.status}`);
    }

    // Test 3: Límite 1000
    console.log("\n🧪 TEST 3: Límite 1000");
    const response3 = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
      method: "POST",
      headers: {
        apikey: MELTWATER_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tz: "America/Montevideo",
        start: startDate,
        end: end,
        limit: 1000,
        language: "es",
        content_type: "news",
        sort: "relevance"
      }),
    });

    if (response3.ok) {
      const data3 = await response3.json();
      const documents3 = data3.result?.documents || [];
      console.log(`✅ Límite 1000: ${documents3.length} artículos`);
      
      // Mostrar estructura de respuesta
      console.log("\n📊 ESTRUCTURA DE RESPUESTA:");
      console.log(`   - Total documentos: ${documents3.length}`);
      console.log(`   - Primer documento:`, documents3[0] ? {
        id: documents3[0].id,
        title: documents3[0].content?.title,
        source: documents3[0].source?.name,
        published_date: documents3[0].published_date
      } : "No hay documentos");
      
      // Verificar si hay metadatos de paginación
      console.log("\n📋 METADATOS DE RESPUESTA:");
      console.log(`   - result.total: ${data3.result?.total || 'No disponible'}`);
      console.log(`   - result.count: ${data3.result?.count || 'No disponible'}`);
      console.log(`   - result.offset: ${data3.result?.offset || 'No disponible'}`);
      console.log(`   - result.limit: ${data3.result?.limit || 'No disponible'}`);
      
    } else {
      console.log(`❌ Límite 1000: Error ${response3.status}`);
      const errorText = await response3.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
  }
}

debugMeltwaterAPI();
