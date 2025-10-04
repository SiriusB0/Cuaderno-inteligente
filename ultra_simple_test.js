// Script ultra simple para probar indexación
console.log("=== PRUEBA ULTRA SIMPLE ===");

const btn = document.querySelector('.index-resource-btn');
if (!btn) {
    console.log("❌ No hay botón de indexación");
    return;
}

console.log("✅ Botón encontrado");
console.log("Estado inicial:", btn.title);

// Hacer click
btn.click();

setTimeout(() => {
    console.log("Estado después del click:", btn.title);

    // Verificar datos
    const resourceItem = btn.closest('.resource-item');
    const resourceId = resourceItem?.dataset.resourceId;

    if (resourceId) {
        for (const [subjectId, resources] of Object.entries(window.app.dataManager.data.resources)) {
            const resource = resources.find(r => r.id === resourceId);
            if (resource) {
                console.log("Estado en datos:", resource.indexed);
                break;
            }
        }
    }

    console.log("=== PRUEBA TERMINADA ===");
}, 300);
