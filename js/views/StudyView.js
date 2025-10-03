/**
 * Vista de estudio - Editor principal con soporte para texto y diagramas Excalidraw
 */
import ResourceManager from '../components/ResourceManager.js';
import EventsManager from '../components/EventsManager.js';
import PomodoroManager from '../components/PomodoroManager.js';
import ExcalidrawManager from '../components/ExcalidrawManager.js';
import AIChatModal from '../components/AIChatModal.js';

/**
 * Vista de estudio de un tema específico
 */
class StudyView {
    constructor(dataManager, router, notifications) {
        this.dataManager = dataManager;
        this.router = router;
        this.notifications = notifications;
        
        this.textEditor = document.getElementById('text-editor');
        this.diagramContainer = document.getElementById('diagram-container');
        
        this.currentSubject = null;
        this.currentTopic = null;
        this.pages = [];
        this.currentPageIndex = 0;
        this.autoSaveTimeout = null;
        
        // Timer de sesión de estudio
        this.studyTimer = null;
        this.timerInterval = null;
        this.isPaused = false;
        this.pausedTime = 0;
        this.beforeUnloadRegistered = false;
        
        // Inicializar componentes
        this.eventsManager = new EventsManager(dataManager, notifications);
        this.resourceManager = new ResourceManager(dataManager, notifications);
        this.pomodoroManager = new PomodoroManager(dataManager, notifications);
        this.diagramManager = new ExcalidrawManager(dataManager, notifications);
        this.aiChatModal = new AIChatModal(dataManager, notifications);
        
        // Carousel state
        this.carouselOffset = 0;
        
        this.initializeEventListeners();
        this.setupDataListeners();
    }
    
    /**
     * Inicializa event listeners de la vista
     */
    initializeEventListeners() {
        // Botón volver
        const backBtn = document.getElementById('back-to-topics');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.saveCurrentPage();
                // NO finalizar sesión, solo ocultar timer y volver
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }
                this.router.navigateTo('topics', this.currentSubject);
            });
        }
        
        // Botón añadir página
        const addPageBtn = document.getElementById('add-page-btn');
        if (addPageBtn) {
            addPageBtn.addEventListener('click', () => this.showPageTypeModal());
        }
        
        // Botón para ciclar sidebars
        const toggleSidebarsBtn = document.getElementById('toggle-sidebars-btn');
        if (toggleSidebarsBtn) {
            toggleSidebarsBtn.addEventListener('click', () => this.cycleSidebars());
        }
        
        // Botón para ocultar header (modo sin distracciones)
        const toggleHeaderBtn = document.getElementById('toggle-header-btn');
        if (toggleHeaderBtn) {
            toggleHeaderBtn.addEventListener('click', () => this.toggleHeader());
        }
        
        // Botones del toolbar
        this.setupEditorToolbar();
        
        // Editor de texto
        if (this.textEditor) {
            this.textEditor.addEventListener('input', () => this.handleTextChange());
            this.textEditor.addEventListener('keydown', (e) => this.handleKeyboard(e));
        }
        
        // Botón exportar PDF
        const exportBtn = document.getElementById('export-pdf-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToPDF());
        }
        
        // Botón Pomodoro
        const pomodoroBtn = document.getElementById('start-pomodoro-btn');
        if (pomodoroBtn) {
            pomodoroBtn.addEventListener('click', () => this.startPomodoro());
        }
        
        // Botón Indexar Recursos
        const indexResourcesBtn = document.getElementById('index-resources-btn');
        if (indexResourcesBtn) {
            indexResourcesBtn.addEventListener('click', () => this.indexResources());
        }
        
        // Botón IA Chat
        const aiChatBtn = document.getElementById('toggle-ai-chat-btn');
        if (aiChatBtn) {
            aiChatBtn.addEventListener('click', () => this.toggleAIChat());
        }
        
        // Carousel navigation
        const carouselPrevBtn = document.getElementById('carousel-prev-btn');
        if (carouselPrevBtn) {
            carouselPrevBtn.addEventListener('click', () => this.scrollCarousel());
        }
    }
    
    /**
     * Inicia el Pomodoro
     */
    startPomodoro() {
        if (!this.currentSubject) {
            this.notifications.error('No hay materia seleccionada');
            return;
        }
        
        // Verificar si ya hay una sesión activa
        if (this.pomodoroManager.isRunning) {
            this.notifications.warning('Ya hay una sesión de Pomodoro en curso. Finalízala primero.');
            return;
        }
        
        this.pomodoroManager.showConfigModal(this.currentSubject.id);
    }
    
    /**
     * Toggle del modal de IA Chat
     */
    toggleAIChat() {
        if (!this.currentSubject || !this.currentTopic) {
            this.notifications.error('No hay tema seleccionado');
            return;
        }
        
        this.aiChatModal.toggle(this.currentSubject, this.currentTopic);
    }
    
    /**
     * Indexar recursos del tema actual para IA
     */
    async indexResources() {
        if (!this.currentSubject || !this.currentTopic) {
            this.notifications.error('No hay tema seleccionado');
            return;
        }
        
        // Obtener recursos de la materia actual (los recursos son por materia, no por tema)
        const resources = this.dataManager.getResources(this.currentSubject.id);
        
        console.log('DEBUG: Recursos encontrados:', resources);
        console.log('DEBUG: Primer recurso completo:', JSON.stringify(resources[0], null, 2));
        
        if (!resources || resources.length === 0) {
            this.notifications.error('No hay recursos para indexar');
            return;
        }
        
        // Filtrar solo TXTs (PDFs requieren procesamiento especial)
        const validResources = resources.filter(r => {
            const hasData = r.data && r.data.length > 0;
            const isTextFile = r.type === 'text' || r.mimeType === 'text/plain' || r.name?.toLowerCase().endsWith('.txt');
            
            console.log('DEBUG: Recurso completo:', r);
            console.log('DEBUG: hasData:', hasData, 'isTextFile:', isTextFile);
            
            return hasData && isTextFile;
        });
        
        console.log('DEBUG: Recursos válidos:', validResources);
        
        if (validResources.length === 0) {
            this.notifications.error('No hay PDFs o archivos de texto para indexar');
            return;
        }
        
        this.notifications.info(`Indexando ${validResources.length} recurso(s)... Esto puede tardar un momento.`);
        
        try {
            // Decodificar archivos base64 a texto
            const resourceTexts = validResources.map(r => {
                // El data está en formato: "data:text/plain;base64,XXXXXX"
                const base64Data = r.data.split(',')[1];
                const decodedText = atob(base64Data);
                return {
                    name: r.name,
                    text: decodedText
                };
            });
            
            // Llamar a Edge Function para indexar
            const SUPABASE_URL = 'https://xsumibufekrmfcenyqgq.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdW1pYnVmZWtybWZjZW55cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTExOTIsImV4cCI6MjA3NTA2NzE5Mn0.x-vdT-84cEOj-5SDOVfDbgZMVVWczj8iVM0P_VoEkBc';
            
            const response = await fetch(`${SUPABASE_URL}/functions/v1/index-resources`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subjectId: this.currentSubject.id,
                    topicId: this.currentTopic.id,
                    subjectName: this.currentSubject.name,
                    topicName: this.currentTopic.name,
                    resourceTexts: resourceTexts
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al indexar recursos');
            }
            
            const result = await response.json();
            
            this.notifications.success(`✅ Índice generado con ${result.chunks} fragmentos`);
            this.notifications.info('💡 El chat IA ya puede usar este contenido automáticamente');
            
        } catch (error) {
            console.error('Error indexando recursos:', error);
            this.notifications.error(`Error: ${error.message}`);
        }
    }
    
    /**
     * Navega el carousel de botones (muestra 1 elemento a la vez)
     * - Slide 0: Botón Indexar (140px)
     * - Slide 1: Botón Chat IA (140px)
     * - Slide 2: Botón Pomodoro (140px)
     * - Slide 3: Toggle + Presentación (2 botones de 36px)
     * - Slide 4: Exportar PDF (1 botón de 36px centrado)
     */
    scrollCarousel() {
        const carousel = document.getElementById('header-carousel');
        if (!carousel) return;
        
        // Total de elementos: 5 slides
        const totalSlides = 5;
        const slideWidth = 142; // 140px elemento + 2px gap
        
        this.carouselOffset = (this.carouselOffset + 1) % totalSlides;
        const translateX = -this.carouselOffset * slideWidth;
        
        carousel.style.transform = `translateX(${translateX}px)`;
    }
    
    /**
     * Configura el toolbar del editor
     */
    setupEditorToolbar() {
        // Botones de formato básico
        document.querySelectorAll('.editor-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                const value = btn.dataset.value || null;
                this.executeCommand(command, value);
            });
        });
        
        // Encabezados
        const heading1Btn = document.getElementById('heading1-btn');
        if (heading1Btn) {
            heading1Btn.addEventListener('click', () => this.insertHeading(1));
        }
        
        const heading2Btn = document.getElementById('heading2-btn');
        if (heading2Btn) {
            heading2Btn.addEventListener('click', () => this.insertHeading(2));
        }
        
        const heading3Btn = document.getElementById('heading3-btn');
        if (heading3Btn) {
            heading3Btn.addEventListener('click', () => this.insertHeading(3));
        }
        
        // Tamaño de fuente con selector
        const fontSizeSelect = document.getElementById('font-size-select');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', () => {
                const size = fontSizeSelect.value;
                this.applyFontSize(size);
            });
        }
        
        // Recuadro de texto
        const textboxBtn = document.getElementById('add-textbox-btn');
        if (textboxBtn) {
            textboxBtn.addEventListener('click', () => this.insertTextBox());
        }
        
        // Imagen
        const imageBtn = document.getElementById('add-image-btn');
        if (imageBtn) {
            imageBtn.addEventListener('click', () => this.showImageDialog());
        }
        
        // Video YouTube
        const videoBtn = document.getElementById('add-video-btn');
        if (videoBtn) {
            videoBtn.addEventListener('click', () => this.showVideoDialog());
        }
        
        // Lista de tareas
        const checklistBtn = document.getElementById('checklist-btn');
        if (checklistBtn) {
            checklistBtn.addEventListener('click', () => this.insertChecklist());
        }
        
        // Resaltador con menú
        const highlightBtn = document.getElementById('highlight-btn');
        const highlightMenu = document.getElementById('highlight-menu');
        
        if (highlightBtn && highlightMenu) {
            highlightBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                highlightMenu.classList.toggle('hidden');
            });
            
            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', () => {
                highlightMenu.classList.add('hidden');
            });
            
            // Botones de colores
            highlightMenu.querySelectorAll('.highlight-color').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const color = btn.dataset.color;
                    this.applyHighlight(color);
                    highlightMenu.classList.add('hidden');
                });
            });
        }
        
        // Color de texto
        const textColorBtn = document.getElementById('text-color-btn');
        if (textColorBtn) {
            textColorBtn.addEventListener('click', () => this.insertTextColor());
        }
        
        // Tabla
        const tableBtn = document.getElementById('add-table-btn');
        if (tableBtn) {
            tableBtn.addEventListener('click', () => this.showTableDialog());
        }
        
        // Bloque de código
        const codeBtn = document.getElementById('add-code-btn');
        if (codeBtn) {
            codeBtn.addEventListener('click', () => this.insertCodeBlock());
        }
        
        // Cita
        const quoteBtn = document.getElementById('add-quote-btn');
        if (quoteBtn) {
            quoteBtn.addEventListener('click', () => this.insertQuote());
        }
        
        // Caja desplegable
        const collapsibleBtn = document.getElementById('add-collapsible-btn');
        if (collapsibleBtn) {
            collapsibleBtn.addEventListener('click', () => this.insertCollapsibleBox());
        }
        
        // Botón guardar
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentPage());
        }
    }
    
    /**
     * Configura listeners para cambios de datos
     */
    setupDataListeners() {
        this.dataManager.on('pageCreated', (event) => {
            if (event.topicId === this.currentTopic?.id) {
                this.loadPages();
            }
        });
        
        this.dataManager.on('pageUpdated', (event) => {
            if (event.topicId === this.currentTopic?.id) {
                this.updateSaveStatus('saved');
            }
        });
        
        // Escuchar eventos de recursos para actualizar en tiempo real
        this.dataManager.on('resourceAdded', (event) => {
            if (event.topicId === this.currentSubject?.id && this.resourceManager) {
                console.log('Recurso añadido, actualizando vista...', event);
                this.resourceManager.renderResources();
            }
        });
        
        this.dataManager.on('resourceDeleted', (event) => {
            if (event.topicId === this.currentSubject?.id && this.resourceManager) {
                console.log('Recurso eliminado, actualizando vista...', event);
                this.resourceManager.renderResources();
            }
        });
    }
    
    /**
     * Renderiza la vista de estudio
     */
    render(data) {
        if (!data || !data.topic) {
            console.warn('Datos insuficientes para renderizar vista de estudio');
            this.router.navigateTo('dashboard');
            return;
        }
        
        // Cargar objetos completos si solo tenemos IDs
        let subject = data.subject;
        let topic = data.topic;
        
        // Si subject solo tiene ID, cargar el objeto completo
        if (subject && subject.id && !subject.name) {
            const fullSubject = this.dataManager.getSubjects().find(s => s.id === subject.id);
            if (!fullSubject) {
                console.warn('Materia no encontrada');
                this.router.navigateTo('dashboard');
                return;
            }
            subject = fullSubject;
        }
        
        // Si topic solo tiene ID, cargar el objeto completo
        if (topic && topic.id && !topic.name && subject) {
            const fullTopic = this.dataManager.getTopics(subject.id).find(t => t.id === topic.id);
            if (!fullTopic) {
                console.warn('Tema no encontrado');
                this.router.navigateTo('topics', subject);
                return;
            }
            topic = fullTopic;
        }
        
        this.currentSubject = subject;
        this.currentTopic = topic;
        
        this.container = document.getElementById('study-view');
        this.pagesList = document.getElementById('pages-list');
        this.pageCounter = document.getElementById('page-counter');
        this.textEditor = document.getElementById('text-editor');
        this.excalidrawContainer = document.getElementById('excalidraw-container');
        
        const titleElement = document.getElementById('study-view-title');
        const breadcrumbElement = document.getElementById('study-view-breadcrumb');
        
        if (titleElement) {
            titleElement.textContent = this.currentTopic.name;
            titleElement.dataset.subjectId = this.currentSubject.id;
        }
        if (breadcrumbElement) {
            breadcrumbElement.textContent = `En ${this.currentSubject.name}`;
        }
        
        // Cargar páginas del tema
        this.loadPages();
        
        // Cargar eventos de la materia
        if (this.eventsManager) {
            this.eventsManager.loadEvents(this.currentSubject.id);
        }
        
        // Inicializar ResourceManager para la MATERIA (no el tema)
        // Los recursos son por materia, no por tema individual
        this.resourceManager.loadResources(this.currentSubject.id);
        
        // Inicializar o continuar sesión de estudio
        this.initializeStudySession();
    }
    
    /**
     * Carga las páginas del tema actual
     */
    loadPages() {
        if (!this.currentTopic) return;
        
        this.pages = this.dataManager.getPages(this.currentTopic.id);
        
        // Si no hay páginas, crear la primera
        if (this.pages.length === 0) {
            this.createFirstPage();
            return;
        }
        
        this.renderPagesList();
        this.loadPage(this.currentPageIndex);
    }
    
    /**
     * Crea la primera página del tema
     */
    createFirstPage() {
        const page = this.dataManager.createPage(this.currentTopic.id, {
            type: 'text',
            title: `Introducción a ${this.currentTopic.name}`,
            content: `<h1>${this.currentTopic.name}</h1><p>Comienza a escribir tus apuntes aquí...</p>`
        });
        
        this.pages = [page];
        this.currentPageIndex = 0;
        this.renderPagesList();
        this.loadPage(0);
    }
    
    /**
     * Renderiza la lista de páginas
     */
    renderPagesList() {
        const pagesList = document.getElementById('pages-list');
        const pageCounter = document.getElementById('page-counter');
        
        if (!pagesList) {
            console.error('No se encontró el elemento pages-list');
            return;
        }
        
        // Actualizar contador
        if (pageCounter) {
            pageCounter.textContent = `${this.currentPageIndex + 1}/${this.pages.length}`;
        }
        
        // Renderizar lista
        pagesList.innerHTML = this.pages.map((page, index) => `
            <div class="page-thumbnail ${index === this.currentPageIndex ? 'active' : ''} p-3 rounded-lg bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors group"
                 data-page-index="${index}"
                 data-page-id="${page.id}"
                 draggable="true"
                 tabindex="0"
                 role="button"
                 aria-label="Ir a página ${index + 1}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="grip-vertical" class="w-3 h-3 text-gray-400 drag-handle"></i>
                        <i data-lucide="${page.type === 'excalidraw' ? 'lightbulb' : 'file-text'}" class="w-4 h-4 ${page.type === 'excalidraw' ? 'text-purple-500' : 'text-blue-500'}"></i>
                        <span class="text-xs font-medium">Página ${index + 1}</span>
                    </div>
                    <button class="delete-page-btn opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all" 
                            data-page-index="${index}" 
                            title="Eliminar página">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
                <h4 class="page-title text-sm font-medium line-clamp-1 mb-1 cursor-text" 
                   data-page-index="${index}" 
                   title="Doble clic para editar">${page.title || `Página ${index + 1}`}</h4>
                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    ${this.getPagePreview(page)}
                </p>
            </div>
        `).join('');
        
        // Event listeners para páginas
        pagesList.querySelectorAll('.page-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                // No navegar si se está arrastrando o haciendo clic en botones
                if (e.target.closest('.drag-handle') || e.target.closest('.delete-page-btn')) return;
                
                const index = parseInt(thumb.dataset.pageIndex);
                this.switchToPage(index);
            });
            
            thumb.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const index = parseInt(thumb.dataset.pageIndex);
                    this.switchToPage(index);
                }
            });
            
            // Event listener para eliminar página
            const deleteBtn = thumb.querySelector('.delete-page-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = parseInt(deleteBtn.dataset.pageIndex);
                    this.deletePage(index);
                });
            }
            
            // Event listener para editar título (doble clic)
            const titleElement = thumb.querySelector('.page-title');
            if (titleElement) {
                titleElement.addEventListener('dblclick', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = parseInt(titleElement.dataset.pageIndex);
                    this.editPageTitle(index);
                });
            }
            
            // Drag and drop events
            thumb.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', thumb.dataset.pageIndex);
                thumb.classList.add('dragging');
            });
            
            thumb.addEventListener('dragend', () => {
                thumb.classList.remove('dragging');
            });
            
            thumb.addEventListener('dragover', (e) => {
                e.preventDefault();
                thumb.classList.add('drag-over');
            });
            
            thumb.addEventListener('dragleave', () => {
                thumb.classList.remove('drag-over');
            });
            
            thumb.addEventListener('drop', (e) => {
                e.preventDefault();
                thumb.classList.remove('drag-over');
                
                const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const targetIndex = parseInt(thumb.dataset.pageIndex);
                
                if (draggedIndex !== targetIndex) {
                    this.reorderPages(draggedIndex, targetIndex);
                }
            });
        });
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Reordena las páginas mediante drag and drop
     */
    reorderPages(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        try {
            // Guardar página actual antes de reordenar
            this.saveCurrentPage();
            
            // Reordenar en el array local
            const movedPage = this.pages.splice(fromIndex, 1)[0];
            this.pages.splice(toIndex, 0, movedPage);
            
            // Actualizar índice de página actual si es necesario
            if (this.currentPageIndex === fromIndex) {
                this.currentPageIndex = toIndex;
            } else if (fromIndex < this.currentPageIndex && toIndex >= this.currentPageIndex) {
                this.currentPageIndex--;
            } else if (fromIndex > this.currentPageIndex && toIndex <= this.currentPageIndex) {
                this.currentPageIndex++;
            }
            
            // Actualizar en DataManager
            // TODO: Implementar reordenamiento en DataManager si es necesario
            
            // Re-renderizar lista
            this.renderPagesList();
            
            this.notifications.success('Páginas reordenadas');
            
        } catch (error) {
            console.error('Error reordenando páginas:', error);
            this.notifications.error('Error al reordenar páginas');
        }
    }
    
    /**
     * Elimina una página
     */
    deletePage(pageIndex) {
        if (!this.currentTopic || pageIndex < 0 || pageIndex >= this.pages.length) return;
        
        const page = this.pages[pageIndex];
        const pageTitle = page.title || `Página ${pageIndex + 1}`;
        
        this.showConfirmModal(
            '¿Eliminar esta página?',
            `Se eliminará "${pageTitle}" y todo su contenido. Esta acción no se puede deshacer.`,
            () => {
                try {
                    // Eliminar del DataManager
                    this.dataManager.deletePage(this.currentTopic.id, page.id);
                    
                    // Recargar páginas
                    this.loadPages();
                    
                    // Ajustar página actual si es necesario
                    if (this.currentPageIndex >= this.pages.length) {
                        this.currentPageIndex = Math.max(0, this.pages.length - 1);
                    }
                    
                    // Cargar página actual
                    if (this.pages.length > 0) {
                        this.loadPage(this.currentPageIndex);
                    } else {
                        // No hay páginas, crear una nueva
                        this.createPageWithDefaultTitle('text');
                        return;
                    }
                    
                    this.notifications.success(`Página "${pageTitle}" eliminada`);
                    
                } catch (error) {
                    console.error('Error eliminando página:', error);
                    this.notifications.error('Error al eliminar la página');
                }
            }
        );
    }
    
    /**
     * Permite editar el título de una página
     */
    editPageTitle(pageIndex) {
        if (!this.currentTopic || pageIndex < 0 || pageIndex >= this.pages.length) return;
        
        const page = this.pages[pageIndex];
        const currentTitle = page.title || `Página ${pageIndex + 1}`;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Editar título de página</h3>
                <form id="edit-title-form">
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nuevo título
                        </label>
                        <input 
                            type="text" 
                            id="new-page-title"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            value="${currentTitle}"
                            required
                            maxlength="100"
                        >
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" class="cancel-edit-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = modal.getElementById('new-page-title');
        const form = modal.getElementById('edit-title-form');
        const cancelBtn = modal.querySelector('.cancel-edit-btn');
        
        // Event listeners
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newTitle = input.value.trim();
            
            if (!newTitle) {
                this.notifications.error('El título no puede estar vacío');
                return;
            }
            
            try {
                // Actualizar en DataManager
                this.dataManager.updatePage(this.currentTopic.id, page.id, { title: newTitle });
                
                // Recargar páginas
                this.loadPages();
                
                this.notifications.success('Título actualizado');
                document.body.removeChild(modal);
                
            } catch (error) {
                console.error('Error actualizando título:', error);
                this.notifications.error('Error al actualizar el título');
            }
        });
        
        // Focus y seleccionar texto
        input.focus();
        input.select();
    }
    
    /**
     * Obtiene una preview del contenido de la página
     */
    getPagePreview(page) {
        if (page.type === 'excalidraw') {
            return 'Canvas de dibujo';
        }
        
        // Extraer texto plano del HTML
        const div = document.createElement('div');
        div.innerHTML = page.content || '';
        const text = div.textContent || div.innerText || '';
        return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    /**
     * Cambia a una página específica
     */
    switchToPage(index) {
        if (index < 0 || index >= this.pages.length) return;
        
        // Guardar página actual
        this.saveCurrentPage();
        
        // Cambiar índice
        this.currentPageIndex = index;
        
        // Cargar nueva página
        this.loadPage(index);
        
        // Actualizar lista
        this.renderPagesList();
    }
    
    /**
     * Carga una página específica
     */
    loadPage(index) {
        const page = this.pages[index];
        if (!page) return;
        
        if (page.type === 'excalidraw') {
            this.showDiagram(page);
        } else {
            this.showTextEditor(page);
        }
    }
    
    /**
     * Muestra el editor de texto
     */
    showTextEditor(page) {
        // Ocultar diagrama
        if (this.diagramContainer) {
            this.diagramContainer.classList.add('hidden');
        }
        
        // Mostrar editor de texto
        if (this.textEditor) {
            this.textEditor.classList.remove('hidden');
            this.textEditor.innerHTML = page.content || '';
            
            // Restaurar event listeners de elementos dinámicos
            this.restoreEventListeners();
            
            this.textEditor.focus();
        }
        
        // Mostrar toolbar
        const toolbar = document.getElementById('editor-toolbar');
        if (toolbar) {
            toolbar.classList.remove('hidden');
        }
    }
    
    /**
     * Restaura event listeners de elementos dinámicos después de cargar contenido
     */
    restoreEventListeners() {
        // Restaurar listeners de cajas desplegables
        const collapsibleBoxes = this.textEditor.querySelectorAll('.collapsible-box');
        collapsibleBoxes.forEach(box => {
            this.attachCollapsibleListeners(box);
        });
        
        // Restaurar listeners de imágenes
        const imageWrappers = this.textEditor.querySelectorAll('.image-wrapper');
        imageWrappers.forEach(wrapper => {
            this.attachImageListeners(wrapper);
        });
        
        // Restaurar listeners de recuadros de texto
        const textboxWrappers = this.textEditor.querySelectorAll('.textbox-wrapper');
        textboxWrappers.forEach(wrapper => {
            this.attachTextboxListeners(wrapper);
        });
        
        // Restaurar listeners de tablas
        const tableWrappers = this.textEditor.querySelectorAll('.table-wrapper');
        tableWrappers.forEach(wrapper => {
            this.attachTableListeners(wrapper);
        });
        
        // Restaurar listeners de videos
        const videoWrappers = this.textEditor.querySelectorAll('.video-wrapper');
        videoWrappers.forEach(wrapper => {
            const deleteBtn = wrapper.querySelector('.delete-video-btn');
            if (deleteBtn) {
                const newDeleteBtn = deleteBtn.cloneNode(true);
                deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
                
                newDeleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (wrapper.parentNode) {
                        wrapper.parentNode.removeChild(wrapper);
                        this.handleTextChange();
                    }
                });
            }
        });
        
        // Actualizar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Adjunta listeners a un wrapper de imagen
     */
    attachImageListeners(imageWrapper) {
        const img = imageWrapper.querySelector('.resizable-image');
        const resizeHandle = imageWrapper.querySelector('.resize-handle');
        const deleteBtn = imageWrapper.querySelector('.delete-image-btn');
        const alignLeftBtn = imageWrapper.querySelector('.align-left-btn');
        const alignCenterBtn = imageWrapper.querySelector('.align-center-btn');
        const alignRightBtn = imageWrapper.querySelector('.align-right-btn');
        const textWrapBtn = imageWrapper.querySelector('.text-wrap-btn');
        const cropBtn = imageWrapper.querySelector('.crop-image-btn');
        
        // Eliminar
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            
            newDeleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (imageWrapper.parentNode) {
                    imageWrapper.parentNode.removeChild(imageWrapper);
                    this.handleTextChange();
                }
            });
        }
        
        // Alinear izquierda
        if (alignLeftBtn) {
            const newBtn = alignLeftBtn.cloneNode(true);
            alignLeftBtn.parentNode.replaceChild(newBtn, alignLeftBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageWrapper.style.display = 'block';
                imageWrapper.style.marginLeft = '0';
                imageWrapper.style.marginRight = 'auto';
                imageWrapper.style.float = 'none';
                imageWrapper.style.width = 'fit-content';
                this.handleTextChange();
            });
        }
        
        // Centrar
        if (alignCenterBtn) {
            const newBtn = alignCenterBtn.cloneNode(true);
            alignCenterBtn.parentNode.replaceChild(newBtn, alignCenterBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageWrapper.style.display = 'block';
                imageWrapper.style.marginLeft = 'auto';
                imageWrapper.style.marginRight = 'auto';
                imageWrapper.style.float = 'none';
                imageWrapper.style.width = 'fit-content';
                this.handleTextChange();
            });
        }
        
        // Alinear derecha
        if (alignRightBtn) {
            const newBtn = alignRightBtn.cloneNode(true);
            alignRightBtn.parentNode.replaceChild(newBtn, alignRightBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageWrapper.style.display = 'block';
                imageWrapper.style.marginLeft = 'auto';
                imageWrapper.style.marginRight = '0';
                imageWrapper.style.float = 'none';
                imageWrapper.style.width = 'fit-content';
                this.handleTextChange();
            });
        }
        
        // Text wrapping
        if (textWrapBtn) {
            const newBtn = textWrapBtn.cloneNode(true);
            textWrapBtn.parentNode.replaceChild(newBtn, textWrapBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentFloat = imageWrapper.style.float;
                if (currentFloat === 'left') {
                    imageWrapper.style.float = 'right';
                    imageWrapper.style.marginLeft = '1rem';
                    imageWrapper.style.marginRight = '0';
                    imageWrapper.style.marginBottom = '1rem';
                } else if (currentFloat === 'right') {
                    imageWrapper.style.float = 'none';
                    imageWrapper.style.marginLeft = 'auto';
                    imageWrapper.style.marginRight = 'auto';
                    imageWrapper.style.marginBottom = '1rem';
                } else {
                    imageWrapper.style.float = 'left';
                    imageWrapper.style.marginRight = '1rem';
                    imageWrapper.style.marginLeft = '0';
                    imageWrapper.style.marginBottom = '1rem';
                }
                this.handleTextChange();
            });
        }
        
        // Recortar
        if (cropBtn) {
            const newBtn = cropBtn.cloneNode(true);
            cropBtn.parentNode.replaceChild(newBtn, cropBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showSimpleCropDialog(img, imageWrapper);
            });
        }
        
        // Redimensionamiento
        if (resizeHandle && img) {
            const newHandle = resizeHandle.cloneNode(true);
            resizeHandle.parentNode.replaceChild(newHandle, resizeHandle);
            
            newHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let isResizing = true;
                const startX = e.clientX;
                const startWidth = img.offsetWidth;
                
                const resize = (e) => {
                    if (!isResizing) return;
                    const width = startWidth + (e.clientX - startX);
                    if (width > 50 && width < this.textEditor.offsetWidth) {
                        img.style.width = width + 'px';
                    }
                };
                
                const stopResize = () => {
                    isResizing = false;
                    document.removeEventListener('mousemove', resize);
                    document.removeEventListener('mouseup', stopResize);
                    this.handleTextChange();
                };
                
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            });
        }
        
        // Habilitar drag & drop
        this.makeDraggable(imageWrapper);
    }
    
    /**
     * Adjunta listeners a un wrapper de textbox
     */
    attachTextboxListeners(textboxWrapper) {
        const deleteBtn = textboxWrapper.querySelector('.delete-textbox-btn');
        const resizeHandle = textboxWrapper.querySelector('.resize-handle-textbox');
        const alignLeftBtn = textboxWrapper.querySelector('.textbox-align-left-btn');
        const alignCenterBtn = textboxWrapper.querySelector('.textbox-align-center-btn');
        const alignRightBtn = textboxWrapper.querySelector('.textbox-align-right-btn');
        const wrapBtn = textboxWrapper.querySelector('.textbox-wrap-btn');
        
        if (deleteBtn) {
            const newBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (textboxWrapper.parentNode) {
                    textboxWrapper.parentNode.removeChild(textboxWrapper);
                    this.handleTextChange();
                }
            });
        }
        
        if (alignLeftBtn) {
            const newBtn = alignLeftBtn.cloneNode(true);
            alignLeftBtn.parentNode.replaceChild(newBtn, alignLeftBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                textboxWrapper.style.marginLeft = '0';
                textboxWrapper.style.marginRight = 'auto';
                textboxWrapper.style.float = 'none';
                this.handleTextChange();
            });
        }
        
        if (alignCenterBtn) {
            const newBtn = alignCenterBtn.cloneNode(true);
            alignCenterBtn.parentNode.replaceChild(newBtn, alignCenterBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                textboxWrapper.style.marginLeft = 'auto';
                textboxWrapper.style.marginRight = 'auto';
                textboxWrapper.style.float = 'none';
                this.handleTextChange();
            });
        }
        
        if (alignRightBtn) {
            const newBtn = alignRightBtn.cloneNode(true);
            alignRightBtn.parentNode.replaceChild(newBtn, alignRightBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                textboxWrapper.style.marginLeft = 'auto';
                textboxWrapper.style.marginRight = '0';
                textboxWrapper.style.float = 'none';
                this.handleTextChange();
            });
        }
        
        if (wrapBtn) {
            const newBtn = wrapBtn.cloneNode(true);
            wrapBtn.parentNode.replaceChild(newBtn, wrapBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentFloat = textboxWrapper.style.float;
                if (currentFloat === 'left') {
                    textboxWrapper.style.float = 'right';
                    textboxWrapper.style.marginLeft = '1rem';
                    textboxWrapper.style.marginRight = '0';
                    textboxWrapper.style.marginBottom = '1rem';
                } else if (currentFloat === 'right') {
                    textboxWrapper.style.float = 'none';
                    textboxWrapper.style.marginLeft = 'auto';
                    textboxWrapper.style.marginRight = 'auto';
                    textboxWrapper.style.marginBottom = '1rem';
                } else {
                    textboxWrapper.style.float = 'left';
                    textboxWrapper.style.marginRight = '1rem';
                    textboxWrapper.style.marginLeft = '0';
                    textboxWrapper.style.marginBottom = '1rem';
                }
                this.handleTextChange();
            });
        }
        
        if (resizeHandle) {
            const newHandle = resizeHandle.cloneNode(true);
            resizeHandle.parentNode.replaceChild(newHandle, resizeHandle);
            
            newHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let isResizing = true;
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = textboxWrapper.offsetWidth;
                const startHeight = textboxWrapper.offsetHeight;
                
                const resize = (e) => {
                    if (!isResizing) return;
                    const width = startWidth + (e.clientX - startX);
                    const height = startHeight + (e.clientY - startY);
                    if (width > 100) {
                        textboxWrapper.style.width = width + 'px';
                    }
                    if (height > 60) {
                        textboxWrapper.style.height = height + 'px';
                    }
                };
                
                const stopResize = () => {
                    isResizing = false;
                    document.removeEventListener('mousemove', resize);
                    document.removeEventListener('mouseup', stopResize);
                    this.handleTextChange();
                };
                
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            });
        }
    }
    
    /**
     * Adjunta listeners a un wrapper de tabla
     */
    attachTableListeners(tableWrapper) {
        const deleteBtn = tableWrapper.querySelector('.delete-table-btn');
        const table = tableWrapper.querySelector('.study-table');
        
        if (deleteBtn) {
            const newBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (tableWrapper.parentNode) {
                    tableWrapper.parentNode.removeChild(tableWrapper);
                    this.handleTextChange();
                }
            });
        }
        
        // Restaurar resizers de columnas
        const resizers = tableWrapper.querySelectorAll('.column-resizer');
        resizers.forEach((resizer, index) => {
            const newResizer = resizer.cloneNode(true);
            resizer.parentNode.replaceChild(newResizer, resizer);
            
            const th = newResizer.parentElement;
            const colIndex = index;
            
            newResizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let isResizing = true;
                const startX = e.clientX;
                const startWidth = th.offsetWidth;
                document.body.style.cursor = 'col-resize';
                
                const resize = (e) => {
                    if (!isResizing) return;
                    const width = startWidth + (e.clientX - startX);
                    if (width > 50) {
                        th.style.width = width + 'px';
                        th.style.minWidth = width + 'px';
                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const cell = row.cells[colIndex];
                            if (cell) {
                                cell.style.width = width + 'px';
                                cell.style.minWidth = width + 'px';
                            }
                        });
                    }
                };
                
                const stopResize = () => {
                    if (isResizing) {
                        isResizing = false;
                        document.body.style.cursor = '';
                        document.removeEventListener('mousemove', resize);
                        document.removeEventListener('mouseup', stopResize);
                        this.handleTextChange();
                    }
                };
                
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            });
            
            newResizer.addEventListener('mouseenter', () => {
                newResizer.style.background = 'rgba(99, 102, 241, 0.5)';
            });
            
            newResizer.addEventListener('mouseleave', () => {
                newResizer.style.background = 'transparent';
            });
        });
    }
    
    /**
     * Muestra el editor de diagramas Excalidraw
     */
    async showDiagram(page) {
        // Ocultar editor de texto
        if (this.textEditor) {
            this.textEditor.classList.add('hidden');
        }

        // Ocultar toolbar del editor de texto
        const toolbar = document.getElementById('editor-toolbar');
        if (toolbar) {
            toolbar.classList.add('hidden');
        }

        // Mostrar contenedor de diagramas
        this.diagramManager.show();

        try {
            // Inicializar Excalidraw si no está ya inicializado
            if (!this.diagramManager.isInitialized) {
                await this.diagramManager.initialize();
            }
            
            // Cargar el diagrama
            await this.diagramManager.loadDiagram(page.content, page.id);
        } catch (error) {
            console.error('Error mostrando diagrama:', error);
            this.notifications.error('Error al cargar el diagrama');
        }
    }
    
    /**
     * Muestra modal para seleccionar tipo de página
     */
    showPageTypeModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Seleccionar tipo de página</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <button type="button" class="page-type-btn p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-500 transition-colors" data-type="text">
                        <div class="flex flex-col items-center">
                            <i data-lucide="file-text" class="w-12 h-12 text-blue-500 mb-3"></i>
                            <span class="text-sm font-medium">Página de Texto</span>
                            <span class="text-xs text-gray-500 mt-1">Editor de texto rico</span>
                        </div>
                    </button>
                    <button type="button" class="page-type-btn p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-500 transition-colors" data-type="excalidraw">
                        <div class="flex flex-col items-center">
                            <i data-lucide="lightbulb" class="w-12 h-12 text-purple-500 mb-3"></i>
                            <span class="text-sm font-medium">Página de Ideas</span>
                            <span class="text-xs text-gray-500 mt-1">Diagramas y mapas mentales</span>
                        </div>
                    </button>
                </div>
                <div class="flex justify-end space-x-3">
                    <button type="button" class="cancel-modal-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners para tipos de página
        modal.querySelectorAll('.page-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.createPageWithDefaultTitle(type);
                document.body.removeChild(modal);
            });
        });
        
        // Event listeners para cancelar
        const cancelBtn = modal.querySelector('.cancel-modal-btn');
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Crea una nueva página con título por defecto
     */
    createPageWithDefaultTitle(type) {
        if (!this.currentTopic) return;
        
        const pageNumber = this.pages.length + 1;
        const title = type === 'excalidraw' ? `Ideas ${pageNumber}` : `Página Nueva ${pageNumber}`;
        
        this.createPageWithTitle(type, title);
    }
    
    /**
     * Crea una nueva página con título personalizado
     */
    createPageWithTitle(type, title) {
        if (!this.currentTopic) return;
        
        const pageData = {
            type,
            title,
            content: type === 'excalidraw' ? '{}' : `<h1>${title}</h1><p>Contenido de la página...</p>`
        };
        
        try {
            const page = this.dataManager.createPage(this.currentTopic.id, pageData);
            
            // Recargar páginas desde DataManager para evitar duplicados
            this.loadPages();
            
            // Cambiar a la nueva página (será la última)
            this.switchToPage(this.pages.length - 1);
            
            this.notifications.success(`Nueva página "${title}" creada`);
        } catch (error) {
            console.error('Error creando página:', error);
            this.notifications.error('Error al crear la página');
        }
    }
    
    /**
     * Crea una nueva página (método legacy)
     */
    createPage(type) {
        if (!this.currentTopic) return;
        
        const pageNumber = this.pages.length + 1;
        const title = type === 'excalidraw' ? `Ideas ${pageNumber}` : `Página ${pageNumber}`;
        
        this.createPageWithTitle(type, title);
    }
    
    /**
     * Ejecuta comando de formato en el editor
     */
    executeCommand(command, value = null) {
        if (!this.textEditor) return;
        
        try {
            document.execCommand(command, false, value);
            this.textEditor.focus();
            this.handleTextChange();
        } catch (error) {
            console.error('Error ejecutando comando:', error);
        }
    }
    
    /**
     * Inserta una caja desplegable
     */
    insertCollapsibleBox() {
        const html = `
            <div class="collapsible-box group expanded" contenteditable="false">
                <div class="collapsible-header">
                    <span contenteditable="true">Título de la caja</span>
                    <div class="flex items-center gap-1">
                        <button class="delete-collapsible-btn opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded" title="Eliminar caja">
                            <i data-lucide="x" class="w-4 h-4 text-red-500"></i>
                        </button>
                        <i data-lucide="chevron-down" class="collapsible-icon w-4 h-4" style="transform: rotate(180deg); transition: transform 0.3s ease;"></i>
                    </div>
                </div>
                <div class="collapsible-content" contenteditable="true">
                    <p>Contenido de la caja desplegable...</p>
                </div>
            </div>
        `;
        
        // Validar y obtener posición de inserción
        const range = this.getValidInsertionRange();
        if (!range) {
            this.notifications.warning('No se puede insertar una caja dentro del título de otra caja');
            return;
        }
        
        range.deleteContents();
        
        const div = document.createElement('div');
        div.innerHTML = html;
        const collapsibleBox = div.firstElementChild;
        range.insertNode(collapsibleBox);
            
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Adjuntar event listeners
        this.attachCollapsibleListeners(collapsibleBox);
        
        // Seleccionar el título para que el usuario pueda editarlo inmediatamente
        const titleSpan = collapsibleBox.querySelector('.collapsible-header span');
        if (titleSpan) {
            setTimeout(() => {
                titleSpan.focus();
                const range = document.createRange();
                range.selectNodeContents(titleSpan);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }, 10);
        }
        
        this.handleTextChange();
    }
    
    /**
     * Adjunta event listeners a una caja desplegable
     */
    attachCollapsibleListeners(box) {
        const header = box.querySelector('.collapsible-header');
        const deleteBtn = box.querySelector('.delete-collapsible-btn');
        const content = box.querySelector('.collapsible-content');
        const icon = box.querySelector('.collapsible-icon');
        
        // Remover listeners previos clonando elementos
        if (header) {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // Click en el header (excepto en el botón eliminar y el título)
            newHeader.addEventListener('click', (e) => {
                // No hacer nada si se hace click en el botón eliminar o en el span editable
                if (e.target.closest('.delete-collapsible-btn') || e.target.tagName === 'SPAN') {
                    return;
                }
                
                // Toggle del contenido usando la clase 'expanded'
                box.classList.toggle('expanded');
                const currentIcon = newHeader.querySelector('.collapsible-icon');
                if (currentIcon) {
                    currentIcon.style.transform = box.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
                    currentIcon.style.transition = 'transform 0.3s ease';
                }
            });
            
            // Actualizar referencia al header
            const updatedDeleteBtn = newHeader.querySelector('.delete-collapsible-btn');
            if (updatedDeleteBtn) {
                updatedDeleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (box.parentNode) {
                        box.parentNode.removeChild(box);
                        this.handleTextChange();
                    }
                });
            }
        }
    }
    
    /**
     * Maneja cambios en el editor de texto
     */
    handleTextChange() {
        this.updateSaveStatus('unsaved');
        
        // Auto-guardar
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentPage();
        }, 3000);
    }
    
    /**
     * Maneja atajos de teclado
     */
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveCurrentPage();
                    break;
                case 'b':
                    e.preventDefault();
                    this.executeCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.executeCommand('italic');
                    break;
                case 'u':
                    e.preventDefault();
                    this.executeCommand('underline');
                    break;
            }
        }
    }
    
    /**
     * Guarda la página actual
     */
    async saveCurrentPage() {
        const currentPage = this.pages[this.currentPageIndex];
        if (!currentPage) return;
        
        this.updateSaveStatus('saving');
        
        try {
            // Obtener contenido según el tipo
            let content = currentPage.content;
            
            if (currentPage.type === 'text' && this.textEditor) {
                content = this.textEditor.innerHTML;
            } else if (currentPage.type === 'excalidraw' && this.diagramManager) {
                // Guardar diagrama Excalidraw
                content = await this.diagramManager.getDiagramJSON();
            }
            
            // Actualizar página
            this.dataManager.updatePage(this.currentTopic.id, currentPage.id, {
                content: content
            });
            
            this.updateSaveStatus('saved');
            
        } catch (error) {
            console.error('Error guardando página:', error);
            this.updateSaveStatus('error');
            this.notifications.error('Error al guardar la página');
        }
    }
    
    /**
     * Actualiza el estado de guardado
     */
    updateSaveStatus(status) {
        const saveStatus = document.getElementById('save-status');
        if (!saveStatus) return;
        
        switch (status) {
            case 'saving':
                saveStatus.textContent = 'Guardando...';
                saveStatus.className = 'text-sm text-yellow-500';
                break;
            case 'saved':
                saveStatus.textContent = 'Guardado';
                saveStatus.className = 'text-sm text-green-500';
                break;
            case 'unsaved':
                saveStatus.textContent = 'Sin guardar';
                saveStatus.className = 'text-sm text-gray-500';
                break;
            case 'error':
                saveStatus.textContent = 'Error';
                saveStatus.className = 'text-sm text-red-500';
                break;
        }
    }
    
    /**
     * Inserta un encabezado
     */
    insertHeading(level) {
        const tag = `h${level}`;
        this.executeCommand('formatBlock', tag);
        this.handleTextChange();
    }
    
    /**
     * Aplica tamaño de fuente
     */
    applyFontSize(size) {
        const selection = window.getSelection();
        
        if (!selection.toString()) {
            this.notifications.info('Selecciona texto para cambiar el tamaño');
            return;
        }
        
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = `${size}px`;
        
        try {
            range.surroundContents(span);
            this.handleTextChange();
        } catch (e) {
            // Si falla, usar innerHTML
            const selectedText = range.toString();
            const newSpan = `<span style="font-size: ${size}px">${selectedText}</span>`;
            range.deleteContents();
            const div = document.createElement('div');
            div.innerHTML = newSpan;
            range.insertNode(div.firstChild);
            this.handleTextChange();
        }
    }
    
    /**
     * Muestra diálogo para insertar imagen
     */
    showImageDialog() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Insertar Imagen</h3>
                
                <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p class="text-sm text-blue-800 dark:text-blue-200">
                        <strong>📐 Dimensiones óptimas:</strong><br>
                        • Imágenes en editor: <strong>1200x800px</strong> (horizontal)
                    </p>
                </div>
                
                <!-- Tabs -->
                <div class="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button class="tab-btn active px-4 py-2 text-sm font-medium border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400" data-tab="url">
                        URL
                    </button>
                    <button class="tab-btn px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400" data-tab="upload">
                        Subir archivo
                    </button>
                </div>
                
                <!-- Tab URL -->
                <div id="tab-url" class="tab-content">
                    <div class="space-y-4">
                        <input 
                            type="url" 
                            id="image-url"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            placeholder="https://ejemplo.com/imagen.jpg"
                        >
                    </div>
                </div>
                
                <!-- Tab Upload -->
                <div id="tab-upload" class="tab-content hidden">
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors" id="drop-zone-image">
                        <i data-lucide="upload" class="w-12 h-12 mx-auto mb-2 text-gray-400"></i>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Arrastra una imagen aquí</p>
                        <p class="text-xs text-gray-500">o haz clic para seleccionar</p>
                        <input type="file" id="image-file" class="hidden" accept="image/*">
                    </div>
                    <div id="image-preview" class="mt-4 hidden">
                        <img id="preview-img" class="max-w-full h-auto rounded-lg">
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="cancel-image-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Cancelar
                    </button>
                    <button class="insert-image-btn px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Insertar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('.cancel-image-btn');
        const insertBtn = modal.querySelector('.insert-image-btn');
        const urlInput = document.getElementById('image-url');
        const fileInput = document.getElementById('image-file');
        const dropZone = document.getElementById('drop-zone-image');
        const imagePreview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');
        
        let selectedFile = null;
        
        // Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update active tab
                tabBtns.forEach(b => {
                    b.classList.remove('active', 'border-indigo-500', 'text-indigo-600', 'dark:text-indigo-400');
                    b.classList.add('border-transparent', 'text-gray-500');
                });
                btn.classList.add('active', 'border-indigo-500', 'text-indigo-600', 'dark:text-indigo-400');
                btn.classList.remove('border-transparent', 'text-gray-500');
                
                // Show/hide content
                tabContents.forEach(content => {
                    if (content.id === `tab-${tabName}`) {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                });
            });
        });
        
        // File upload
        dropZone.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                selectedFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-indigo-500');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-indigo-500');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-500');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                selectedFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
        
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        insertBtn.addEventListener('click', () => {
            const activeTab = modal.querySelector('.tab-btn.active').dataset.tab;
            
            if (activeTab === 'url') {
                const url = urlInput.value.trim();
                if (!url) {
                    this.notifications.error('Ingresa una URL válida');
                    return;
                }
                
                if (this.textEditor) {
                    this.textEditor.focus();
                }
                
                setTimeout(() => {
                    this.insertImage(url, 400);
                    closeModal();
                }, 50);
            } else {
                if (!selectedFile) {
                    this.notifications.error('Selecciona una imagen');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (this.textEditor) {
                        this.textEditor.focus();
                    }
                    
                    setTimeout(() => {
                        this.insertImage(e.target.result, 400);
                        closeModal();
                    }, 50);
                };
                reader.readAsDataURL(selectedFile);
            }
        });
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        urlInput.focus();
    }
    
    /**
     * Obtiene un range válido para insertar elementos
     * Valida que no esté en lugares prohibidos como títulos de cajas desplegables
     */
    getValidInsertionRange() {
        const selection = window.getSelection();
        
        // Verificar si hay selección
        if (!selection.rangeCount) {
            // Insertar al final del editor
            const range = document.createRange();
            range.selectNodeContents(this.textEditor);
            range.collapse(false);
            return range;
        }
        
        let node = selection.anchorNode;
        
        // Verificar que el nodo esté dentro del editor
        if (!this.textEditor.contains(node)) {
            // Insertar al final del editor
            const range = document.createRange();
            range.selectNodeContents(this.textEditor);
            range.collapse(false);
            return range;
        }
        
        // Verificar si está en el título de una caja desplegable
        let current = node;
        while (current && current !== this.textEditor) {
            // Si está en el header de la caja desplegable
            if (current.classList && current.classList.contains('collapsible-header')) {
                // Buscar el contenido de la caja
                const box = current.closest('.collapsible-box');
                if (box) {
                    const content = box.querySelector('.collapsible-content');
                    if (content) {
                        // Mover cursor al contenido de la caja
                        const range = document.createRange();
                        range.selectNodeContents(content);
                        range.collapse(false);
                        return range;
                    }
                }
                return null;
            }
            
            // Si es el span editable del header
            if (current.parentElement && 
                current.parentElement.classList && 
                current.parentElement.classList.contains('collapsible-header')) {
                // Buscar el contenido de la caja
                const box = current.closest('.collapsible-box');
                if (box) {
                    const content = box.querySelector('.collapsible-content');
                    if (content) {
                        // Mover cursor al contenido de la caja
                        const range = document.createRange();
                        range.selectNodeContents(content);
                        range.collapse(false);
                        return range;
                    }
                }
                return null;
            }
            
            current = current.parentElement;
        }
        
        // Posición válida
        return selection.getRangeAt(0);
    }
    
    /**
     * Inserta una imagen redimensionable
     */
    insertImage(url, width = 400) {
        const html = `
            <div class="image-wrapper group relative" contenteditable="false" style="display: block; max-width: 100%; margin: 1rem auto;">
                <div class="image-controls opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 left-2 flex flex-col gap-2 z-20">
                    <button class="align-left-btn p-2 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-indigo-500 hover:text-white" title="Alinear izquierda">
                        <i data-lucide="align-left" class="w-4 h-4"></i>
                    </button>
                    <button class="align-center-btn p-2 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-indigo-500 hover:text-white" title="Centrar">
                        <i data-lucide="align-center" class="w-4 h-4"></i>
                    </button>
                    <button class="align-right-btn p-2 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-indigo-500 hover:text-white" title="Alinear derecha">
                        <i data-lucide="align-right" class="w-4 h-4"></i>
                    </button>
                    <div class="h-px w-6 bg-gray-300 self-center"></div>
                    <button class="text-wrap-btn p-2 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-indigo-500 hover:text-white" title="Texto alrededor">
                        <i data-lucide="wrap-text" class="w-4 h-4"></i>
                    </button>
                    <button class="crop-image-btn p-2 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-indigo-500 hover:text-white" title="Recortar imagen">
                        <i data-lucide="crop" class="w-4 h-4"></i>
                    </button>
                </div>
                <button class="delete-image-btn opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg z-10" title="Eliminar imagen">
                    <i data-lucide="x" class="w-4 h-4 text-white"></i>
                </button>
                <img src="${url}" class="resizable-image" style="width: ${width}px; max-width: 100%; height: auto; display: block;" draggable="false">
                <div class="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <p contenteditable="true"><br></p>
        `;
        
        // Validar y obtener posición de inserción
        const range = this.getValidInsertionRange();
        if (!range) {
            this.notifications.warning('Coloca el cursor en una posición válida');
            return;
        }
        
        // NO borrar contenido existente
        // range.deleteContents(); <- REMOVIDO
        
        const div = document.createElement('div');
        div.innerHTML = html;
        const imageWrapper = div.firstElementChild;
        const editableParagraph = div.querySelector('p[contenteditable="true"]');
        
        // Insertar imagen SIN borrar contenido
        range.insertNode(imageWrapper);
        
        // Insertar párrafo después de la imagen
        if (editableParagraph && imageWrapper.parentNode) {
            if (imageWrapper.nextSibling) {
                imageWrapper.parentNode.insertBefore(editableParagraph, imageWrapper.nextSibling);
            } else {
                imageWrapper.parentNode.appendChild(editableParagraph);
            }
            
            // Colocar cursor en el párrafo editable después de la imagen
            setTimeout(() => {
                const newRange = document.createRange();
                newRange.setStart(editableParagraph, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
                editableParagraph.focus();
            }, 100);
        }
        
        const img = imageWrapper.querySelector('.resizable-image');
        const resizeHandle = imageWrapper.querySelector('.resize-handle');
        const deleteBtn = imageWrapper.querySelector('.delete-image-btn');
        const alignLeftBtn = imageWrapper.querySelector('.align-left-btn');
        const alignCenterBtn = imageWrapper.querySelector('.align-center-btn');
        const alignRightBtn = imageWrapper.querySelector('.align-right-btn');
        const textWrapBtn = imageWrapper.querySelector('.text-wrap-btn');
        const cropBtn = imageWrapper.querySelector('.crop-image-btn');
        
        // Eliminar
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (imageWrapper.parentNode) {
                    imageWrapper.parentNode.removeChild(imageWrapper);
                    this.handleTextChange();
                }
            });
        }
        
        // Alinear izquierda
        if (alignLeftBtn) {
            alignLeftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageWrapper.style.display = 'block';
                imageWrapper.style.marginLeft = '0';
                imageWrapper.style.marginRight = 'auto';
                imageWrapper.style.float = 'none';
                imageWrapper.style.width = 'fit-content';
                this.handleTextChange();
            });
        }
        
        // Centrar
        if (alignCenterBtn) {
            alignCenterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageWrapper.style.display = 'block';
                imageWrapper.style.marginLeft = 'auto';
                imageWrapper.style.marginRight = 'auto';
                imageWrapper.style.float = 'none';
                imageWrapper.style.width = 'fit-content';
                this.handleTextChange();
            });
        }
        
        // Alinear derecha
        if (alignRightBtn) {
            alignRightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageWrapper.style.display = 'block';
                imageWrapper.style.marginLeft = 'auto';
                imageWrapper.style.marginRight = '0';
                imageWrapper.style.float = 'none';
                imageWrapper.style.width = 'fit-content';
                this.handleTextChange();
            });
        }
        
        // Text wrapping - Permite escribir al lado de la imagen
        if (textWrapBtn) {
            textWrapBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const currentFloat = imageWrapper.style.float;
                console.log('Text wrap clicked. Current float:', currentFloat);
                
                if (currentFloat === 'left') {
                    // Cambiar a derecha: texto a la IZQUIERDA de la imagen
                    imageWrapper.style.float = 'right';
                    imageWrapper.style.marginLeft = '1rem';
                    imageWrapper.style.marginRight = '0';
                    imageWrapper.style.marginBottom = '1rem';
                    imageWrapper.style.display = 'block';
                    imageWrapper.style.width = 'fit-content';
                    console.log('Float right activado');
                } else if (currentFloat === 'right') {
                    // Quitar float: imagen centrada
                    imageWrapper.style.float = 'none';
                    imageWrapper.style.marginLeft = 'auto';
                    imageWrapper.style.marginRight = 'auto';
                    imageWrapper.style.marginBottom = '1rem';
                    imageWrapper.style.display = 'block';
                    imageWrapper.style.width = 'fit-content';
                    console.log('Float none (centrado)');
                } else {
                    // Activar float izquierda: texto a la DERECHA de la imagen
                    imageWrapper.style.float = 'left';
                    imageWrapper.style.marginRight = '1rem';
                    imageWrapper.style.marginLeft = '0';
                    imageWrapper.style.marginBottom = '1rem';
                    imageWrapper.style.display = 'block';
                    imageWrapper.style.width = 'fit-content';
                    console.log('Float left activado');
                }
                
                this.handleTextChange();
            });
        }
        
        // Recortar imagen
        if (cropBtn) {
            cropBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showSimpleCropDialog(img, imageWrapper);
            });
        }
        
        // Redimensionamiento
        let isResizing = false;
        let startX, startWidth;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startWidth = img.offsetWidth;
            
            const resize = (e) => {
                if (!isResizing) return;
                const width = startWidth + (e.clientX - startX);
                if (width > 50 && width < this.textEditor.offsetWidth) {
                    img.style.width = width + 'px';
                }
            };
            
            const stopResize = () => {
                isResizing = false;
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
                this.handleTextChange();
            };
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
        
        // Habilitar drag & drop para la imagen
        this.makeDraggable(imageWrapper);
        
        // CRÍTICO: Actualizar iconos con timeout para asegurar renderizado
        setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 50);
        
        this.handleTextChange();
    }
    
    /**
     * Muestra editor visual para recortar imagen con selección de área
     */
    showSimpleCropDialog(img, imageWrapper) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recortar Imagen</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Arrastra y redimensiona el área de selección para recortar</p>
                
                <div style="position: relative; display: inline-block; max-width: 100%; overflow: auto;">
                    <canvas id="crop-canvas" style="max-width: 100%; height: auto; border: 1px solid #ccc;"></canvas>
                    <div id="crop-selector" style="
                        position: absolute;
                        border: 3px solid #6366f1;
                        background: rgba(99, 102, 241, 0.1);
                        cursor: move;
                        display: none;
                    ">
                        <div class="resize-handle-tl" style="position: absolute; top: -5px; left: -5px; width: 10px; height: 10px; background: #6366f1; cursor: nwse-resize;"></div>
                        <div class="resize-handle-tr" style="position: absolute; top: -5px; right: -5px; width: 10px; height: 10px; background: #6366f1; cursor: nesw-resize;"></div>
                        <div class="resize-handle-bl" style="position: absolute; bottom: -5px; left: -5px; width: 10px; height: 10px; background: #6366f1; cursor: nesw-resize;"></div>
                        <div class="resize-handle-br" style="position: absolute; bottom: -5px; right: -5px; width: 10px; height: 10px; background: #6366f1; cursor: nwse-resize;"></div>
                    </div>
                </div>
                
                <div class="flex justify-between mt-6">
                    <button class="cancel-crop-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Cancelar
                    </button>
                    <button class="apply-crop-btn px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">
                        Aplicar Recorte
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const canvas = modal.querySelector('#crop-canvas');
        const ctx = canvas.getContext('2d');
        const selector = modal.querySelector('#crop-selector');
        const cancelBtn = modal.querySelector('.cancel-crop-btn');
        const applyBtn = modal.querySelector('.apply-crop-btn');
        
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        
        // Usar directamente el elemento img del DOM (evita problemas de CORS)
        // La imagen ya está cargada en el navegador
        console.log('Usando imagen del DOM:', img.naturalWidth, 'x', img.naturalHeight);
        
        // Ajustar tamaño del canvas (máximo 700px de ancho)
        const maxWidth = 700;
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;
        const scale = imgWidth > maxWidth ? maxWidth / imgWidth : 1;
        canvas.width = imgWidth * scale;
        canvas.height = imgHeight * scale;
        
        console.log('Canvas ajustado a:', canvas.width, 'x', canvas.height);
        
        // Dibujar imagen en canvas directamente desde el elemento DOM
        try {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log('Imagen dibujada en canvas exitosamente');
        } catch (e) {
            console.error('Error dibujando imagen (posible CORS):', e);
            
            // Mostrar mensaje más informativo
            const isExternalImage = !img.src.startsWith('data:') && 
                                   !img.src.startsWith(window.location.origin);
            
            if (isExternalImage) {
                alert('⚠️ No se puede recortar esta imagen debido a restricciones de seguridad del navegador (CORS).\n\n💡 Solución: Sube la imagen desde tu computadora en lugar de usar una URL externa.');
            } else {
                alert('No se pudo cargar la imagen para recortar.');
            }
            
            closeModal();
            return;
        }
        
        // Inicializar selector (60% del tamaño en el centro)
        const selectorWidth = Math.floor(canvas.width * 0.6);
        const selectorHeight = Math.floor(canvas.height * 0.6);
        const selectorLeft = Math.floor((canvas.width - selectorWidth) / 2);
        const selectorTop = Math.floor((canvas.height - selectorHeight) / 2);
        
        selector.style.width = selectorWidth + 'px';
        selector.style.height = selectorHeight + 'px';
        selector.style.left = selectorLeft + 'px';
        selector.style.top = selectorTop + 'px';
        selector.style.display = 'block';
        
        console.log('Selector inicializado en:', selectorLeft, selectorTop, selectorWidth, selectorHeight);
        
        // Hacer selector movible y redimensionable
        makeDraggable(selector, canvas);
        makeResizable(selector, canvas);
        
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        applyBtn.addEventListener('click', () => {
            // Obtener coordenadas del selector
            const cropX = parseInt(selector.style.left);
            const cropY = parseInt(selector.style.top);
            const cropWidth = selector.offsetWidth;
            const cropHeight = selector.offsetHeight;
            
            // Crear canvas temporal para recorte
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = cropWidth;
            tempCanvas.height = cropHeight;
            
            // Recortar imagen
            tempCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            // Convertir a data URL y actualizar imagen original
            const croppedDataUrl = tempCanvas.toDataURL('image/png');
            img.src = croppedDataUrl;
            img.style.width = cropWidth + 'px';
            img.style.height = 'auto';
            
            this.handleTextChange();
            closeModal();
        });
        
        // Función para hacer el selector arrastrable
        function makeDraggable(element, container) {
            let offsetX, offsetY;
            let isDragging = false;
            
            element.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('resize-handle-tl') || 
                    e.target.classList.contains('resize-handle-tr') ||
                    e.target.classList.contains('resize-handle-bl') ||
                    e.target.classList.contains('resize-handle-br')) {
                    return; // No arrastrar si se está redimensionando
                }
                isDragging = true;
                offsetX = e.offsetX;
                offsetY = e.offsetY;
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const rect = container.getBoundingClientRect();
                let x = e.clientX - rect.left - offsetX;
                let y = e.clientY - rect.top - offsetY;
                
                // Limitar dentro del canvas
                x = Math.max(0, Math.min(x, container.width - element.offsetWidth));
                y = Math.max(0, Math.min(y, container.height - element.offsetHeight));
                
                element.style.left = x + 'px';
                element.style.top = y + 'px';
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }
        
        // Función para redimensionar el selector
        function makeResizable(element, container) {
            const handles = element.querySelectorAll('[class^="resize-handle"]');
            
            handles.forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = element.offsetWidth;
                    const startHeight = element.offsetHeight;
                    const startLeft = parseInt(element.style.left);
                    const startTop = parseInt(element.style.top);
                    const handleClass = handle.className;
                    
                    const resize = (e) => {
                        const dx = e.clientX - startX;
                        const dy = e.clientY - startY;
                        
                        if (handleClass.includes('br')) {
                            // Bottom-right
                            const newWidth = Math.max(50, Math.min(startWidth + dx, container.width - startLeft));
                            const newHeight = Math.max(50, Math.min(startHeight + dy, container.height - startTop));
                            element.style.width = newWidth + 'px';
                            element.style.height = newHeight + 'px';
                        } else if (handleClass.includes('bl')) {
                            // Bottom-left
                            const newWidth = Math.max(50, startWidth - dx);
                            const newHeight = Math.max(50, Math.min(startHeight + dy, container.height - startTop));
                            const newLeft = Math.max(0, startLeft + dx);
                            element.style.width = newWidth + 'px';
                            element.style.height = newHeight + 'px';
                            element.style.left = newLeft + 'px';
                        } else if (handleClass.includes('tr')) {
                            // Top-right
                            const newWidth = Math.max(50, Math.min(startWidth + dx, container.width - startLeft));
                            const newHeight = Math.max(50, startHeight - dy);
                            const newTop = Math.max(0, startTop + dy);
                            element.style.width = newWidth + 'px';
                            element.style.height = newHeight + 'px';
                            element.style.top = newTop + 'px';
                        } else if (handleClass.includes('tl')) {
                            // Top-left
                            const newWidth = Math.max(50, startWidth - dx);
                            const newHeight = Math.max(50, startHeight - dy);
                            const newLeft = Math.max(0, startLeft + dx);
                            const newTop = Math.max(0, startTop + dy);
                            element.style.width = newWidth + 'px';
                            element.style.height = newHeight + 'px';
                            element.style.left = newLeft + 'px';
                            element.style.top = newTop + 'px';
                        }
                    };
                    
                    const stopResize = () => {
                        document.removeEventListener('mousemove', resize);
                        document.removeEventListener('mouseup', stopResize);
                    };
                    
                    document.addEventListener('mousemove', resize);
                    document.addEventListener('mouseup', stopResize);
                });
            });
        }
    }
    
    /**
     * Muestra diálogo para insertar video de YouTube
     */
    showVideoDialog() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Insertar Video de YouTube</h3>
                <input 
                    type="text" 
                    id="video-url"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Pega aquí tu enlace de YouTube"
                >
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="cancel-video-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Cancelar
                    </button>
                    <button class="insert-video-btn px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Insertar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('.cancel-video-btn');
        const insertBtn = modal.querySelector('.insert-video-btn');
        const urlInput = document.getElementById('video-url');
        
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        insertBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            
            if (!url) {
                this.notifications.error('Ingresa un enlace de YouTube');
                return;
            }
            
            if (this.textEditor) {
                this.textEditor.focus();
            }
            
            setTimeout(() => {
                this.insertVideo(url);
                closeModal();
            }, 50);
        });
        
        urlInput.focus();
    }
    
    /**
     * Inserta un video de YouTube
     */
    insertVideo(embedCode) {
        // Extraer URL si es un código embed completo
        let videoUrl = embedCode;
        
        if (embedCode.includes('iframe')) {
            const srcMatch = embedCode.match(/src="([^"]+)"/);
            if (srcMatch) {
                videoUrl = srcMatch[1];
            }
        } else if (embedCode.includes('youtube.com/watch')) {
            // Convertir URL normal a embed
            const videoId = embedCode.match(/v=([^&]+)/);
            if (videoId) {
                videoUrl = `https://www.youtube.com/embed/${videoId[1]}`;
            }
        } else if (embedCode.includes('youtu.be/')) {
            // Convertir URL corta a embed
            const videoId = embedCode.split('youtu.be/')[1].split('?')[0];
            videoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        
        const html = `
            <div class="video-wrapper group relative" contenteditable="false" style="max-width: 640px; margin: 1rem auto;">
                <button class="delete-video-btn opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg z-10" title="Eliminar video">
                    <i data-lucide="x" class="w-4 h-4 text-white"></i>
                </button>
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; background: #000;">
                    <iframe 
                        src="${videoUrl}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    ></iframe>
                </div>
            </div>
            <p><br></p>
        `;
        
        // Validar y obtener posición de inserción
        const range = this.getValidInsertionRange();
        if (!range) {
            this.notifications.warning('Coloca el cursor en una posición válida');
            return;
        }
        
        if (range) {
            range.deleteContents();
            
            const div = document.createElement('div');
            div.innerHTML = html;
            const videoWrapper = div.firstElementChild;
            range.insertNode(videoWrapper);
            
            // Agregar botón eliminar
            const deleteBtn = videoWrapper.querySelector('.delete-video-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (videoWrapper.parentNode) {
                        videoWrapper.parentNode.removeChild(videoWrapper);
                        this.handleTextChange();
                    }
                });
            }
            
            // Actualizar iconos
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            this.handleTextChange();
        }
    }
    
    /**
     * Inserta un recuadro de texto independiente
     */
    insertTextBox() {
        const html = `
            <div class="textbox-wrapper group relative" contenteditable="false" style="display: block; width: 300px; min-height: 100px; background: #334155; border-radius: 0.5rem; padding: 1rem; margin: 1rem auto;">
                <div class="textbox-controls opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-0 right-0 flex justify-center gap-2 z-20">
                    <button class="textbox-align-left-btn p-1.5 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-gray-100" title="Alinear izquierda">
                        <i data-lucide="align-left" class="w-4 h-4"></i>
                    </button>
                    <button class="textbox-align-center-btn p-1.5 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-gray-100" title="Centrar">
                        <i data-lucide="align-center" class="w-4 h-4"></i>
                    </button>
                    <button class="textbox-align-right-btn p-1.5 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-gray-100" title="Alinear derecha">
                        <i data-lucide="align-right" class="w-4 h-4"></i>
                    </button>
                    <div class="w-px h-6 bg-gray-300 self-center"></div>
                    <button class="textbox-wrap-btn p-1.5 bg-white dark:bg-gray-700 rounded shadow-lg hover:bg-gray-100" title="Texto alrededor">
                        <i data-lucide="wrap-text" class="w-4 h-4"></i>
                    </button>
                </div>
                <button class="delete-textbox-btn opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg z-10" title="Eliminar recuadro">
                    <i data-lucide="x" class="w-4 h-4 text-white"></i>
                </button>
                <div class="textbox-content" contenteditable="true" style="min-height: 60px; outline: none; color: #f1f5f9;">
                    Escribe aquí...
                </div>
                <div class="resize-handle-textbox absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <p><br></p>
        `;
        
        // Validar y obtener posición de inserción
        const range = this.getValidInsertionRange();
        if (!range) {
            this.notifications.warning('Coloca el cursor en una posición válida');
            return;
        }
        
        range.deleteContents();
        
        const div = document.createElement('div');
        div.innerHTML = html;
        const textboxWrapper = div.firstElementChild;
        range.insertNode(textboxWrapper);
        
        const deleteBtn = textboxWrapper.querySelector('.delete-textbox-btn');
        const resizeHandle = textboxWrapper.querySelector('.resize-handle-textbox');
        const alignLeftBtn = textboxWrapper.querySelector('.textbox-align-left-btn');
        const alignCenterBtn = textboxWrapper.querySelector('.textbox-align-center-btn');
        const alignRightBtn = textboxWrapper.querySelector('.textbox-align-right-btn');
        const wrapBtn = textboxWrapper.querySelector('.textbox-wrap-btn');
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (textboxWrapper.parentNode) {
                    textboxWrapper.parentNode.removeChild(textboxWrapper);
                    this.handleTextChange();
                }
            });
        }
        
        // Alinear izquierda
        if (alignLeftBtn) {
            alignLeftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                textboxWrapper.style.marginLeft = '0';
                textboxWrapper.style.marginRight = 'auto';
                textboxWrapper.style.float = 'none';
                this.handleTextChange();
            });
        }
        
        // Centrar
        if (alignCenterBtn) {
            alignCenterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                textboxWrapper.style.marginLeft = 'auto';
                textboxWrapper.style.marginRight = 'auto';
                textboxWrapper.style.float = 'none';
                this.handleTextChange();
            });
        }
        
        // Alinear derecha
        if (alignRightBtn) {
            alignRightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                textboxWrapper.style.marginLeft = 'auto';
                textboxWrapper.style.marginRight = '0';
                textboxWrapper.style.float = 'none';
                this.handleTextChange();
            });
        }
        
        // Text wrapping
        if (wrapBtn) {
            wrapBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const currentFloat = textboxWrapper.style.float;
                
                if (currentFloat === 'left') {
                    textboxWrapper.style.float = 'right';
                    textboxWrapper.style.marginLeft = '1rem';
                    textboxWrapper.style.marginRight = '0';
                    textboxWrapper.style.marginBottom = '1rem';
                } else if (currentFloat === 'right') {
                    textboxWrapper.style.float = 'none';
                    textboxWrapper.style.marginLeft = 'auto';
                    textboxWrapper.style.marginRight = 'auto';
                    textboxWrapper.style.marginBottom = '1rem';
                    textboxWrapper.style.clear = 'both';
                } else {
                    textboxWrapper.style.float = 'left';
                    textboxWrapper.style.marginRight = '1rem';
                    textboxWrapper.style.marginLeft = '0';
                    textboxWrapper.style.marginBottom = '1rem';
                }
                
                // Agregar un div clear después del textbox si tiene float
                let clearDiv = textboxWrapper.nextElementSibling;
                if (textboxWrapper.style.float !== 'none' && textboxWrapper.style.float !== '') {
                    // Si no existe un clear div, crearlo
                    if (!clearDiv || !clearDiv.classList.contains('clear-float')) {
                        clearDiv = document.createElement('div');
                        clearDiv.className = 'clear-float';
                        clearDiv.style.clear = 'both';
                        clearDiv.style.height = '0';
                        clearDiv.contentEditable = 'false';
                        textboxWrapper.parentNode.insertBefore(clearDiv, textboxWrapper.nextSibling);
                    }
                } else {
                    // Remover clear div si existe
                    if (clearDiv && clearDiv.classList.contains('clear-float')) {
                        clearDiv.remove();
                    }
                }
                
                this.handleTextChange();
            });
        }
        
        // Redimensionamiento
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = textboxWrapper.offsetWidth;
            startHeight = textboxWrapper.offsetHeight;
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
        
        const resize = (e) => {
            if (!isResizing) return;
            const width = startWidth + (e.clientX - startX);
            const height = startHeight + (e.clientY - startY);
            if (width > 100) {
                textboxWrapper.style.width = width + 'px';
            }
            if (height > 60) {
                textboxWrapper.style.height = height + 'px';
            }
        };
        
        const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            this.handleTextChange();
        };
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        this.handleTextChange();
    }
    
    /**
     * Cambia el tamaño de fuente (obsoleto - ahora usa selector)
     */
    changeFontSize(action) {
        const selection = window.getSelection();
        
        if (!selection.toString()) {
            this.notifications.info('Selecciona texto para cambiar el tamaño');
            return;
        }
        
        // Obtener el elemento seleccionado
        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer.parentElement;
        
        // Obtener tamaño actual
        const currentSize = window.getComputedStyle(parentElement).fontSize;
        const currentSizePx = parseFloat(currentSize);
        
        // Calcular nuevo tamaño
        let newSize;
        if (action === 'increase') {
            newSize = currentSizePx + 2;
        } else {
            newSize = Math.max(currentSizePx - 2, 8); // Mínimo 8px
        }
        
        // Aplicar nuevo tamaño
        const span = document.createElement('span');
        span.style.fontSize = `${newSize}px`;
        
        try {
            range.surroundContents(span);
            this.handleTextChange();
        } catch (e) {
            // Si falla surroundContents, usar execCommand
            this.executeCommand('fontSize', '7'); // Tamaño temporal
            
            // Luego ajustar con el tamaño real
            const fontElements = this.textEditor.querySelectorAll('font[size="7"]');
            fontElements.forEach(el => {
                const span = document.createElement('span');
                span.style.fontSize = `${newSize}px`;
                span.innerHTML = el.innerHTML;
                el.parentNode.replaceChild(span, el);
            });
            
            this.handleTextChange();
        }
    }
    
    /**
     * Inserta una lista de tareas
     */
    insertChecklist() {
        const html = `
            <ul class="checklist">
                <li><input type="checkbox" contenteditable="false"> <span contenteditable="true">Tarea 1</span></li>
                <li><input type="checkbox" contenteditable="false"> <span contenteditable="true">Tarea 2</span></li>
                <li><input type="checkbox" contenteditable="false"> <span contenteditable="true">Tarea 3</span></li>
            </ul>
        `;
        this.insertHTML(html);
    }
    
    /**
     * Aplica resaltado con color específico
     */
    applyHighlight(color) {
        const selection = window.getSelection();
        
        if (selection.toString()) {
            this.executeCommand('hiliteColor', color);
            this.handleTextChange();
        } else {
            this.notifications.info('Selecciona texto para resaltar');
        }
    }
    
    /**
     * Inserta resaltado de texto (obsoleto - ahora usa menú)
     */
    insertHighlight() {
        const colors = ['#fef08a', '#bbf7d0', '#fecaca', '#bfdbfe', '#e9d5ff'];
        const selection = window.getSelection();
        
        if (selection.toString()) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.executeCommand('hiliteColor', randomColor);
            this.handleTextChange();
        } else {
            this.notifications.info('Selecciona texto para resaltar');
        }
    }
    
    /**
     * Inserta color de texto
     */
    insertTextColor() {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        const selection = window.getSelection();
        
        if (selection.toString()) {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.executeCommand('foreColor', randomColor);
            this.handleTextChange();
        } else {
            this.notifications.info('Selecciona texto para colorear');
        }
    }
    
    /**
     * Muestra diálogo para seleccionar tamaño de tabla
     */
    showTableDialog() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Insertar Tabla</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número de columnas
                        </label>
                        <input 
                            type="number" 
                            id="table-cols"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            value="3"
                            min="1"
                            max="10"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número de filas
                        </label>
                        <input 
                            type="number" 
                            id="table-rows"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            value="3"
                            min="1"
                            max="20"
                        >
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="cancel-table-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Cancelar
                    </button>
                    <button class="insert-table-btn px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        Insertar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('.cancel-table-btn');
        const insertBtn = modal.querySelector('.insert-table-btn');
        const colsInput = document.getElementById('table-cols');
        const rowsInput = document.getElementById('table-rows');
        
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        insertBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const cols = parseInt(colsInput.value) || 3;
            const rows = parseInt(rowsInput.value) || 3;
            
            // Enfocar el editor antes de insertar
            if (this.textEditor) {
                this.textEditor.focus();
            }
            
            // Pequeño delay para asegurar que el editor esté enfocado
            setTimeout(() => {
                this.insertTable(cols, rows);
                closeModal();
            }, 50);
        });
        
        colsInput.focus();
    }
    
    /**
     * Inserta una tabla
     */
    insertTable(cols = 3, rows = 3) {
        // Generar encabezados - COMPACTO
        let headerCells = '';
        for (let i = 1; i <= cols; i++) {
            headerCells += `
                <th contenteditable="true" style="position: relative; width: 100px;">
                    Columna ${i}
                    <div class="column-resizer" style="position: absolute; top: 0; right: 0; width: 5px; height: 100%; cursor: col-resize; background: transparent; z-index: 10;"></div>
                </th>`;
        }
        
        // Generar filas
        let bodyRows = '';
        for (let i = 1; i <= rows; i++) {
            let cells = '';
            for (let j = 1; j <= cols; j++) {
                cells += `<td contenteditable="true">Celda ${i},${j}</td>`;
            }
            bodyRows += `<tr>${cells}</tr>`;
        }
        
        // Calcular ancho fijo de la tabla
        const tableWidth = cols * 100; // 100px por columna
        
        const html = `
            <div class="table-wrapper group relative" contenteditable="false">
                <button class="delete-table-btn opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg z-10" title="Eliminar tabla">
                    <i data-lucide="x" class="w-4 h-4 text-white"></i>
                </button>
                <table class="study-table" contenteditable="false" style="table-layout: fixed; width: ${tableWidth}px;">
                    <thead>
                        <tr>${headerCells}</tr>
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                </table>
            </div>
            <p><br></p>
        `;
        
        // Validar y obtener posición de inserción
        const range = this.getValidInsertionRange();
        if (!range) {
            this.notifications.warning('Coloca el cursor en una posición válida');
            return;
        }
        
        if (range) {
            range.deleteContents();
            
            const div = document.createElement('div');
            div.innerHTML = html;
            const tableWrapper = div.firstElementChild;
            range.insertNode(tableWrapper);
            
            const table = tableWrapper.querySelector('.study-table');
            const deleteBtn = tableWrapper.querySelector('.delete-table-btn');
            
            // Botón eliminar
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (tableWrapper.parentNode) {
                        tableWrapper.parentNode.removeChild(tableWrapper);
                        this.handleTextChange();
                    }
                });
            }
            
            // Redimensionamiento de columnas - BIDIRECCIONAL CON LÍMITES
            const resizers = tableWrapper.querySelectorAll('.column-resizer');
            resizers.forEach((resizer, index) => {
                let isResizing = false;
                let startX, startWidth;
                let th = resizer.parentElement;
                let colIndex = index;
                
                resizer.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isResizing = true;
                    startX = e.clientX;
                    startWidth = th.offsetWidth;
                    
                    // Cambiar cursor del documento
                    document.body.style.cursor = 'col-resize';
                    
                    const resize = (e) => {
                        if (!isResizing) return;
                        
                        const deltaX = e.clientX - startX;
                        let newWidth = startWidth + deltaX;
                        
                        // Calcular ancho disponible considerando SIDEBARS
                        const leftSidebar = document.getElementById('left-sidebar');
                        const rightSidebar = document.getElementById('right-sidebar');
                        
                        let availableWidth = window.innerWidth;
                        
                        // Restar sidebars visibles
                        if (leftSidebar && !leftSidebar.classList.contains('hidden')) {
                            availableWidth -= leftSidebar.offsetWidth;
                        }
                        if (rightSidebar && !rightSidebar.classList.contains('hidden')) {
                            availableWidth -= rightSidebar.offsetWidth;
                        }
                        
                        // Máximo: 80% del espacio disponible para una columna
                        const maxColumnWidth = Math.floor(availableWidth * 0.8);
                        
                        // Límites: mínimo 50px, máximo respetando sidebars
                        newWidth = Math.max(50, Math.min(newWidth, maxColumnWidth));
                        
                        // Aplicar el nuevo ancho (tanto agrandar como reducir)
                        th.style.width = newWidth + 'px';
                        th.style.minWidth = newWidth + 'px';
                        th.style.maxWidth = newWidth + 'px';
                        
                        // Aplicar a todas las celdas de la columna
                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const cell = row.cells[colIndex];
                            if (cell) {
                                cell.style.width = newWidth + 'px';
                                cell.style.minWidth = newWidth + 'px';
                                cell.style.maxWidth = newWidth + 'px';
                            }
                        });
                    };
                    
                    const stopResize = () => {
                        if (isResizing) {
                            isResizing = false;
                            document.body.style.cursor = '';
                            document.removeEventListener('mousemove', resize);
                            document.removeEventListener('mouseup', stopResize);
                            resizer.style.background = 'transparent';
                            this.handleTextChange();
                        }
                    };
                    
                    document.addEventListener('mousemove', resize);
                    document.addEventListener('mouseup', stopResize);
                });
                
                // Hover effect
                resizer.addEventListener('mouseenter', () => {
                    if (!isResizing) {
                        resizer.style.background = 'rgba(99, 102, 241, 0.5)';
                    }
                });
                
                resizer.addEventListener('mouseleave', () => {
                    if (!isResizing) {
                        resizer.style.background = 'transparent';
                    }
                });
            });
            
            // Prevenir eliminación con backspace/delete
            tableWrapper.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    if (!e.target.matches('th, td')) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            });
            
            // Actualizar iconos
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            this.handleTextChange();
        }
    }
    
    /**
     * Inserta un bloque de código
     */
    insertCodeBlock() {
        const html = `
            <pre class="code-block" contenteditable="true"><code>// Escribe tu código aquí
function ejemplo() {
    return "Hola mundo";
}</code></pre>
            <p><br></p>
        `;
        this.insertHTML(html);
    }
    
    /**
     * Inserta una cita
     */
    insertQuote() {
        const html = `
            <blockquote class="quote-block" contenteditable="true">
                Escribe tu cita aquí...
            </blockquote>
            <p><br></p>
        `;
        this.insertHTML(html);
    }
    
    /**
     * Inserta HTML en la posición del cursor
     */
    insertHTML(html) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            const div = document.createElement('div');
            div.innerHTML = html;
            
            const frag = document.createDocumentFragment();
            let node, lastNode;
            while ((node = div.firstChild)) {
                lastNode = frag.appendChild(node);
            }
            
            range.insertNode(frag);
            
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            this.handleTextChange();
        }
    }
    
    /**
     * Entra en modo presentación
     */
    enterPresentationMode() {
        this.saveCurrentPage();
        this.router.navigateTo('presentation', {
            subject: this.currentSubject,
            topic: this.currentTopic,
            pages: this.pages
        });
    }
    
    /**
     * Exporta a PDF
     */
    exportToPDF() {
        this.notifications.info('Función de exportar PDF en desarrollo');
        // TODO: Implementar exportación a PDF
    }
    
    /**
     * Hace una imagen arrastrable dentro del editor
     */
    makeDraggable(imageWrapper) {
        let isDragging = false;
        let draggedElement = null;
        let dropIndicator = null;
        let startY = 0;
        let currentY = 0;
        let lastInsertPosition = null;
        
        // Crear indicador de drop (barra horizontal atractiva)
        const createDropIndicator = () => {
            if (!dropIndicator) {
                dropIndicator = document.createElement('div');
                dropIndicator.className = 'drop-indicator';
                dropIndicator.style.cssText = `
                    height: 4px;
                    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                    margin: 8px 0;
                    border-radius: 2px;
                    box-shadow: 0 0 12px rgba(16, 185, 129, 0.6), 0 2px 4px rgba(0,0,0,0.1);
                    pointer-events: none;
                    display: none;
                    position: relative;
                    animation: pulse 1.5s ease-in-out infinite;
                `;
                
                // Agregar puntos en los extremos
                const leftDot = document.createElement('div');
                leftDot.style.cssText = `
                    position: absolute;
                    left: -6px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 12px;
                    height: 12px;
                    background: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
                `;
                
                const rightDot = document.createElement('div');
                rightDot.style.cssText = `
                    position: absolute;
                    right: -6px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 12px;
                    height: 12px;
                    background: #10b981;
                    border-radius: 50%;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
                `;
                
                dropIndicator.appendChild(leftDot);
                dropIndicator.appendChild(rightDot);
                
                // Agregar animación CSS
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scaleY(1); }
                        50% { opacity: 0.8; transform: scaleY(1.2); }
                    }
                `;
                document.head.appendChild(style);
            }
            return dropIndicator;
        };
        
        // Evento mousedown en la imagen
        const img = imageWrapper.querySelector('.resizable-image');
        if (img) {
            img.addEventListener('mousedown', (e) => {
                // Solo arrastrar con botón izquierdo
                if (e.button !== 0) return;
                
                // No arrastrar si está sobre los controles
                if (e.target.closest('.image-controls') || 
                    e.target.closest('.delete-image-btn') ||
                    e.target.closest('.resize-handle')) {
                    return;
                }
                
                isDragging = true;
                draggedElement = imageWrapper;
                startY = e.clientY;
                
                // Agregar clase visual de arrastre
                imageWrapper.style.opacity = '0.4';
                imageWrapper.style.cursor = 'grabbing';
                imageWrapper.style.transform = 'scale(0.98)';
                imageWrapper.style.transition = 'all 0.15s';
                imageWrapper.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                
                // Crear indicador
                createDropIndicator();
                
                e.preventDefault();
                console.log('Iniciando arrastre de imagen');
            });
        }
        
        // Evento mousemove global
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !draggedElement) return;
            
            currentY = e.clientY;
            const editorRect = this.textEditor.getBoundingClientRect();
            
            // Encontrar el elemento más cercano donde insertar
            const insertInfo = this.getInsertPosition(this.textEditor, currentY, draggedElement);
            
            if (dropIndicator && insertInfo) {
                // Crear clave única para la posición
                const positionKey = insertInfo.element ? 
                    `${insertInfo.element.tagName}-${insertInfo.position}` : 
                    insertInfo.position;
                
                // Solo mover si la posición cambió
                if (lastInsertPosition !== positionKey) {
                    if (dropIndicator.parentNode) {
                        dropIndicator.parentNode.removeChild(dropIndicator);
                    }
                    
                    // Insertar indicador en nueva posición
                    if (insertInfo.position === 'start') {
                        // Al inicio del editor
                        if (this.textEditor.firstChild) {
                            this.textEditor.insertBefore(dropIndicator, this.textEditor.firstChild);
                        } else {
                            this.textEditor.appendChild(dropIndicator);
                        }
                    } else if (insertInfo.position === 'end') {
                        // Al final del editor
                        this.textEditor.appendChild(dropIndicator);
                    } else if (insertInfo.position === 'before' && insertInfo.element) {
                        insertInfo.element.parentNode.insertBefore(dropIndicator, insertInfo.element);
                    } else if (insertInfo.position === 'after' && insertInfo.element) {
                        if (insertInfo.element.nextSibling) {
                            insertInfo.element.parentNode.insertBefore(dropIndicator, insertInfo.element.nextSibling);
                        } else {
                            insertInfo.element.parentNode.appendChild(dropIndicator);
                        }
                    }
                    
                    dropIndicator.style.display = 'block';
                    lastInsertPosition = positionKey;
                }
            }
        });
        
        // Evento mouseup global
        document.addEventListener('mouseup', (e) => {
            if (!isDragging || !draggedElement) return;
            
            isDragging = false;
            
            // Restaurar estilo
            draggedElement.style.opacity = '1';
            draggedElement.style.cursor = 'move';
            draggedElement.style.transform = 'scale(1)';
            draggedElement.style.boxShadow = '';
            
            // Insertar imagen donde está el indicador
            if (dropIndicator && dropIndicator.parentNode) {
                const insertBeforeElement = dropIndicator.nextSibling;
                const parentNode = dropIndicator.parentNode;
                
                // Remover indicador
                parentNode.removeChild(dropIndicator);
                dropIndicator.style.display = 'none';
                
                // Insertar imagen EXACTAMENTE donde estaba el indicador
                if (insertBeforeElement) {
                    parentNode.insertBefore(draggedElement, insertBeforeElement);
                } else {
                    parentNode.appendChild(draggedElement);
                }
            }
            
            lastInsertPosition = null;
            draggedElement = null;
            this.handleTextChange();
        });
        
        // Cambiar cursor al hacer hover
        img.style.cursor = 'move';
    }
    
    /**
     * Encuentra la posición exacta donde insertar la imagen
     * Algoritmo robusto que funciona con cualquier distancia
     * Retorna: { element: elemento, position: 'start' | 'before' | 'after' | 'end' }
     */
    getInsertPosition(container, y, draggedElement) {
        const elements = [...container.children].filter(child => {
            return child !== draggedElement && 
                   !child.classList.contains('drop-indicator');
        });
        
        if (elements.length === 0) {
            return { element: null, position: 'end' };
        }
        
        const editorRect = container.getBoundingClientRect();
        const EDGE_THRESHOLD = 80; // Aumentado a 80px para mejor detección
        
        // Detectar si está cerca del borde superior del editor
        if (y < editorRect.top + EDGE_THRESHOLD) {
            return { element: elements[0], position: 'start' };
        }
        
        // Detectar si está cerca del borde inferior del editor
        if (y > editorRect.bottom - EDGE_THRESHOLD) {
            return { element: elements[elements.length - 1], position: 'end' };
        }
        
        // Buscar entre qué elementos está el cursor
        let insertBeforeElement = null;
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const box = element.getBoundingClientRect();
            
            // Si el cursor está ANTES de este elemento
            if (y < box.top) {
                insertBeforeElement = element;
                break;
            }
            
            // Si el cursor está DENTRO de este elemento
            if (y >= box.top && y <= box.bottom) {
                const elementMiddle = (box.top + box.bottom) / 2;
                
                // Si está en la mitad superior, insertar ANTES
                if (y < elementMiddle) {
                    insertBeforeElement = element;
                    break;
                } else {
                    // Si está en la mitad inferior, insertar DESPUÉS
                    // Continuar al siguiente elemento (o al final si es el último)
                    if (i === elements.length - 1) {
                        // Es el último elemento, insertar al final
                        return { element: element, position: 'after' };
                    }
                    // Continuar al siguiente
                    continue;
                }
            }
        }
        
        // Si encontró un elemento antes del cual insertar
        if (insertBeforeElement) {
            return { element: insertBeforeElement, position: 'before' };
        }
        
        // Si llegó aquí, está después de todos los elementos
        return { element: elements[elements.length - 1], position: 'after' };
    }
    
    /**
     * Cicla entre 4 estados de sidebars (EDITOR SIEMPRE VISIBLE):
     * Estado inicial: Páginas + Editor + Recursos
     * Click 1: Páginas + Editor (sin Recursos)
     * Click 2: Editor + Recursos (sin Páginas)
     * Click 3: Solo Editor (sin sidebars)
     * Click 4: Volver al inicio (ambos visibles)
     */
    cycleSidebars() {
        const grid = document.getElementById('study-content-grid');
        if (!grid) return;
        
        const hasLeft = grid.classList.contains('hide-left');
        const hasRight = grid.classList.contains('hide-right');
        const hasBoth = grid.classList.contains('hide-both');
        
        // Estado inicial: Ambos visibles (sin clases)
        if (!hasLeft && !hasRight && !hasBoth) {
            // Click 1: Ocultar Recursos → Páginas + Editor
            grid.classList.add('hide-right');
        }
        // Estado 1: Solo Páginas + Editor (.hide-right)
        else if (!hasLeft && hasRight && !hasBoth) {
            // Click 2: Ocultar Páginas, mostrar Recursos → Editor + Recursos
            grid.classList.remove('hide-right');
            grid.classList.add('hide-left');
        }
        // Estado 2: Solo Editor + Recursos (.hide-left)
        else if (hasLeft && !hasRight && !hasBoth) {
            // Click 3: Ocultar Recursos también → Solo Editor
            grid.classList.add('hide-both');
            grid.classList.remove('hide-left');
        }
        // Estado 3: Solo Editor (.hide-both)
        else if (hasBoth) {
            // Click 4: Mostrar ambos → Volver al inicio
            grid.classList.remove('hide-both');
        }
    }
    
    /**
     * Alterna la visibilidad del header para modo sin distracciones
     */
    toggleHeader() {
        const studyView = document.getElementById('study-view');
        const header = studyView?.querySelector('header');
        const toggleBtn = document.getElementById('toggle-header-btn');
        
        if (!header || !toggleBtn) return;
        
        const isHidden = header.classList.contains('header-hidden');
        
        if (isHidden) {
            // Mostrar header
            header.classList.remove('header-hidden');
            toggleBtn.title = 'Modo sin distracciones (ocultar header)';
            // Cambiar icono a eye-off
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'eye-off');
                if (window.lucide) window.lucide.createIcons();
            }
        } else {
            // Ocultar header
            header.classList.add('header-hidden');
            toggleBtn.title = 'Mostrar header';
            // Cambiar icono a eye
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'eye');
                if (window.lucide) window.lucide.createIcons();
            }
        }
    }
    
    // ==================== MÉTODOS DE TIMER ====================
    
    /**
     * Inicializa o continúa la sesión de estudio
     */
    initializeStudySession() {
        // Verificar si hay una sesión activa
        const activeSession = this.dataManager.data.activeStudySession;
        
        if (activeSession && activeSession.subjectId === this.currentSubject?.id) {
            // Continuar con la sesión existente
            this.studyTimer = activeSession;
            
            // Calcular tiempo pausado acumulado si existe
            if (activeSession.pausedTime) {
                this.pausedTime = activeSession.pausedTime;
            }
            
            this.startTimer();
            this.showTimer();
        }
        
        // Event listener para botón de pausa
        const pauseBtn = document.getElementById('pause-timer-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
        
        // Registrar listener de beforeunload solo una vez
        if (!this.beforeUnloadRegistered) {
            window.addEventListener('beforeunload', () => {
                // Guardar tiempo pausado acumulado antes de cerrar
                if (this.studyTimer && this.dataManager.data.activeStudySession) {
                    this.dataManager.data.activeStudySession.pausedTime = this.pausedTime;
                    this.dataManager.save();
                }
                this.endStudySession();
            });
            this.beforeUnloadRegistered = true;
        }
    }
    
    /**
     * Muestra el timer en el header
     */
    showTimer() {
        const timerElement = document.getElementById('study-timer');
        if (timerElement) {
            timerElement.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        }
    }
    
    /**
     * Oculta el timer
     */
    hideTimer() {
        const timerElement = document.getElementById('study-timer');
        if (timerElement) {
            timerElement.classList.add('hidden');
        }
    }
    
    /**
     * Inicia el conteo del timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && this.studyTimer) {
                this.updateTimerDisplay();
            }
        }, 1000); // Actualizar cada segundo
    }
    
    /**
     * Actualiza la visualización del timer
     */
    updateTimerDisplay() {
        if (!this.studyTimer) return;
        
        const elapsed = this.getElapsedTime();
        
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        
        // Display minimalista (solo minutos en el header)
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Display detallado (en el tooltip)
        const timerDetailed = document.getElementById('timer-detailed');
        if (timerDetailed) {
            timerDetailed.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Obtiene el tiempo transcurrido en segundos
     */
    getElapsedTime() {
        if (!this.studyTimer) return 0;
        
        const now = new Date();
        const startTime = new Date(this.studyTimer.startTime);
        const elapsed = Math.floor((now - startTime) / 1000);
        
        return elapsed - this.pausedTime;
    }
    
    /**
     * Pausa o reanuda el timer
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        const pauseBtn = document.getElementById('pause-timer-btn');
        if (pauseBtn) {
            if (this.isPaused) {
                pauseBtn.innerHTML = `
                    <i data-lucide="play" class="w-4 h-4"></i>
                    <span>Reanudar</span>
                `;
                pauseBtn.classList.remove('bg-amber-600', 'hover:bg-amber-700');
                pauseBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
                this.pauseStartTime = Date.now();
            } else {
                pauseBtn.innerHTML = `
                    <i data-lucide="pause" class="w-4 h-4"></i>
                    <span>Pausar</span>
                `;
                pauseBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
                pauseBtn.classList.add('bg-amber-600', 'hover:bg-amber-700');
                
                // Acumular tiempo pausado
                if (this.pauseStartTime) {
                    this.pausedTime += Math.floor((Date.now() - this.pauseStartTime) / 1000);
                }
            }
            
            if (window.lucide) window.lucide.createIcons();
        }
    }
    
    /**
     * Finaliza la sesión de estudio y guarda estadísticas
     */
    endStudySession() {
        if (!this.studyTimer || !this.currentSubject) return;
        
        const duration = Math.floor(this.getElapsedTime() / 60); // Convertir a minutos
        
        // Guardar estadísticas
        this.saveStudyStats(this.currentSubject.id, duration);
        
        // Limpiar timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Limpiar sesión activa
        delete this.dataManager.data.activeStudySession;
        this.dataManager.save();
        
        this.studyTimer = null;
        this.hideTimer();
        
        // Notificar solo si el usuario estudió más de 1 minuto
        if (duration > 0) {
            this.notifications.success(`Sesión finalizada. Estudiaste ${duration} minuto${duration !== 1 ? 's' : ''}`);
        }
    }
    
    /**
     * Guarda estadísticas de estudio
     */
    saveStudyStats(subjectId, minutes) {
        if (!this.dataManager.data.studyStats) {
            this.dataManager.data.studyStats = {};
        }
        
        const today = new Date().toISOString().split('T')[0];
        
        if (!this.dataManager.data.studyStats[today]) {
            this.dataManager.data.studyStats[today] = {};
        }
        
        if (!this.dataManager.data.studyStats[today][subjectId]) {
            this.dataManager.data.studyStats[today][subjectId] = 0;
        }
        
        this.dataManager.data.studyStats[today][subjectId] += minutes;
        this.dataManager.save();
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

export default StudyView;
