// Script de diagnóstico para producción
require("dotenv").config();
const axios = require("axios");

const BASE_URL = "https://noticias-nsgroup-production.up.railway.app";
const ADMIN_PASSWORD = "AdminNSG-+";

async function diagnoseProduction() {
  console.log("🔍 DIAGNÓSTICO DE PRODUCCIÓN");
  console.log("=" .repeat(50));
  
  // 1. Health Check
  try {
    console.log("\n1. 🏥 Health Check");
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log("✅ Health Check OK:", healthResponse.data);
  } catch (error) {
    console.log("❌ Health Check Failed:", error.message);
  }
  
  // 2. Test Admin Auth
  try {
    console.log("\n2. 🔐 Test Admin Authentication");
    const authResponse = await axios.get(`${BASE_URL}/api/admin`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`
      }
    });
    console.log("✅ Admin Auth OK:", authResponse.data);
  } catch (error) {
    console.log("❌ Admin Auth Failed:", error.response?.data || error.message);
  }
  
  // 3. Test Subscribers Endpoint
  try {
    console.log("\n3. 👥 Test Subscribers Endpoint");
    const subsResponse = await axios.get(`${BASE_URL}/api/admin/subscribers`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`
      }
    });
    console.log("✅ Subscribers OK:", subsResponse.data);
  } catch (error) {
    console.log("❌ Subscribers Failed:", error.response?.data || error.message);
  }
  
  // 4. Test Default Config Endpoint
  try {
    console.log("\n4. ⚙️ Test Default Config Endpoint");
    const configResponse = await axios.get(`${BASE_URL}/api/admin/default-config`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`
      }
    });
    console.log("✅ Default Config OK:", configResponse.data);
  } catch (error) {
    console.log("❌ Default Config Failed:", error.response?.data || error.message);
  }
  
  // 5. Test Schedule Times Endpoint
  try {
    console.log("\n5. ⏰ Test Schedule Times Endpoint");
    const scheduleResponse = await axios.get(`${BASE_URL}/api/admin/schedule-times`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`
      }
    });
    console.log("✅ Schedule Times OK:", scheduleResponse.data);
  } catch (error) {
    console.log("❌ Schedule Times Failed:", error.response?.data || error.message);
  }
  
  console.log("\n" + "=" .repeat(50));
  console.log("🏁 DIAGNÓSTICO COMPLETADO");
}

diagnoseProduction().catch(console.error);
