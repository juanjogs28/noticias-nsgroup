require("dotenv").config();
const fetch = require("node-fetch");

const MELTWATER_API_URL = "https://api.meltwater.com";
const MELTWATER_TOKEN = process.env.MELTWATER_API_TOKEN;

async function testMeltwaterAPI() {
  console.log("🧪 Probando API de Meltwater...");
  console.log(`🔑 Token configurado: ${MELTWATER_TOKEN ? 'Sí' : 'No'}`);
  
  if (!MELTWATER_TOKEN) {
    console.error("❌ MELTWATER_API_TOKEN no configurado");
    return;
  }

  // IDs de configuración por defecto
  const searchIds = {
    country: "27551367",
    sector: "27817676"
  };

  for (const [type, searchId] of Object.entries(searchIds)) {
    console.log(`\n🔍 Probando ${type} (ID: ${searchId})...`);
    
    try {
      const now = new Date();
      const end = now.toISOString().slice(0, 19);
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
      
      console.log(`📅 Rango: ${startDate} a ${end}`);
      
      const response = await fetch(`${MELTWATER_API_URL}/v3/search/${searchId}`, {
        method: "POST",
        headers: {
          apikey: MELTWATER_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tz: "America/Montevideo",
          start: startDate,
          end: end,
          limit: 2000,
          language: "es",
          content_type: "news",
          sort: "relevance",
          include_social: true,
          include_blog: true,
          include_forum: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const documents = data.result?.documents || [];
        console.log(`✅ ${type}: ${documents.length} artículos obtenidos`);
        
        if (documents.length > 0) {
          console.log(`   📰 Primeros 3 artículos:`);
          documents.slice(0, 3).forEach((doc, index) => {
            console.log(`     ${index + 1}. ${doc.content?.title || 'Sin título'}`);
            console.log(`        Fuente: ${doc.source?.name || 'Sin fuente'}`);
            console.log(`        Fecha: ${doc.published_date || 'Sin fecha'}`);
          });
        }
      } else {
        console.log(`❌ ${type}: Error ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${type}: Error de conexión - ${error.message}`);
    }
  }
}

testMeltwaterAPI();
