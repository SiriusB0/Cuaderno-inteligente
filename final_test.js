// Prueba final completa del sistema de indexación
console.log("=== PRUEBA FINAL DEL SISTEMA DE INDEXACIÓN ===");

// 1. Verificar estado inicial
console.log("1. ESTADO INICIAL:");
const initialBtn = document.querySelector('.index-resource-btn');
if (initialBtn) {
    console.log('Botón encontrado');
    console.log('Título inicial:', initialBtn.title);
    console.log('Estado visual inicial:', initialBtn.querySelector('svg')?.classList.contains('text-green-400') ? 'Verde (indexado)' : 'Rojo (no indexado)');
} else {
    console.log('❌ Botón NO encontrado');
    return;
}

// 2. Simular click y verificar cambios
console.log("\n2. SIMULANDO CLICK:");
initialBtn.click();

// Verificar cambios después de 100ms
setTimeout(() => {
    console.log("Estado después del click:");
    console.log('Nuevo título:', initialBtn.title);
    console.log('Nuevo estado visual:', initialBtn.querySelector('svg')?.classList.contains('text-green-400') ? 'Verde (indexado)' : 'Rojo (no indexado)');

    // 3. Verificar estado en datos
    console.log("\n3. VERIFICANDO DATOS:");
    const resourceItem = initialBtn.closest('.resource-item');
    if (resourceItem) {
        const resourceId = resourceItem.dataset.resourceId;

        for (const [subjectId, resources] of Object.entries(window.app.dataManager.data.resources)) {
            const resource = resources.find(r => r.id === resourceId);
            if (resource) {
                console.log('Estado en datos:', resource.indexed);
                console.log('¿Debería estar indexado?', resource.indexed !== false);
                break;
            }
        }
    }

    // 4. Verificar ResourceManager
    console.log("\n4. VERIFICANDO RESOURCEMANAGER:");
    if (window.app?.resourceManager) {
        console.log('✅ ResourceManager disponible');
        console.log('currentTopicId:', window.app.resourceManager.currentTopicId);
    } else {
        console.log('❌ ResourceManager NO disponible');
    }

    // 5. Verificar filtrado en AI Chat
    console.log("\n5. VERIFICANDO FILTRADO AI:");
    if (window.app?.currentView?.aiChatModal) {
        const aiChat = window.app.currentView.aiChatModal;
        console.log('AI Chat tiene currentTopicId:', !!aiChat.currentTopicId);
        console.log('AI Chat tiene indexCache:', !!aiChat.indexCache);
        if (aiChat.indexCache) {
            console.log('Chunks en caché:', aiChat.indexCache.length);
        }
    } else {
        console.log('AI Chat no disponible');
    }

    console.log('\n=== PRUEBA COMPLETADA ===');
}, 200);
