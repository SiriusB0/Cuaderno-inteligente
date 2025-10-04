// Diagnóstico detallado de inicialización del ResourceManager
console.log("=== DIAGNÓSTICO DE INICIALIZACIÓN ===");

// Verificar si StudyView existe y tiene resourceManager
if (window.app && window.app.currentView) {
    const studyView = window.app.currentView;
    console.log('StudyView encontrado:', !!studyView);
    console.log('StudyView tiene resourceManager:', !!studyView.resourceManager);

    if (studyView.resourceManager) {
        const rm = studyView.resourceManager;
        console.log('ResourceManager currentTopicId:', rm.currentTopicId);
        console.log('ResourceManager resourceList existe:', !!rm.resourceList);

        if (rm.resourceList) {
            console.log('resourceList está en DOM:', document.body.contains(rm.resourceList));
            console.log('resourceList innerHTML:', rm.resourceList.innerHTML.substring(0, 200));
        } else {
            console.log('resourceList no existe - buscando en DOM...');
            const resourceContainer = document.getElementById('resources-container') ||
                                     document.querySelector('[class*="resource"]') ||
                                     document.querySelector('.resources-list');
            console.log('Contenedor de recursos encontrado:', !!resourceContainer);
            if (resourceContainer) {
                console.log('ID del contenedor:', resourceContainer.id);
                console.log('Clases del contenedor:', resourceContainer.className);
            }
        }
    }

    // Verificar currentSubject y currentTopic
    console.log('currentSubject:', studyView.currentSubject);
    console.log('currentTopic:', studyView.currentTopic);

    // Verificar datos en dataManager
    if (window.app.dataManager) {
        const resources = window.app.dataManager.data.resources || {};
        console.log('Recursos en dataManager:', Object.keys(resources));
        console.log('Total de recursos:', Object.values(resources).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0));
    }
}

// Verificar si hay errores en la inicialización
console.log('\n=== VERIFICACIÓN DE ELEMENTOS DOM ===');
const possibleContainers = [
    'resources-container',
    'resources-list',
    'resource-manager',
    'sidebar-resources'
];

possibleContainers.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        console.log(`✅ Encontrado elemento con ID: ${id}`);
        console.log(`   Contenido: ${el.innerHTML.substring(0, 100)}...`);
    }
});

// Buscar elementos con clase resource
const resourceElements = document.querySelectorAll('.resource-item, .resource, [class*="resource"]');
console.log(`Elementos con clase resource encontrados: ${resourceElements.length}`);

console.log('\n=== FIN DEL DIAGNÓSTICO ===');
