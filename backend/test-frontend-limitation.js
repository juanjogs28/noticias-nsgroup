// Script para analizar las limitaciones del frontend
const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS DE LIMITACIONES EN EL FRONTEND');
console.log('==========================================\n');

// Leer archivos del frontend para buscar limitaciones
const frontendFiles = [
  '../frontend/src/pages/Index.tsx',
  '../frontend/src/components/ui/personalizedNews.tsx',
  '../frontend/src/components/ui/newsList.tsx',
  '../frontend/src/services/newsService.ts',
  '../frontend/src/hooks/usePagination.ts'
];

const limitations = [];

frontendFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📁 Analizando: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar limitaciones específicas
    const patterns = [
      { pattern: /slice\(0,\s*(\d+)\)/g, description: 'Métodos slice con límites' },
      { pattern: /initialPageSize:\s*(\d+)/g, description: 'Tamaño inicial de página' },
      { pattern: /maxPageSize:\s*(\d+)/g, description: 'Tamaño máximo de página' },
      { pattern: /pageSize:\s*(\d+)/g, description: 'Tamaño de página' },
      { pattern: /limit:\s*(\d+)/g, description: 'Límites explícitos' },
      { pattern: /\.slice\((\d+)\)/g, description: 'Slice con parámetros' }
    ];
    
    patterns.forEach(({ pattern, description }) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const limit = match[1];
        limitations.push({
          file: filePath,
          line: lineNumber,
          type: description,
          limit: parseInt(limit),
          context: match[0]
        });
        
        console.log(`   Línea ${lineNumber}: ${match[0]} (${description})`);
      });
    });
    
    console.log('');
  } else {
    console.log(`❌ Archivo no encontrado: ${filePath}\n`);
  }
});

// Analizar las limitaciones encontradas
console.log('📊 RESUMEN DE LIMITACIONES ENCONTRADAS:');
console.log('======================================\n');

if (limitations.length > 0) {
  // Agrupar por tipo de limitación
  const groupedLimitations = limitations.reduce((acc, lim) => {
    if (!acc[lim.type]) acc[lim.type] = [];
    acc[lim.type].push(lim);
    return acc;
  }, {});

  Object.keys(groupedLimitations).forEach(type => {
    console.log(`🔍 ${type}:`);
    groupedLimitations[type].forEach(lim => {
      console.log(`   ${lim.file}:${lim.line} - ${lim.context} (valor: ${lim.limit})`);
    });
    console.log('');
  });

  // Buscar limitaciones específicas de 10
  const limitsOf10 = limitations.filter(l => l.limit === 10);
  if (limitsOf10.length > 0) {
    console.log('⚠️  LIMITACIONES DE 10 ENCONTRADAS:');
    limitsOf10.forEach(lim => {
      console.log(`   ${lim.file}:${lim.line} - ${lim.context}`);
    });
    console.log('');
  }

  // Buscar limitaciones que podrían afectar la visualización
  const displayLimitations = limitations.filter(l => 
    l.type.includes('slice') || 
    l.type.includes('PageSize') ||
    l.type.includes('limit')
  );

  console.log('🎯 LIMITACIONES QUE PODRÍAN AFECTAR LA VISUALIZACIÓN:');
  displayLimitations.forEach(lim => {
    console.log(`   ${lim.file}:${lim.line} - ${lim.context} (${lim.type})`);
  });

} else {
  console.log('✅ NO SE ENCONTRARON LIMITACIONES EXPLÍCITAS EN EL FRONTEND');
}

// Buscar configuraciones de paginación específicas
console.log('\n🔍 CONFIGURACIONES DE PAGINACIÓN:');
console.log('==================================\n');

const paginationConfigs = limitations.filter(l => 
  l.type.includes('PageSize') || l.type.includes('pageSize')
);

if (paginationConfigs.length > 0) {
  console.log('📄 Configuraciones de paginación encontradas:');
  paginationConfigs.forEach(config => {
    console.log(`   ${config.file}:${config.line} - ${config.context}`);
  });
} else {
  console.log('❌ No se encontraron configuraciones de paginación explícitas');
}

// Conclusión
console.log('\n🏁 CONCLUSIÓN:');
console.log('==============\n');

const hasLimitations = limitations.length > 0;
const hasLimitsOf10 = limitations.some(l => l.limit === 10);
const hasDisplayLimitations = limitations.some(l => 
  l.type.includes('slice') || l.type.includes('PageSize')
);

if (hasLimitsOf10) {
  console.log('⚠️  SE ENCONTRARON LIMITACIONES DE 10 EN EL FRONTEND');
  console.log('   Estas limitaciones podrían estar causando que solo se muestren 10 noticias por panel');
} else if (hasDisplayLimitations) {
  console.log('⚠️  SE ENCONTRARON LIMITACIONES DE VISUALIZACIÓN EN EL FRONTEND');
  console.log('   Estas limitaciones podrían estar afectando la cantidad de noticias mostradas');
} else if (hasLimitations) {
  console.log('ℹ️  SE ENCONTRARON LIMITACIONES PERO NO AFECTAN LA VISUALIZACIÓN');
  console.log('   Las limitaciones encontradas no deberían afectar la cantidad de noticias mostradas');
} else {
  console.log('✅ NO SE ENCONTRARON LIMITACIONES EN EL FRONTEND');
  console.log('   El problema podría estar en el backend o en la configuración de la API');
}

console.log('\n📋 RECOMENDACIONES:');
console.log('===================');
console.log('1. Verificar si las limitaciones encontradas están afectando la visualización');
console.log('2. Revisar la configuración de paginación en los componentes');
console.log('3. Comprobar si hay limitaciones en el backend que no se detectaron');
console.log('4. Verificar la respuesta real de la API para confirmar cuántas noticias devuelve');
