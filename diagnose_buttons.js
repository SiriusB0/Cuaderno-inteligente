// Script para diagnosticar botones de indexación
console.log("=== DIAGNÓSTICO DE BOTONES DE INDEXACIÓN ===");

// Buscar todos los recursos
const resources = document.querySelectorAll('.resource-item');
console.log(`Encontrados ${resources.length} recursos`);

// Revisar cada recurso
resources.forEach((resource, index) => {
    const resourceId = resource.dataset.resourceId;
    const name = resource.querySelector('h4')?.textContent || 'Sin nombre';

    console.log(`\n--- Recurso ${index + 1}: ${name} ---`);
    console.log(`ID: ${resourceId}`);

    // Buscar botones
    const indexBtn = resource.querySelector('.index-resource-btn');
    const deleteBtn = resource.querySelector('.delete-resource-btn');

    if (indexBtn) {
        console.log('✅ Botón de indexación ENCONTRADO');
        console.log('Visible:', indexBtn.offsetWidth > 0 && indexBtn.offsetHeight > 0);
        console.log('Display:', getComputedStyle(indexBtn).display);
        console.log('Opacity:', getComputedStyle(indexBtn).opacity);
        console.log('HTML:', indexBtn.outerHTML);
    } else {
        console.log('❌ Botón de indexación NO encontrado');
    }

    if (deleteBtn) {
        console.log('✅ Botón de eliminar ENCONTRADO');
        console.log('Visible:', deleteBtn.offsetWidth > 0 && deleteBtn.offsetHeight > 0);
    } else {
        console.log('❌ Botón de eliminar NO encontrado');
    }

    // Buscar texto de estado
    const statusText = resource.querySelector('.text-green-400, .text-red-400');
    if (statusText) {
        console.log('Estado de indexación:', statusText.textContent);
    }
});

// Verificar si hay errores en la consola
console.log('\n=== VERIFICACIÓN DE ERRORES ===');
if (window.ResourceManager) {
    console.log('✅ ResourceManager existe');
} else {
    console.log('❌ ResourceManager NO existe');
}

// Verificar iconos de Lucide
if (window.lucide) {
    console.log('✅ Lucide está cargado');
} else {
    console.log('❌ Lucide NO está cargado');
}

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
