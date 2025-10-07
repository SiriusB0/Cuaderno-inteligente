/**
 * Gestor de recursos - Maneja archivos, PDFs, imágenes, etc.
 */
class ResourceManager {
    constructor(dataManager, notifications) {
        console.log('ResourceManager v3.0: Con reproductor minimizable profesional');
        this.dataManager = dataManager;
        this.notifications = notifications;
        
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-upload');
        this.resourceList = document.getElementById('resource-list');
        
        this.currentTopicId = null;
        this.maxFileSize = 20 * 1024 * 1024; // 20MB
        this.allowedTypes = [
            'application/pdf',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/webm',
            'audio/mp4'
        ];
        
        // Estado del reproductor minimizado
        this.miniPlayer = null;
        this.currentAudio = null;
        
        this.initializeEventListeners();
    }
    
    /**
     * Inicializa event listeners
     */
    initializeEventListeners() {
        if (this.dropZone) {
            // Drag and drop
            this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
            
            // Click para seleccionar archivos
            this.dropZone.addEventListener('click', () => {
                if (this.fileInput) {
                    this.fileInput.click();
                }
            });
        }
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
    }
    
    /**
     * Establece el tema actual
     */
    setCurrentTopic(topicId) {
        this.currentTopicId = topicId;
        this.renderResources();
    }
    
    /**
     * Carga recursos de una materia
     * IMPORTANTE: Los recursos se guardan por MATERIA, no por tema
     * Todos los temas de una materia comparten los mismos recursos
     * @param {string} subjectId - ID de la materia
     * @param {string} topicId - ID del tema actual (solo para referencia)
     * @param {string} studyMode - Modo de estudio (no afecta los recursos)
     */
    loadResources(subjectId, topicId = null, studyMode = 'subject') {
        console.log('ResourceManager: Cargando recursos');
        console.log('- Materia:', subjectId);
        console.log('- Tema:', topicId);
        console.log('- Modo:', studyMode);
        
        this.currentSubjectId = subjectId;
        this.currentTopicId = topicId;
        this.studyMode = studyMode;
        
        // Asegurar que tenemos al menos la materia
        if (!this.currentSubjectId) {
            console.warn('ResourceManager: No se proporcionó subjectId');
            return;
        }
        
        this.renderResources();
    }
    
    /**
     * Maneja dragover
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-over');
    }
    
    /**
     * Maneja dragleave
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');
    }
    
    /**
     * Maneja drop de archivos
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }
    
    /**
     * Maneja selección de archivos
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
        
        // Limpiar input
        e.target.value = '';
    }
    
    /**
     * Procesa archivos seleccionados
     */
    async processFiles(files) {
        console.log('ResourceManager: Procesando archivos');
        console.log('- Materia:', this.currentSubjectId);
        console.log('- Tema:', this.currentTopicId);
        
        if (!this.currentSubjectId) {
            this.notifications.error('No hay materia seleccionada. Por favor, selecciona una materia primero.');
            console.error('ResourceManager: Intento de subir archivo sin materia seleccionada');
            return;
        }
        
        for (const file of files) {
            try {
                await this.uploadFile(file);
            } catch (error) {
                console.error('Error procesando archivo:', error);
                this.notifications.error(`Error procesando ${file.name}`);
            }
        }
    }
    
    /**
     * Sube un archivo
     */
    async uploadFile(file) {
        // Validar archivo
        if (!this.validateFile(file)) {
            return;
        }
        
        // Mostrar progreso
        const progressId = this.showUploadProgress(file.name);
        
        try {
            // Leer archivo como base64
            const base64Data = await this.fileToBase64(file);
            
            // Crear recurso
            const resource = {
                id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: this.getFileType(file),
                size: file.size,
                mimeType: file.type,
                data: base64Data,
                uploadedAt: new Date().toISOString(),
                indexed: true // Por defecto, los recursos nuevos están indexados
            };
            
            // Guardar en datos (por MATERIA, no por tema)
            if (!this.dataManager.data.resources[this.currentSubjectId]) {
                this.dataManager.data.resources[this.currentSubjectId] = [];
            }
            
            this.dataManager.data.resources[this.currentSubjectId].push(resource);
            this.dataManager.save();
            
            // Emitir evento para que otras vistas se actualicen
            this.dataManager.emit('resourceAdded', { 
                resourceId: resource.id, 
                subjectId: this.currentSubjectId 
            });
            
            // Actualizar UI
            this.hideUploadProgress(progressId);
            this.renderResources();
            
            this.notifications.success(`${file.name} subido correctamente`);
            
            // Indexar automáticamente el recurso recién subido
            console.log('[ResourceManager] Iniciando indexación automática del recurso subido');
            this.autoIndexResource(resource);
            
        } catch (error) {
            this.hideUploadProgress(progressId);
            throw error;
        }
    }
    
    /**
     * Valida un archivo
     */
    validateFile(file) {
        // Validar tamaño
        if (file.size > this.maxFileSize) {
            this.notifications.error(`${file.name} es demasiado grande (máximo 10MB)`);
            return false;
        }
        
        // Validar tipo
        if (!this.allowedTypes.includes(file.type)) {
            this.notifications.error(`Tipo de archivo no permitido: ${file.name}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Convierte archivo a base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Obtiene el tipo de archivo
     */
    getFileType(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type === 'application/pdf') return 'pdf';
        if (file.type === 'text/plain') return 'text';
        if (file.type.startsWith('audio/')) return 'audio';
        return 'file';
    }
    
    /**
     * Muestra progreso de subida
     */
    showUploadProgress(fileName) {
        const progressId = `progress_${Date.now()}`;
        const progressElement = document.createElement('div');
        progressElement.id = progressId;
        progressElement.className = 'upload-progress p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 mb-2';
        progressElement.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="spinner w-4 h-4"></div>
                <span class="text-sm text-blue-600 dark:text-blue-400">Subiendo ${fileName}...</span>
            </div>
        `;
        
        if (this.resourceList) {
            this.resourceList.appendChild(progressElement);
        }
        
        return progressId;
    }
    
    /**
     * Oculta progreso de subida
     */
    hideUploadProgress(progressId) {
        const element = document.getElementById(progressId);
        if (element) {
            element.remove();
        }
    }
    
    /**
     * Renderiza lista de recursos en grid hermoso
     */
    renderResources() {
        if (!this.resourceList) return;
        
        let resources = [];
        
        // Los recursos SIEMPRE se guardan por MATERIA
        // Todos los temas de una materia comparten los mismos recursos
        if (this.currentSubjectId) {
            resources = this.dataManager.data.resources[this.currentSubjectId] || [];
            console.log(`Mostrando ${resources.length} recursos de la materia ${this.currentSubjectId}`);
        } else {
            console.warn('ResourceManager: No hay subjectId');
            return;
        }
        
        if (resources.length === 0) {
            this.resourceList.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div class="inline-block p-6 bg-gray-50 dark:bg-gray-800/50 rounded-full mb-4">
                        <i data-lucide="folder-open" class="w-12 h-12"></i>
                    </div>
                    <p class="text-sm font-medium">No hay recursos aún</p>
                    <p class="text-xs mt-1">Arrastra archivos o haz clic para subir</p>
                </div>
            `;
        } else {
            // Crear lista de recursos (1 columna para mejor visibilidad)
            this.resourceList.innerHTML = `
                <div class="flex flex-col gap-3">
                    ${resources.map(resource => this.createResourceItem(resource)).join('')}
                </div>
            `;
            
            // Event listeners para recursos
            this.resourceList.querySelectorAll('.resource-item').forEach(item => {
                const resourceId = item.dataset.resourceId;
                const resource = resources.find(r => r.id === resourceId);
                
                if (resource) {
                    item.addEventListener('click', () => this.openResource(resource));
                    
                    // Botón de indexación
                    const indexBtn = item.querySelector('.index-resource-btn');
                    if (indexBtn) {
                        indexBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleResourceIndex(resourceId);
                        });
                    }
                    
                    // Botón eliminar
                    const deleteBtn = item.querySelector('.delete-resource-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.deleteResource(resourceId);
                        });
                    }
                }
            });
        }
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Crea elemento de recurso con preview hermoso
     */
    createResourceItem(resource) {
        const size = this.formatFileSize(resource.size);
        const date = this.formatDate(resource.uploadedAt);
        
        // Generar preview según tipo
        let previewHTML = '';
        let typeColor = '';
        let typeBadge = '';
        
        // Estado de indexación
        const isIndexed = resource.indexed !== false; // Por defecto true si no está definido
        const indexBgColor = isIndexed ? 'bg-green-500/20' : 'bg-gray-500/20';
        const indexIconColor = isIndexed ? 'text-green-400' : 'text-gray-400';
        const indexHoverBg = isIndexed ? 'hover:bg-green-500/30' : 'hover:bg-gray-500/30';
        const indexTitle = isIndexed ? 'Indexado - Click para desindexar' : 'No indexado - Click para indexar';
        
        switch(resource.type) {
            case 'image':
                previewHTML = `
                    <div class="aspect-video bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                        <img src="${resource.data}" 
                             alt="${resource.name}" 
                             class="w-full h-full object-cover"
                             loading="lazy">
                    </div>
                `;
                typeColor = 'from-purple-400 to-purple-600';
                typeBadge = 'Imagen';
                break;
                
            case 'pdf':
                previewHTML = `
                    <div class="aspect-video bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-t-lg flex items-center justify-center">
                        <i data-lucide="file-text" class="w-16 h-16 text-red-400 dark:text-red-500"></i>
                    </div>
                `;
                typeColor = 'from-red-400 to-red-600';
                typeBadge = 'PDF';
                break;
                
            case 'text':
                previewHTML = `
                    <div class="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-t-lg flex items-center justify-center">
                        <i data-lucide="file-code" class="w-16 h-16 text-blue-400 dark:text-blue-500"></i>
                    </div>
                `;
                typeColor = 'from-blue-400 to-blue-600';
                typeBadge = 'Texto';
                break;
                
            case 'audio':
                previewHTML = `
                    <div class="aspect-video bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        <div class="absolute inset-0 opacity-10">
                            <svg viewBox="0 0 100 100" class="w-full h-full">
                                <path d="M 10,50 Q 25,30 40,50 T 70,50 T 100,50" stroke="currentColor" stroke-width="2" fill="none" class="text-green-500"/>
                                <path d="M 10,60 Q 25,40 40,60 T 70,60 T 100,60" stroke="currentColor" stroke-width="2" fill="none" class="text-green-500"/>
                            </svg>
                        </div>
                        <i data-lucide="music" class="w-16 h-16 text-green-500 dark:text-green-400 relative z-10"></i>
                    </div>
                `;
                typeColor = 'from-green-400 to-green-600';
                typeBadge = 'Audio';
                break;
                
            default:
                previewHTML = `
                    <div class="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg flex items-center justify-center">
                        <i data-lucide="file" class="w-16 h-16 text-gray-400 dark:text-gray-500"></i>
                    </div>
                `;
                typeColor = 'from-gray-400 to-gray-600';
                typeBadge = 'Archivo';
        }
        
        return `
            <div class="resource-item group cursor-pointer bg-gray-700/40 hover:bg-gray-700/60 rounded-lg border border-gray-600/50 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 relative"
                 data-resource-id="${resource.id}">
                
                <!-- Botones en esquina superior derecha -->
                <div class="absolute top-2 right-2 flex gap-1 ">
                    <!-- Botón de indexación -->
                    <button class="index-resource-btn p-2 ${indexBgColor} ${indexHoverBg} rounded-lg transition-all shadow-sm"
                            title="${indexTitle}">
                        <i data-lucide="search" class="w-4 h-4 ${indexIconColor}"></i>
                    </button>
                    
                    <!-- Botón eliminar -->
                    <button class="delete-resource-btn p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Eliminar recurso">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <div class="p-3 flex items-center gap-3">
                    <!-- Icono del tipo de archivo -->
                    <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${typeColor} flex items-center justify-center shadow-sm">
                        <i data-lucide="${this.getResourceIcon(resource.type)}" class="w-6 h-6 text-white"></i>
                    </div>
                    
                    <!-- Información del recurso -->
                    <div class="flex-1 min-w-0 pr-16">
                        <h4 class="text-sm font-semibold text-gray-100 mb-1.5 truncate" title="${resource.name}">
                            ${resource.name}
                        </h4>
                        <div class="flex items-center gap-2 text-xs text-gray-400">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-600/60 text-gray-200 flex-shrink-0">
                                ${typeBadge}
                            </span>
                            <span class="flex-shrink-0">•</span>
                            <i data-lucide="clock" class="w-3 h-3 inline flex-shrink-0"></i>
                            <span class="flex-shrink-0">${date}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Obtiene icono para tipo de recurso
     */
    getResourceIcon(type) {
        const icons = {
            image: 'image',
            pdf: 'file-text',
            text: 'file-text',
            file: 'file'
        };
        return icons[type] || 'file';
    }
    
    /**
     * Formatea tamaño de archivo
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Formatea fecha (formato corto: "30 sep")
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    }
    
    /**
     * Abre un recurso según su tipo
     */
    openResource(resource) {
        try {
            if (resource.type === 'image') {
                this.openImageViewer(resource);
            } else if (resource.type === 'pdf') {
                this.openPDFViewer(resource);
            } else if (resource.type === 'text') {
                this.openTextViewer(resource);
            } else if (resource.type === 'audio') {
                this.openAudioPlayer(resource);
            } else {
                this.downloadResource(resource);
            }
        } catch (error) {
            console.error('Error abriendo recurso:', error);
            this.notifications.error('Error al abrir el recurso');
        }
    }
    
    /**
     * Abre visor de imágenes hermoso con zoom
     */
    openImageViewer(resource) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="w-full max-w-6xl max-h-[95vh] flex flex-col">
                <!-- Header -->
                <div class="bg-white/10 backdrop-blur-md rounded-t-xl p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-purple-500/20 rounded-lg">
                            <i data-lucide="image" class="w-5 h-5 text-purple-300"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-white">${resource.name}</h3>
                            <p class="text-xs text-gray-300">${this.formatFileSize(resource.size)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="zoom-in-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Acercar">
                            <i data-lucide="zoom-in" class="w-5 h-5 text-white"></i>
                        </button>
                        <button class="zoom-out-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Alejar">
                            <i data-lucide="zoom-out" class="w-5 h-5 text-white"></i>
                        </button>
                        <button class="download-image-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Descargar">
                            <i data-lucide="download" class="w-5 h-5 text-white"></i>
                        </button>
                        <button class="close-modal p-2 hover:bg-white/10 rounded-lg transition-colors" title="Cerrar">
                            <i data-lucide="x" class="w-5 h-5 text-white"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Image Container -->
                <div class="flex-1 overflow-hidden bg-white/5 backdrop-blur-md rounded-b-xl flex items-center justify-center p-6">
                    <img src="${resource.data}" 
                         alt="${resource.name}" 
                         id="viewer-image"
                         class="max-w-full max-h-full object-contain transition-transform duration-200"
                         style="transform: scale(1);">
                </div>
                
                <!-- Instructions -->
                <div class="text-center mt-4 text-white/60 text-sm">
                    <p>Haz clic fuera de la imagen para cerrar • ESC para salir</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Referencias
        const img = modal.querySelector('#viewer-image');
        const closeBtn = modal.querySelector('.close-modal');
        const zoomInBtn = modal.querySelector('.zoom-in-btn');
        const zoomOutBtn = modal.querySelector('.zoom-out-btn');
        const downloadBtn = modal.querySelector('.download-image-btn');
        
        let currentZoom = 1;
        const zoomStep = 0.25;
        const minZoom = 0.5;
        const maxZoom = 3;
        
        // Zoom In
        zoomInBtn.addEventListener('click', () => {
            if (currentZoom < maxZoom) {
                currentZoom += zoomStep;
                img.style.transform = `scale(${currentZoom})`;
            }
        });
        
        // Zoom Out
        zoomOutBtn.addEventListener('click', () => {
            if (currentZoom > minZoom) {
                currentZoom -= zoomStep;
                img.style.transform = `scale(${currentZoom})`;
            }
        });
        
        // Download
        downloadBtn.addEventListener('click', () => {
            this.downloadResource(resource);
        });
        
        // Close
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // ESC para cerrar
        const handleEsc = (e) => {
            if (e.key === 'Escape' && document.body.contains(modal)) {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Abre visor de PDF hermoso en modal
     */
    openPDFViewer(resource) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <i data-lucide="file-text" class="w-5 h-5 text-red-600 dark:text-red-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${resource.name}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Documento PDF • ${this.formatFileSize(resource.size)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="download-pdf-btn p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors" title="Descargar PDF">
                            <i data-lucide="download" class="w-5 h-5 text-gray-600 dark:text-gray-400"></i>
                        </button>
                        <button class="close-modal p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors" title="Cerrar">
                            <i data-lucide="x" class="w-5 h-5 text-gray-600 dark:text-gray-400"></i>
                        </button>
                    </div>
                </div>
                
                <!-- PDF Viewer -->
                <div class="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <iframe 
                        src="${resource.data}" 
                        class="w-full h-full border-0"
                        title="${resource.name}">
                    </iframe>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const downloadBtn = modal.querySelector('.download-pdf-btn');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        downloadBtn.addEventListener('click', () => {
            this.downloadResource(resource);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // ESC para cerrar
        const handleEsc = (e) => {
            if (e.key === 'Escape' && document.body.contains(modal)) {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Abre visor de texto hermoso con mejor formato
     */
    openTextViewer(resource) {
        // Decodificar base64 para obtener el texto
        const base64Data = resource.data.split(',')[1];
        const text = atob(base64Data);
        const lineCount = text.split('\n').length;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <i data-lucide="file-code" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${resource.name}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Archivo de texto • ${lineCount} líneas • ${this.formatFileSize(resource.size)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="copy-text-btn p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors" title="Copiar texto">
                            <i data-lucide="copy" class="w-5 h-5 text-gray-600 dark:text-gray-400"></i>
                        </button>
                        <button class="download-text-btn p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors" title="Descargar">
                            <i data-lucide="download" class="w-5 h-5 text-gray-600 dark:text-gray-400"></i>
                        </button>
                        <button class="close-modal p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors" title="Cerrar">
                            <i data-lucide="x" class="w-5 h-5 text-gray-600 dark:text-gray-400"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Text Content -->
                <div class="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                    <div class="h-full overflow-y-auto p-6">
                        <pre class="text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed whitespace-pre-wrap break-words">${this.escapeHtml(text)}</pre>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeBtn = modal.querySelector('.close-modal');
        const copyBtn = modal.querySelector('.copy-text-btn');
        const downloadBtn = modal.querySelector('.download-text-btn');
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text).then(() => {
                this.notifications.success('Texto copiado al portapapeles');
            }).catch(() => {
                this.notifications.error('Error al copiar el texto');
            });
        });
        
        downloadBtn.addEventListener('click', () => {
            this.downloadResource(resource);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // ESC para cerrar
        const handleEsc = (e) => {
            if (e.key === 'Escape' && document.body.contains(modal)) {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Abre player de audio con opción de minimizar
     */
    openAudioPlayer(resource) {
        // Si ya hay un mini player, lo cerramos
        if (this.miniPlayer) {
            this.closeMiniPlayer();
        }
        
        // Crear reproductor completo
        this.createFullAudioPlayer(resource);
    }
    
    /**
     * Crea el reproductor de audio completo
     */
    createFullAudioPlayer(resource) {
        const modal = document.createElement('div');
        modal.id = 'audio-modal';
        modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-green-900 to-emerald-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-green-500/20">
                <!-- Header -->
                <div class="p-6 border-b border-green-500/20">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="p-3 bg-green-500/20 rounded-xl">
                                <i data-lucide="music" class="w-6 h-6 text-green-400"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="text-lg font-bold text-white truncate">${resource.name}</h3>
                                <p class="text-sm text-green-300">${this.formatFileSize(resource.size)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="flex gap-2">
                        <button id="minimize-player-btn" class="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl transition-all flex items-center justify-center gap-2">
                            <i data-lucide="minimize-2" class="w-4 h-4"></i>
                            <span class="text-sm font-medium">Minimizar</span>
                        </button>
                        <button class="close-modal px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Visualizador -->
                <div class="p-8">
                    <div class="relative w-48 h-48 mx-auto mb-6">
                        <div class="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse opacity-50"></div>
                        <div class="absolute inset-2 bg-gradient-to-br from-green-900 to-emerald-900 rounded-full flex items-center justify-center border-4 border-green-500/30">
                            <i data-lucide="music" class="w-16 h-16 text-green-400"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Controles -->
                <div class="px-6 pb-6">
                    <audio id="audio-element" class="hidden">
                        <source src="${resource.data}" type="${resource.mimeType}">
                    </audio>
                    
                    <!-- Tiempos -->
                    <div class="flex justify-between text-sm text-green-300 mb-2">
                        <span id="current-time">0:00</span>
                        <span id="duration-time">0:00</span>
                    </div>
                    
                    <!-- Barra de progreso -->
                    <div class="relative h-3 bg-green-950/50 rounded-full mb-6 cursor-pointer" id="progress-container">
                        <div class="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" id="progress-fill" style="width: 0%"></div>
                        <div class="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing" id="progress-thumb" style="left: 0%; transform: translate(-50%, -50%);"></div>
                    </div>
                    
                    <!-- Botones de control -->
                    <div class="flex items-center justify-center gap-4 mb-4">
                        <button id="rewind-btn" class="p-3 hover:bg-green-500/20 rounded-full transition-all">
                            <i data-lucide="rewind" class="w-5 h-5 text-green-300"></i>
                        </button>
                        
                        <button id="play-pause-btn" class="p-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full transition-all shadow-lg">
                            <i data-lucide="play" class="w-7 h-7 text-white"></i>
                        </button>
                        
                        <button id="forward-btn" class="p-3 hover:bg-green-500/20 rounded-full transition-all">
                            <i data-lucide="fast-forward" class="w-5 h-5 text-green-300"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupAudioControls(modal, resource);
    }
    
    /**
     * Configura los controles del reproductor de audio
     */
    setupAudioControls(container, resource) {
        const audio = container.querySelector('#audio-element');
        const playPauseBtn = container.querySelector('#play-pause-btn');
        const playPauseIcon = playPauseBtn.querySelector('i');
        const rewindBtn = container.querySelector('#rewind-btn');
        const forwardBtn = container.querySelector('#forward-btn');
        const progressContainer = container.querySelector('#progress-container');
        const progressFill = container.querySelector('#progress-fill');
        const progressThumb = container.querySelector('#progress-thumb');
        const currentTimeEl = container.querySelector('#current-time');
        const durationTimeEl = container.querySelector('#duration-time');
        const minimizeBtn = container.querySelector('#minimize-player-btn');
        const closeBtn = container.querySelector('.close-modal');
        
        // Guardar referencia al audio actual
        this.currentAudio = {
            element: audio,
            resource: resource
        };
        
        // Formatear tiempo
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        // Metadata cargada
        audio.addEventListener('loadedmetadata', () => {
            durationTimeEl.textContent = formatTime(audio.duration);
        });
        
        // Actualizar progreso
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${progress}%`;
            progressThumb.style.left = `${progress}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        });
        
        // Audio finalizado
        audio.addEventListener('ended', () => {
            playPauseBtn.innerHTML = '<i data-lucide="play" class="w-7 h-7 text-white"></i>';
            if (window.lucide) window.lucide.createIcons();
        });
        
        // Play/Pause (Modal completo)
        playPauseBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playPauseBtn.innerHTML = '<i data-lucide="pause" class="w-7 h-7 text-white"></i>';
            } else {
                audio.pause();
                playPauseBtn.innerHTML = '<i data-lucide="play" class="w-7 h-7 text-white"></i>';
            }
            if (window.lucide) window.lucide.createIcons();
        });
        
        // Rewind/Forward
        rewindBtn.addEventListener('click', () => {
            audio.currentTime = Math.max(0, audio.currentTime - 10);
        });
        
        forwardBtn.addEventListener('click', () => {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        });
        
        // Click en la barra de progreso
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        });
        
        // Drag del thumb
        let isDragging = false;
        
        progressThumb.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = progressContainer.getBoundingClientRect();
            let percent = (e.clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            
            audio.currentTime = percent * audio.duration;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Minimizar
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                this.minimizePlayer(resource);
            });
        }
        
        // Cerrar
        closeBtn.addEventListener('click', () => {
            audio.pause();
            document.body.removeChild(container);
            this.currentAudio = null;
        });
        
        container.addEventListener('click', (e) => {
            if (e.target === container) {
                audio.pause();
                document.body.removeChild(container);
                this.currentAudio = null;
            }
        });
        
        // ESC para cerrar
        const handleEsc = (e) => {
            if (e.key === 'Escape' && document.body.contains(container)) {
                audio.pause();
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
                this.currentAudio = null;
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Minimiza el reproductor a una barra flotante
     */
    minimizePlayer(resource) {
        // Cerrar modal completo
        const modal = document.getElementById('audio-modal');
        if (modal && this.currentAudio) {
            // Mantener el audio reproduciéndose
            const audio = this.currentAudio.element;
            
            // Crear mini player
            const miniPlayer = document.createElement('div');
            miniPlayer.id = 'mini-audio-player';
            miniPlayer.className = 'fixed bottom-4 right-4 z-50 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl overflow-hidden border-2 border-green-400/30 w-80 backdrop-blur-xl';
            miniPlayer.innerHTML = `
                <div class="p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <i data-lucide="music" class="w-5 h-5 text-white"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-bold text-white truncate">${resource.name}</h4>
                            <div class="flex items-center gap-2 text-xs text-green-100">
                                <span id="mini-current-time">0:00</span>
                                <span>/</span>
                                <span id="mini-duration-time">0:00</span>
                            </div>
                        </div>
                        <button id="expand-player-btn" class="p-2 hover:bg-white/10 rounded-lg transition-all" title="Expandir">
                            <i data-lucide="maximize-2" class="w-4 h-4 text-white"></i>
                        </button>
                        <button id="close-mini-player-btn" class="p-2 hover:bg-white/10 rounded-lg transition-all" title="Cerrar">
                            <i data-lucide="x" class="w-4 h-4 text-white"></i>
                        </button>
                    </div>
                    
                    <!-- Barra de progreso mini -->
                    <div class="relative h-2 bg-green-900/50 rounded-full mb-3 cursor-pointer" id="mini-progress-container">
                        <div class="absolute inset-0 bg-white/80 rounded-full transition-all" id="mini-progress-fill" style="width: 0%"></div>
                        <div class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing" id="mini-progress-thumb" style="left: 0%; transform: translate(-50%, -50%);"></div>
                    </div>
                    
                    <!-- Controles mini -->
                    <div class="flex items-center justify-center gap-3">
                        <button id="mini-rewind-btn" class="p-2 hover:bg-white/10 rounded-lg transition-all">
                            <i data-lucide="rewind" class="w-4 h-4 text-white"></i>
                        </button>
                        
                        <button id="mini-play-pause-btn" class="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all">
                            <i data-lucide="pause" class="w-5 h-5 text-white"></i>
                        </button>
                        
                        <button id="mini-forward-btn" class="p-2 hover:bg-white/10 rounded-lg transition-all">
                            <i data-lucide="fast-forward" class="w-4 h-4 text-white"></i>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(miniPlayer);
            this.miniPlayer = miniPlayer;
            
            // Transferir controles al mini player
            this.setupMiniPlayerControls(miniPlayer, audio, resource);
            
            // Remover modal
            document.body.removeChild(modal);
        }
    }
    
    /**
     * Configura los controles del mini reproductor
     */
    setupMiniPlayerControls(miniPlayer, audio, resource) {
        const playPauseBtn = miniPlayer.querySelector('#mini-play-pause-btn');
        const playPauseIcon = playPauseBtn.querySelector('i');
        const rewindBtn = miniPlayer.querySelector('#mini-rewind-btn');
        const forwardBtn = miniPlayer.querySelector('#mini-forward-btn');
        const progressContainer = miniPlayer.querySelector('#mini-progress-container');
        const progressFill = miniPlayer.querySelector('#mini-progress-fill');
        const progressThumb = miniPlayer.querySelector('#mini-progress-thumb');
        const currentTimeEl = miniPlayer.querySelector('#mini-current-time');
        const durationTimeEl = miniPlayer.querySelector('#mini-duration-time');
        const expandBtn = miniPlayer.querySelector('#expand-player-btn');
        const closeBtn = miniPlayer.querySelector('#close-mini-player-btn');
        
        // Formatear tiempo
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        // Actualizar duración
        if (audio.duration) {
            durationTimeEl.textContent = formatTime(audio.duration);
        }
        
        // Actualizar progreso
        audio.addEventListener('timeupdate', () => {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${progress}%`;
            progressThumb.style.left = `${progress}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
        });
        
        // Audio finalizado (mini reproductor)
        audio.addEventListener('ended', () => {
            playPauseBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 text-white"></i>';
            if (window.lucide) window.lucide.createIcons();
        });
        
        // Play/Pause (Mini reproductor)
        playPauseBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playPauseBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5 text-white"></i>';
            } else {
                audio.pause();
                playPauseBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 text-white"></i>';
            }
            if (window.lucide) window.lucide.createIcons();
        });
        
        // Rewind/Forward
        rewindBtn.addEventListener('click', () => {
            audio.currentTime = Math.max(0, audio.currentTime - 10);
        });
        
        forwardBtn.addEventListener('click', () => {
            audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        });
        
        // Click en barra de progreso
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        });
        
        // Drag del thumb
        let isDragging = false;
        
        progressThumb.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = progressContainer.getBoundingClientRect();
            let percent = (e.clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            
            audio.currentTime = percent * audio.duration;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Expandir
        expandBtn.addEventListener('click', () => {
            this.closeMiniPlayer();
            this.createFullAudioPlayer(resource);
            // Transferir estado del audio
            const newModal = document.getElementById('audio-modal');
            const newAudio = newModal.querySelector('#audio-element');
            newAudio.currentTime = audio.currentTime;
            if (!audio.paused) {
                newAudio.play();
            }
        });
        
        // Cerrar
        closeBtn.addEventListener('click', () => {
            this.closeMiniPlayer();
        });
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Cierra el mini reproductor
     */
    closeMiniPlayer() {
        if (this.miniPlayer) {
            if (this.currentAudio && this.currentAudio.element) {
                this.currentAudio.element.pause();
            }
            document.body.removeChild(this.miniPlayer);
            this.miniPlayer = null;
            this.currentAudio = null;
        }
    }
    
    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Descarga un recurso
     */
    downloadResource(resource) {
        const link = document.createElement('a');
        link.href = resource.data;
        link.download = resource.name;
        link.click();
    }
    
    /**
     * Limpia el índice de recursos eliminados (solución en memoria)
     */
    cleanIndexFromDeletedResource(deletedResource) {
        if (!this.indexCache || this.indexCache.length === 0) {
            return;
        }

        console.log('[DEBUG] Limpiando índice del recurso eliminado:', deletedResource.name);

        // Crear un nuevo array filtrando los chunks del recurso eliminado
        // Usamos el nombre del archivo para identificar chunks relacionados
        const originalLength = this.indexCache.length;
        this.indexCache = this.indexCache.filter(chunk => {
            // Si el chunk tiene sourceName, verificar que no sea del recurso eliminado
            if (chunk.sourceName) {
                // Comparar nombres de archivo (ignorando extensión y mayúsculas)
                const chunkFileName = chunk.sourceName.toLowerCase().replace(/\.[^/.]+$/, '');
                const deletedFileName = deletedResource.name.toLowerCase().replace(/\.[^/.]+$/, '');

                if (chunkFileName === deletedFileName) {
                    console.log('[DEBUG] Removiendo chunk del índice:', chunk.sourceName);
                    return false; // Excluir este chunk
                }
            }
            return true; // Mantener este chunk
        });

        const removedChunks = originalLength - this.indexCache.length;
        console.log(`[DEBUG] Índice limpiado: ${removedChunks} chunks removidos, ${this.indexCache.length} restantes`);

        // Notificar al usuario sobre la limpieza del índice
        if (removedChunks > 0) {
            this.notifications.info(`Índice actualizado: ${removedChunks} referencias removidas`);
        }
    }

    /**
     * Alterna el estado de indexación de un recurso (indexado/desindexado)
     * Sincroniza el estado con el backend automáticamente
     */
    toggleResourceIndex(resourceId) {
        console.log('[ResourceManager] Toggle indexación para:', resourceId);
        
        const resources = this.dataManager.data.resources[this.currentSubjectId] || [];
        const resource = resources.find(r => r.id === resourceId);

        if (!resource) {
            console.error('[ResourceManager] Recurso no encontrado:', resourceId);
            this.notifications.error('Recurso no encontrado');
            return;
        }

        // Alternar estado de indexación
        resource.indexed = resource.indexed !== false ? false : true;
        console.log('[ResourceManager] Estado cambiado a:', resource.indexed);

        // Guardar cambios
        this.dataManager.save();

        // Actualizar UI
        this.renderResources();

        // Notificar al usuario
        const status = resource.indexed ? 'indexado' : 'desindexado';
        this.notifications.success('Recurso ' + status + ' correctamente');

        // Sincronizar con backend
        if (resource.indexed) {
            console.log('[ResourceManager] Indexando en backend...');
            this.autoIndexResource(resource);
        } else {
            console.log('[ResourceManager] Desindexando en backend...');
            this.autoDeindexResource(resource);
        }

        // Disparar evento personalizado para que el chat se recargue
        console.log('[ResourceManager] Disparando evento de actualización de índice');
        window.dispatchEvent(new CustomEvent('resource-index-changed', {
            detail: { 
                resourceId: resourceId,
                indexed: resource.indexed 
            }
        }));
    }

    /**
     * Indexa automáticamente un recurso en el backend
     * Genera embeddings y los almacena en Supabase Storage
     */
    async autoIndexResource(resource) {
        console.log('[ResourceManager] Indexando recurso:', resource.name);
        
        // Solo indexar archivos de texto
        if (resource.type !== 'text' && resource.mimeType !== 'text/plain') {
            console.log('[ResourceManager] Recurso no es texto, omitiendo indexación');
            return;
        }
        
        try {
            // Decodificar contenido base64
            const base64Data = resource.data.split(',')[1];
            const decodedText = atob(base64Data);
            
            // Obtener contexto de materia/tema
            if (!this.currentSubjectId || !this.currentTopicId) {
                throw new Error('No hay materia/tema seleccionado');
            }
            
            const subject = this.dataManager.getSubject(this.currentSubjectId);
            const topic = this.dataManager.getTopic(this.currentTopicId);
            
            if (!subject || !topic) {
                throw new Error('No se encontraron los datos de materia/tema');
            }
            
            // Llamar a Supabase Edge Function
            const SUPABASE_URL = 'https://xsumibufekrmfcenyqgq.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdW1pYnVmZWtybWZjZW55cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTExOTIsImV4cCI6MjA3NTA2NzE5Mn0.x-vdT-84cEOj-5SDOVfDbgZMVVWczj8iVM0P_VoEkBc';
            
            const response = await fetch(`${SUPABASE_URL}/functions/v1/index-resources`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subjectId: subject.id,
                    topicId: topic.id,
                    subjectName: subject.name,
                    topicName: topic.name,
                    resourceTexts: [{
                        name: resource.name,
                        text: decodedText
                    }]
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al indexar recurso');
            }
            
            const result = await response.json();
            console.log('[ResourceManager] Indexación completada:', result.chunks, 'chunks');
            
            this.notifications.success(`Recurso indexado con ${result.chunks || 0} fragmentos`);
            
            // Invalidar caché del chat IA
            if (window.app?.aiChatModal) {
                window.app.aiChatModal.invalidateIndexCache();
            }
            
        } catch (error) {
            console.error('[ResourceManager] Error en indexación:', error.message);
            this.notifications.warning('El recurso está guardado pero no se pudo indexar');
        }
    }
    
    /**
     * Desindexar un recurso en el backend
     * Re-indexa todos los recursos EXCEPTO el desindexado
     */
    async autoDeindexResource(resource) {
        console.log('[ResourceManager] Desindexando recurso:', resource.name);
        
        try {
            // Obtener contexto de materia/tema
            if (!this.currentSubjectId || !this.currentTopicId) {
                throw new Error('No hay materia/tema seleccionado');
            }
            
            const subject = this.dataManager.getSubject(this.currentSubjectId);
            const topic = this.dataManager.getTopic(this.currentTopicId);
            
            if (!subject || !topic) {
                throw new Error('No se encontraron los datos de materia/tema');
            }
            
            // Obtener TODOS los recursos indexados EXCEPTO el actual
            const allResources = this.dataManager.data.resources[this.currentSubjectId] || [];
            const indexedResources = allResources.filter(r => 
                r.indexed !== false && 
                r.id !== resource.id &&
                (r.type === 'text' || r.mimeType === 'text/plain')
            );
            
            console.log('[ResourceManager] Recursos indexados restantes:', indexedResources.length);
            
            // Si no quedan recursos indexados, solo actualizar localmente
            if (indexedResources.length === 0) {
                console.log('[ResourceManager] No quedan recursos indexados - omitiendo llamada al backend');
                this.notifications.info('Recurso desindexado - El chat IA ya no lo verá');
                
                // Invalidar caché del chat IA
                if (window.app?.aiChatModal) {
                    window.app.aiChatModal.invalidateIndexCache();
                }
                return;
            }
            
            // Preparar textos para re-indexar
            const resourceTexts = indexedResources.map(r => {
                const base64Data = r.data.split(',')[1];
                const decodedText = atob(base64Data);
                return {
                    name: r.name,
                    text: decodedText
                };
            });
            
            // Re-indexar solo los recursos que siguen indexados
            const SUPABASE_URL = 'https://xsumibufekrmfcenyqgq.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdW1pYnVmZWtybWZjZW55cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTExOTIsImV4cCI6MjA3NTA2NzE5Mn0.x-vdT-84cEOj-5SDOVfDbgZMVVWczj8iVM0P_VoEkBc';
            
            const response = await fetch(`${SUPABASE_URL}/functions/v1/index-resources`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subjectId: subject.id,
                    topicId: topic.id,
                    subjectName: subject.name,
                    topicName: topic.name,
                    resourceTexts: resourceTexts
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al desindexar recurso');
            }
            
            const result = await response.json();
            console.log('[ResourceManager] Desindexación completada:', result.chunks, 'chunks restantes');
            
            this.notifications.info('Recurso desindexado - El chat IA ya no lo verá');
            
            // Invalidar caché del chat IA
            if (window.app?.aiChatModal) {
                window.app.aiChatModal.invalidateIndexCache();
            }
            
        } catch (error) {
            console.error('[ResourceManager] Error en desindexación:', error.message);
            this.notifications.warning('El recurso fue marcado como no indexado localmente');
        }
    }
    
    /**
     * Obtiene el nombre de la materia actual
     */
    getCurrentSubjectName() {
        const studyView = document.getElementById('study-view');
        if (studyView && window.app?.views?.study?.currentSubject) {
            return window.app.views.study.currentSubject.name;
        }
        return 'unknown';
    }
    
    /**
     * Obtiene el nombre del tema actual
     */
    getCurrentTopicName() {
        const studyView = document.getElementById('study-view');
        if (studyView && window.app?.views?.study?.currentTopic) {
            return window.app.views.study.currentTopic.name;
        }
        return 'unknown';
    }

    /**
     * Elimina un recurso
     */
    deleteResource(resourceId) {
        // Los recursos están guardados por MATERIA
        const resources = this.dataManager.data.resources[this.currentSubjectId] || [];
        const resource = resources.find(r => r.id === resourceId);

        if (!resource) {
            console.error('Recurso no encontrado:', resourceId);
            this.notifications.error('Recurso no encontrado');
            return;
        }

        // Mostrar confirmación
        this.showConfirmModal(
            '¿Eliminar recurso?',
            'Se eliminara "' + resource.name + '". Esta accion no se puede deshacer.',
            () => {
                // Eliminar del array
                this.dataManager.data.resources[this.currentSubjectId] = resources.filter(r => r.id !== resourceId);
                
                // Guardar cambios
                this.dataManager.save();
                
                // Actualizar UI
                this.renderResources();
                
                // Notificar
                this.notifications.success('Recurso eliminado correctamente');
                
                // Invalidar caché del chat IA
                if (window.app?.aiChatModal) {
                    window.app.aiChatModal.invalidateIndexCache();
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
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700 animate-fade-in">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-white mb-3">${title}</h3>
                    <p class="text-sm text-slate-300 mb-6">${message}</p>

                    <div class="flex justify-end gap-3">
                        <button id="cancel-confirm" class="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button id="accept-confirm" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = modal.querySelector('#cancel-confirm');
        const acceptBtn = modal.querySelector('#accept-confirm');

        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        acceptBtn.addEventListener('click', () => {
            onConfirm();
            document.body.removeChild(modal);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });

        // Focus en botón cancelar por defecto
        setTimeout(() => cancelBtn.focus(), 100);
    }
}

export default ResourceManager;
