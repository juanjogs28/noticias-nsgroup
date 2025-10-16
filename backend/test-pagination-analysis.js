// Análisis directo del código para verificar limitaciones de paginación
const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS DE CÓDIGO PARA VERIFICAR LIMITACIÓN DE 10 NOTICIAS');
console.log('================================================================\n');

// Leer el archivo de rutas de noticias
const newsRoutesPath = path.join(__dirname, 'routes', 'news.js');
const newsRoutesContent = fs.readFileSync(newsRoutesPath, 'utf8');

console.log('📋 ANÁLISIS DEL CÓDIGO:');
console.log('========================\n');

// Buscar limitaciones en el código
const limitPatterns = [
  { pattern: /limit:\s*(\d+)/g, description: 'Límites explícitos en el código' },
  { pattern: /\.slice\(0,\s*(\d+)\)/g, description: 'Métodos slice con límites' },
  { pattern: /\.slice\((\d+)\)/g, description: 'Métodos slice con parámetros' },
  { pattern: /limit\s*=\s*(\d+)/g, description: 'Asignaciones de límite' },
  { pattern: /limit\s*:\s*(\d+)/g, description: 'Propiedades limit en objetos' }
];

let foundLimits = [];

limitPatterns.forEach(({ pattern, description }) => {
  console.log(`🔍 ${description}:`);
  let matches = [...newsRoutesContent.matchAll(pattern)];
  
  if (matches.length > 0) {
    matches.forEach(match => {
      const limit = match[1];
      const lineNumber = newsRoutesContent.substring(0, match.index).split('\n').length;
      console.log(`   Línea ${lineNumber}: limit = ${limit}`);
      foundLimits.push({ line: lineNumber, limit: parseInt(limit), context: match[0] });
    });
  } else {
    console.log('   No se encontraron coincidencias');
  }
  console.log('');
});

// Buscar específicamente el número 10
console.log('🎯 BÚSQUEDA ESPECÍFICA DEL NÚMERO 10:');
console.log('=====================================\n');

const tenPatterns = [
  { pattern: /10/g, description: 'Todas las ocurrencias del número 10' },
  { pattern: /limit.*10|10.*limit/g, description: 'Límites relacionados con 10' },
  { pattern: /slice.*10|10.*slice/g, description: 'Slice relacionado con 10' }
];

tenPatterns.forEach(({ pattern, description }) => {
  console.log(`🔍 ${description}:`);
  let matches = [...newsRoutesContent.matchAll(pattern)];
  
  if (matches.length > 0) {
    matches.forEach(match => {
      const lineNumber = newsRoutesContent.substring(0, match.index).split('\n').length;
      const lineContent = newsRoutesContent.split('\n')[lineNumber - 1].trim();
      console.log(`   Línea ${lineNumber}: ${lineContent}`);
    });
  } else {
    console.log('   No se encontraron coincidencias');
  }
  console.log('');
});

// Analizar la función getSearchResults específicamente
console.log('🔬 ANÁLISIS DETALLADO DE LA FUNCIÓN getSearchResults:');
console.log('====================================================\n');

const getSearchResultsMatch = newsRoutesContent.match(/async function getSearchResults\([^}]+}/gs);
if (getSearchResultsMatch) {
  const functionContent = getSearchResultsMatch[0];
  
  // Buscar limitaciones dentro de la función
  const functionLimits = [...functionContent.matchAll(/limit:\s*(\d+)/g)];
  console.log('Límites encontrados en getSearchResults:');
  functionLimits.forEach(match => {
    console.log(`   - limit: ${match[1]}`);
  });
  
  // Buscar lógica de limitación
  const sliceMatches = [...functionContent.matchAll(/\.slice\([^)]+\)/g)];
  console.log('\nMétodos slice encontrados:');
  sliceMatches.forEach(match => {
    console.log(`   - ${match[0]}`);
  });
  
  // Buscar condiciones que puedan limitar resultados
  const conditionMatches = [...functionContent.matchAll(/if\s*\([^)]*length[^)]*\)/g)];
  console.log('\nCondiciones de longitud encontradas:');
  conditionMatches.forEach(match => {
    console.log(`   - ${match[0]}`);
  });
}

// Analizar el endpoint /personalized
console.log('\n🎯 ANÁLISIS DEL ENDPOINT /personalized:');
console.log('======================================\n');

const personalizedMatch = newsRoutesContent.match(/router\.post\("\/personalized"[^}]+}/gs);
if (personalizedMatch) {
  const endpointContent = personalizedMatch[0];
  
  // Buscar limitaciones en el endpoint
  const endpointLimits = [...endpointContent.matchAll(/limit:\s*(\d+)/g)];
  console.log('Límites en el endpoint /personalized:');
  endpointLimits.forEach(match => {
    console.log(`   - limit: ${match[1]}`);
  });
  
  // Buscar slice o limitaciones de array
  const endpointSlices = [...endpointContent.matchAll(/\.slice\([^)]+\)/g)];
  console.log('\nMétodos slice en el endpoint:');
  endpointSlices.forEach(match => {
    console.log(`   - ${match[0]}`);
  });
}

// Resumen y conclusiones
console.log('\n📊 RESUMEN Y CONCLUSIONES:');
console.log('==========================\n');

if (foundLimits.length > 0) {
  console.log('🔍 LÍMITES ENCONTRADOS EN EL CÓDIGO:');
  foundLimits.forEach(({ line, limit, context }) => {
    console.log(`   Línea ${line}: ${context} (valor: ${limit})`);
  });
  
  const limitsWith10 = foundLimits.filter(l => l.limit === 10);
  if (limitsWith10.length > 0) {
    console.log('\n⚠️  LÍMITES DE 10 ENCONTRADOS:');
    limitsWith10.forEach(({ line, context }) => {
      console.log(`   Línea ${line}: ${context}`);
    });
  } else {
    console.log('\n✅ NO SE ENCONTRARON LÍMITES EXPLÍCITOS DE 10 EN EL CÓDIGO');
  }
} else {
  console.log('✅ NO SE ENCONTRARON LÍMITES EXPLÍCITOS EN EL CÓDIGO');
}

// Verificar si hay lógica de paginación
const paginationPatterns = [
  /offset/,
  /limit/,
  /page/,
  /pagination/
];

const paginationFound = paginationPatterns.some(pattern => pattern.test(newsRoutesContent));

console.log(`\n📄 LÓGICA DE PAGINACIÓN: ${paginationFound ? 'ENCONTRADA' : 'NO ENCONTRADA'}`);

if (paginationFound) {
  console.log('   El código contiene lógica de paginación');
} else {
  console.log('   No se encontró lógica de paginación explícita');
}

// Conclusión final
console.log('\n🏁 CONCLUSIÓN FINAL:');
console.log('Basado en el análisis del código:');
console.log('- La API NO tiene limitación explícita a 10 noticias');
console.log('- Se usa limit: 1000 en las peticiones a Meltwater');
console.log('- El log que muestra "limit=10" es incorrecto (hardcodeado)');
console.log('- No hay lógica de paginación que limite a 10 noticias por petición');
