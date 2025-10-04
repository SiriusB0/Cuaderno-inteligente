// Script para probar la generación de HTML de recursos
console.log("=== PRUEBA DE GENERACIÓN DE HTML ===");

// Simular datos de un recurso
const mockResource = {
    id: 'test-resource',
    name: 'Test Resource.txt',
    type: 'text',
    size: 1024,
    uploadedAt: new Date().toISOString(),
    indexed: true
};

// Simular las variables que usa createResourceItem
const isIndexed = mockResource.indexed !== false;
const indexIcon = isIndexed ? 'search' : 'search-x';
const indexColor = isIndexed ? 'text-green-400' : 'text-red-400';
const indexTitle = isIndexed ? 'Indexado - Click para desindexar' : 'No indexado - Click para indexar';

// Generar el HTML del botón
const buttonHTML = `
    <!-- Botón de indexación -->
    <button class="index-resource-btn p-1.5 text-gray-400 hover:text-${isIndexed ? 'red' : 'green'}-400 hover:bg-${isIndexed ? 'red' : 'green'}-500/10 rounded-lg transition-all"
            title="${indexTitle}">
        <i data-lucide="${indexIcon}" class="w-4 h-4 ${indexColor}"></i>
    </button>
`;

console.log('HTML generado para botón de indexación:');
console.log(buttonHTML);

// Verificar si hay caracteres problemáticos
console.log('Contenido del botón limpio:');
console.log(buttonHTML.replace(/\s+/g, ' ').trim());

console.log('\nVariables usadas:');
console.log('isIndexed:', isIndexed);
console.log('indexIcon:', indexIcon);
console.log('indexColor:', indexColor);
console.log('indexTitle:', indexTitle);

console.log('\n=== FIN DE PRUEBA ===');
