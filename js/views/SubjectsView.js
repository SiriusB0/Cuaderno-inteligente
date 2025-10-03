/**
 * Vista de materias/asignaturas
 */
class SubjectsView {
    constructor(dataManager, router, notifications) {
        this.dataManager = dataManager;
        this.router = router;
        this.notifications = notifications;
        
        this.container = document.getElementById('subjects-view');
        this.subjectsGrid = document.getElementById('subjects-grid');
        
        this.initializeEventListeners();
        this.setupDataListeners();
    }
    
    /**
     * Inicializa event listeners de la vista
     */
    initializeEventListeners() {
        // Botón crear materia
        const addBtn = document.getElementById('add-subject-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showCreateModal());
        }
        
        // Botones de utilidad
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetData());
        }
    }
    
    /**
     * Configura listeners para cambios de datos
     */
    setupDataListeners() {
        this.dataManager.on('subjectCreated', () => this.render());
        this.dataManager.on('subjectUpdated', () => this.render());
        this.dataManager.on('subjectDeleted', () => this.render());
    }
    
    /**
     * Renderiza la vista de materias
     */
    render() {
        if (!this.subjectsGrid) return;
        
        const subjects = this.dataManager.getSubjects();
        
        if (subjects.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        this.subjectsGrid.innerHTML = subjects.map(subject => 
            this.createSubjectCard(subject)
        ).join('');
        
        // Agregar event listeners a las tarjetas
        this.subjectsGrid.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', () => {
                const subjectId = card.dataset.subjectId;
                this.selectSubject(subjectId);
            });
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const subjectId = card.dataset.subjectId;
                    this.selectSubject(subjectId);
                }
            });
        });
        
        // Actualizar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Selecciona una materia y navega a la vista de temas
     */
    selectSubject(subjectId) {
        try {
            const subject = this.dataManager.getSubject(subjectId);
            if (!subject) {
                throw new Error('Materia no encontrada');
            }

            this.router.navigateTo('topics', subject);
        } catch (error) {
            console.error('Error seleccionando materia:', error);
            this.notifications.error('Error al abrir la materia');
        }
    }
    
    /**
     * Renderiza estado vacío
     */
    renderEmptyState() {
        this.subjectsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <i data-lucide="book-open" class="w-12 h-12 text-gray-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay materias aún
                </h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6">
                    Comienza creando tu primera materia para organizar tus apuntes
                </p>
                <button 
                    class="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                    onclick="document.getElementById('add-subject-btn').click()"
                >
                    <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
                    Crear primera materia
                </button>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Crea una tarjeta de materia
     */
    createSubjectCard(subject) {
        const topicsCount = this.dataManager.getTopics(subject.id).length;
        
        return `
            <div class="subject-card group cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700"
                 data-subject-id="${subject.id}"
                 tabindex="0"
                 role="button"
                 aria-label="Abrir materia ${subject.name}">
                
                <div class="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
                    ${subject.image ? 
                        `<img src="${subject.image}" alt="${subject.name}" class="absolute inset-0 w-full h-full object-cover">` :
                        `<div class="absolute inset-0 bg-gradient-to-br flex items-center justify-center" style="background: linear-gradient(135deg, ${subject.color}22, ${subject.color}44);">
                            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <i data-lucide="book-open" class="w-8 h-8 text-white"></i>
                            </div>
                        </div>`
                    }
                    
                    <!-- Menú de opciones -->
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="subject-menu-btn w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white"
                                data-subject-id="${subject.id}">
                            <i data-lucide="more-vertical" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                        ${subject.name}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                        ${subject.description || 'Sin descripción'}
                    </p>
                    <div class="flex items-center justify-between text-xs text-gray-400">
                        <span>${topicsCount} tema${topicsCount !== 1 ? 's' : ''}</span>
                        <span>${this.formatDate(subject.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Formatea una fecha para mostrar
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hoy';
        if (diffDays === 2) return 'Ayer';
        if (diffDays <= 7) return `Hace ${diffDays} días`;
        
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
        });
    }
    
    /**
     * Muestra modal para crear materia
     */
    showCreateModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Nueva Materia</h3>
                <form id="create-subject-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre de la materia
                        </label>
                        <input 
                            type="text" 
                            id="subject-name"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ej: Matemáticas, Historia..."
                            required
                            maxlength="100"
                        >
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Imagen de portada (opcional)
                        </label>
                        <div class="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-200">
                            📐 <strong>Dimensión óptima: 800x800px</strong> (cuadrado)
                        </div>
                        <div class="flex items-center space-x-3">
                            <input 
                                type="file" 
                                id="subject-image"
                                accept="image/*"
                                class="hidden"
                            >
                            <button type="button" id="select-image-btn" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                Seleccionar imagen
                            </button>
                            <span id="image-name" class="text-sm text-gray-500 dark:text-gray-400">Ninguna imagen seleccionada</span>
                        </div>
                        <div id="image-preview" class="mt-3 hidden">
                            <img class="w-full h-32 object-cover rounded-md" alt="Vista previa">
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-create" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            Crear Materia
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners del modal
        let selectedImage = null;
        
        // Manejo de selección de imagen
        const imageInput = modal.querySelector('#subject-image');
        const selectImageBtn = modal.querySelector('#select-image-btn');
        const imageName = modal.querySelector('#image-name');
        const imagePreview = modal.querySelector('#image-preview');
        
        selectImageBtn.addEventListener('click', () => {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    this.notifications.error('La imagen no puede ser mayor a 5MB');
                    return;
                }
                
                imageName.textContent = file.name;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    selectedImage = e.target.result;
                    const img = imagePreview.querySelector('img');
                    img.src = selectedImage;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
        
        modal.querySelector('#cancel-create').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        modal.querySelector('#create-subject-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = modal.querySelector('#subject-name').value.trim();
            
            if (!name) {
                this.notifications.error('El nombre de la materia es requerido');
                return;
            }
            
            try {
                this.dataManager.createSubject({
                    name,
                    image: selectedImage,
                    color: '#6366f1' // Color por defecto
                });
                
                this.notifications.success('Materia creada correctamente');
                document.body.removeChild(modal);
            } catch (error) {
                this.notifications.error('Error al crear la materia');
                console.error(error);
            }
        });
        
        // Focus en el input
        modal.getElementById('subject-name').focus();
    }
    
    /**
     * Obtiene opciones de colores
     */
    getColorOptions() {
        return [
            '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
            '#f59e0b', '#10b981', '#06b6d4', '#6b7280'
        ];
    }
    
    /**
     * Exporta datos
     */
    exportData() {
        try {
            const data = this.dataManager.export();
            if (!data) {
                this.notifications.error('No hay datos para exportar');
                return;
            }
            
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cuaderno-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            this.notifications.success('Datos exportados correctamente');
        } catch (error) {
            this.notifications.error('Error al exportar datos');
            console.error(error);
        }
    }
    
    /**
     * Resetea todos los datos
     */
    resetData() {
        this.showConfirmModal(
            '¿Resetear todos los datos?',
            'Esta acción eliminará TODAS tus materias, temas, páginas y recursos. No se puede deshacer.',
            () => {
                try {
                    this.dataManager.reset();
                    this.notifications.success('Datos reseteados correctamente');
                } catch (error) {
                    this.notifications.error('Error al resetear datos');
                    console.error(error);
                }
            }
        );
    }
    
    /**
     * Muestra un modal de confirmación genérico
     */
    showConfirmModal(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-white mb-3">${title}</h3>
                    <p class="text-sm text-slate-300 mb-6">${message}</p>
                    
                    <div class="flex justify-end gap-3">
                        <button class="cancel-modal-btn px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button class="accept-modal-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('.cancel-modal-btn');
        const acceptBtn = modal.querySelector('.accept-modal-btn');
        
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        acceptBtn.addEventListener('click', () => {
            onConfirm();
            document.body.removeChild(modal);
        });
        
        setTimeout(() => cancelBtn.focus(), 100);
    }
}

export default SubjectsView;
