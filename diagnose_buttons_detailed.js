// Diagnóstico detallado de botones de indexación
console.log("=== DIAGNÓSTICO DETALLADO DE BOTONES ===");

// Buscar recursos
const resources = document.querySelectorAll('.resource-item');
console.log(`Recursos encontrados: ${resources.length}`);

resources.forEach((resource, index) => {
    const resourceId = resource.dataset.resourceId;
    const name = resource.querySelector('h4')?.textContent?.trim() || 'Sin nombre';

    console.log(`\n--- Recurso ${index + 1}: ${name} ---`);
    console.log(`ID: ${resourceId}`);

    // Verificar estructura HTML completa
    console.log('HTML del recurso:', resource.outerHTML.substring(0, 500) + '...');

    // Buscar botones específicamente
    const allButtons = resource.querySelectorAll('button');
    console.log(`Botones totales encontrados: ${allButtons.length}`);

    allButtons.forEach((btn, btnIndex) => {
        console.log(`  Botón ${btnIndex + 1}:`, {
            className: btn.className,
            textContent: btn.textContent?.trim(),
            innerHTML: btn.innerHTML?.substring(0, 100),
            visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
            display: getComputedStyle(btn).display,
            opacity: getComputedStyle(btn).opacity,
            visibility: getComputedStyle(btn).visibility
        });
    });

    // Verificar específicamente botones de indexación
    const indexBtn = resource.querySelector('.index-resource-btn');
    const deleteBtn = resource.querySelector('.delete-resource-btn');

    console.log('Botón index:', indexBtn ? 'ENCONTRADO' : 'NO ENCONTRADO');
    console.log('Botón delete:', deleteBtn ? 'ENCONTRADO' : 'NO ENCONTRADO');

    if (indexBtn) {
        console.log('Detalles botón index:', {
            visible: indexBtn.offsetWidth > 0 && indexBtn.offsetHeight > 0,
            position: getComputedStyle(indexBtn).position,
            left: getComputedStyle(indexBtn).left,
            top: getComputedStyle(indexBtn).top,
            zIndex: getComputedStyle(indexBtn).zIndex
        });
    }
});

// Verificar contenedor padre
const container = document.querySelector('.resources-container, #resources-container, [class*="resource"]');
if (container) {
    console.log('\n=== CONTENEDOR PADRE ===');
    console.log('Contenedor encontrado:', container.tagName, container.className);
    console.log('Estilos del contenedor:', {
        position: getComputedStyle(container).position,
        overflow: getComputedStyle(container).overflow,
        height: getComputedStyle(container).height
    });
} else {
    console.log('\n=== CONTENEDOR PADRE ===');
    console.log('No se encontró contenedor de recursos');
}

// Verificar si ResourceManager existe
console.log('\n=== VERIFICACIÓN DE MÓDULOS ===');
console.log('ResourceManager existe:', typeof window.ResourceManager !== 'undefined');
console.log('window.app existe:', typeof window.app !== 'undefined');

if (window.app) {
    console.log('window.app.resourceManager existe:', typeof window.app.resourceManager !== 'undefined');
}

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
