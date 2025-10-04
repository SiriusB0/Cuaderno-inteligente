// Script simplificado para diagnosticar el botón de indexación
console.log("=== DIAGNÓSTICO SIMPLIFICADO ===");

// Encontrar todos los botones de indexación
const indexBtns = document.querySelectorAll('.index-resource-btn');
console.log(`Encontrados ${indexBtns.length} botones de indexación`);

indexBtns.forEach((btn, index) => {
    console.log(`\n--- Botón ${index + 1} ---`);
    console.log('Título:', btn.title);
    console.log('Clases:', btn.className);

    // Buscar el recurso padre
    const resourceItem = btn.closest('.resource-item');
    if (resourceItem) {
        const resourceId = resourceItem.dataset.resourceId;
        console.log('ID del recurso:', resourceId);

        // Buscar el recurso en los datos
        if (window.app?.dataManager?.data?.resources) {
            let found = false;
            for (const [subjectId, resources] of Object.entries(window.app.dataManager.data.resources)) {
                const resource = resources.find(r => r.id === resourceId);
                if (resource) {
                    console.log('Encontrado en materia:', subjectId);
                    console.log('Estado indexed:', resource.indexed);
                    console.log('¿Indexado?', resource.indexed !== false);
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log('❌ Recurso NO encontrado en datos');
            }
        }
    }
});

// Verificar ResourceManager
if (window.app?.resourceManager) {
    console.log('\n✅ ResourceManager existe');
    console.log('currentTopicId:', window.app.resourceManager.currentTopicId);
    console.log('¿Tiene método toggleResourceIndex?', typeof window.app.resourceManager.toggleResourceIndex === 'function');
} else {
    console.log('\n❌ ResourceManager NO existe');
}

// Probar hacer click en el primer botón
const firstBtn = indexBtns[0];
if (firstBtn) {
    console.log('\n--- PROBANDO CLICK ---');
    console.log('Haciendo click en el primer botón...');

    // Simular el click
    firstBtn.click();

    // Verificar el estado después de 500ms
    setTimeout(() => {
        console.log('Verificando estado después del click...');

        const resourceItem = firstBtn.closest('.resource-item');
        if (resourceItem) {
            const resourceId = resourceItem.dataset.resourceId;

            for (const [subjectId, resources] of Object.entries(window.app.dataManager.data.resources)) {
                const resource = resources.find(r => r.id === resourceId);
                if (resource) {
                    console.log('Nuevo estado:', resource.indexed);
                    console.log('Nuevo título del botón:', firstBtn.title);
                    break;
                }
            }
        }
    }, 500);
}

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
