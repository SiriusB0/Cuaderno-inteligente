// Script para probar ResourceManager directamente
console.log("=== PRUEBA DIRECTA DE RESOURCEMANAGER ===");

// Verificar si ResourceManager existe
if (typeof ResourceManager === 'undefined') {
    console.log('❌ ResourceManager no está definido globalmente');
} else {
    console.log('✅ ResourceManager está definido');
}

// Verificar si hay una instancia en window.app
if (window.app && window.app.resourceManager) {
    console.log('✅ ResourceManager existe en window.app.resourceManager');

    const rm = window.app.resourceManager;
    console.log('currentTopicId:', rm.currentTopicId);
    console.log('resourceList existe:', !!rm.resourceList);

    // Verificar datos
    if (window.app.dataManager && window.app.dataManager.data.resources) {
        const resources = window.app.dataManager.data.resources;
        console.log('Recursos en dataManager:', Object.keys(resources));

        // Verificar recursos para el topicId actual
        if (rm.currentTopicId) {
            const topicResources = resources[rm.currentTopicId];
            console.log(`Recursos para topic ${rm.currentTopicId}:`, topicResources ? topicResources.length : 'ninguno');
        }
    }

    // Probar llamar renderResources manualmente
    try {
        console.log('Llamando renderResources manualmente...');
        rm.renderResources();
        console.log('✅ renderResources ejecutado sin errores');
    } catch (error) {
        console.log('❌ Error en renderResources:', error);
    }

} else {
    console.log('❌ ResourceManager NO existe en window.app.resourceManager');
    if (window.app) {
        console.log('window.app existe, pero no tiene resourceManager');
    } else {
        console.log('window.app NO existe');
    }
}

// Verificar si hay elementos en el DOM
const resourceItems = document.querySelectorAll('.resource-item');
console.log(`Elementos .resource-item en DOM: ${resourceItems.length}`);

resourceItems.forEach((item, index) => {
    const buttons = item.querySelectorAll('button');
    console.log(`Recurso ${index + 1}: ${buttons.length} botones`);
});

console.log('\n=== FIN DE PRUEBA DIRECTA ===');
