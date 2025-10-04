// Diagnóstico detallado del botón de indexación
console.log("=== DIAGNÓSTICO DEL BOTÓN DE INDEXACIÓN ===");

// Encontrar el botón de indexación
const indexBtn = document.querySelector('.index-resource-btn');
if (!indexBtn) {
    console.log('❌ No se encontró el botón de indexación');
    return;
}

console.log('✅ Botón encontrado:', indexBtn);

// Verificar el estado actual del botón
console.log('Texto del botón:', indexBtn.title);
console.log('Clases del botón:', indexBtn.className);

// Buscar el recurso padre
const resourceItem = indexBtn.closest('.resource-item');
if (!resourceItem) {
    console.log('❌ No se encontró el elemento padre .resource-item');
    return;
}

const resourceId = resourceItem.dataset.resourceId;
console.log('ID del recurso:', resourceId);

// Verificar el estado del recurso en los datos
if (window.app?.dataManager?.data?.resources) {
    const allResources = window.app.dataManager.data.resources;
    console.log('Estructura de recursos:', Object.keys(allResources));

    // Buscar el recurso en todas las materias
    let foundResource = null;
    let foundSubjectId = null;

    for (const [subjectId, resources] of Object.entries(allResources)) {
        const resource = resources.find(r => r.id === resourceId);
        if (resource) {
            foundResource = resource;
            foundSubjectId = subjectId;
            break;
        }
    }

    if (foundResource) {
        console.log('✅ Recurso encontrado en materia:', foundSubjectId);
        console.log('Estado actual indexed:', foundResource.indexed);
        console.log('Estado esperado (true por defecto):', foundResource.indexed !== false);
    } else {
        console.log('❌ Recurso NO encontrado en los datos');
    }
}

// Verificar ResourceManager
if (window.app?.resourceManager) {
    console.log('✅ ResourceManager existe');
    console.log('currentTopicId:', window.app.resourceManager.currentTopicId);

    // Verificar si puede encontrar el recurso
    const resources = window.app.dataManager.data.resources[window.app.resourceManager.currentTopicId] || [];
    const resource = resources.find(r => r.id === resourceId);
    console.log('Recurso encontrado por ResourceManager:', !!resource);
    if (resource) {
        console.log('Estado en ResourceManager:', resource.indexed);
    }
} else {
    console.log('❌ ResourceManager NO existe');
}

// Probar el método toggleResourceIndex manualmente
console.log('\n=== PRUEBA MANUAL DEL MÉTODO ===');

if (window.app?.resourceManager?.toggleResourceIndex) {
    console.log('Ejecutando toggleResourceIndex...');
    try {
        window.app.resourceManager.toggleResourceIndex(resourceId);
        console.log('✅ toggleResourceIndex ejecutado sin errores');

        // Verificar el nuevo estado
        setTimeout(() => {
            const allResources = window.app.dataManager.data.resources;
            let foundResource = null;

            for (const [subjectId, resources] of Object.entries(allResources)) {
                const resource = resources.find(r => r.id === resourceId);
                if (resource) {
                    foundResource = resource;
                    break;
                }
            }

            if (foundResource) {
                console.log('Nuevo estado después del toggle:', foundResource.indexed);
                console.log('¿Está indexado ahora?', foundResource.indexed !== false);
            }
        }, 100);

    } catch (error) {
        console.log('❌ Error ejecutando toggleResourceIndex:', error);
    }
} else {
    console.log('❌ Método toggleResourceIndex no disponible');
}

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
