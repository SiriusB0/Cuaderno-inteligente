/**
 * ExcalidrawManager - Implementación profesional de Excalidraw
 * Siguiendo las mejores prácticas de https://excalidraw.com/
 */
class ExcalidrawManager {
    constructor(dataManager, notifications) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        this.excalidrawAPI = null;
        this.container = document.getElementById('diagram-container');
        this.currentPageId = null;
        this.autoSaveTimeout = null;
        this.isInitialized = false;
    }

    /**
     * Inicializa Excalidraw con configuración profesional
     */
    async initialize() {
        if (this.isInitialized || !this.container) {
            return;
        }

        try {
            // Verificar dependencias
            if (typeof window.ExcalidrawLib === 'undefined') {
                console.error('ExcalidrawLib no disponible');
                this.notifications.error('Excalidraw no está cargado. Recarga la página.');
                return;
            }

            const self = this;
            
            // Configuración profesional y simplificada de Excalidraw
            const excalidrawProps = {
                // Auto-guardado
                onChange: (elements, appState, files) => {
                    self.triggerAutoSave();
                },
                
                // Referencia al API
                ref: (api) => {
                    if (api) {
                        self.excalidrawAPI = api;
                        console.log('✓ Excalidraw API listo');
                    }
                }
            };

            // Crear elemento React
            const excalidrawElement = window.React.createElement(
                window.ExcalidrawLib.Excalidraw,
                excalidrawProps
            );

            // Renderizar
            window.ReactDOM.render(excalidrawElement, this.container);

            this.isInitialized = true;
            console.log('✓ Excalidraw inicializado profesionalmente');
            
        } catch (error) {
            console.error('✗ Error inicializando Excalidraw:', error);
            this.notifications.error('Error al inicializar el editor de diagramas');
        }
    }

    /**
     * Carga un diagrama - SIEMPRE limpia primero, luego carga contenido
     */
    async loadDiagram(jsonContent, pageId) {
        this.currentPageId = pageId;

        // Esperar a que el API esté listo
        await this.waitForAPI();

        if (!this.excalidrawAPI) {
            console.error('API no disponible');
            return;
        }

        try {
            console.log(`=== Cargando página ${pageId} ===`);

            // PASO 1: SIEMPRE LIMPIAR EL CANVAS PRIMERO
            console.log('1. Limpiando canvas completamente...');
            this.excalidrawAPI.updateScene({
                elements: [],
                appState: {}
            });

            // PASO 2: Si no hay contenido, dejar en blanco
            if (!jsonContent || jsonContent === '{}' || jsonContent.trim() === '') {
                console.log('2. ✓ Página nueva - canvas vacío');
                return;
            }

            // PASO 3: Parsear y validar contenido
            console.log('2. Parseando contenido guardado...');
            const data = JSON.parse(jsonContent);
            
            if (!data.elements || !Array.isArray(data.elements) || data.elements.length === 0) {
                console.log('3. ✓ Sin elementos - canvas vacío');
                return;
            }

            // PASO 4: Cargar contenido existente
            console.log(`3. Cargando ${data.elements.length} elementos...`);
            this.excalidrawAPI.updateScene({
                elements: data.elements,
                appState: data.appState || {}
            });

            console.log('✓ Diagrama cargado exitosamente');

        } catch (error) {
            console.error('✗ Error cargando diagrama:', error);
            // En caso de error, asegurar canvas limpio
            this.excalidrawAPI.updateScene({
                elements: [],
                appState: {}
            });
            console.log('✓ Canvas limpiado después de error');
        }
    }

    /**
     * Espera a que el API esté disponible
     */
    async waitForAPI(maxAttempts = 50) {
        for (let i = 0; i < maxAttempts; i++) {
            if (this.excalidrawAPI) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.error('Timeout esperando API de Excalidraw');
        throw new Error('Excalidraw API no disponible');
    }

    /**
     * Obtiene el contenido del diagrama como JSON
     */
    async getDiagramJSON() {
        if (!this.excalidrawAPI) {
            return '{}';
        }

        try {
            const elements = this.excalidrawAPI.getSceneElements();
            const appState = this.excalidrawAPI.getAppState();
            
            const data = {
                type: 'excalidraw',
                version: 2,
                source: 'https://excalidraw.com',
                elements: elements,
                appState: {
                    viewBackgroundColor: appState.viewBackgroundColor,
                    gridSize: appState.gridSize
                }
            };
            
            return JSON.stringify(data);
        } catch (error) {
            console.error('Error obteniendo JSON:', error);
            return '{}';
        }
    }

    /**
     * Guarda el diagrama en DataManager
     */
    async saveDiagram() {
        if (!this.currentPageId || !this.excalidrawAPI) {
            return;
        }

        try {
            const json = await this.getDiagramJSON();
            
            // Buscar y actualizar la página
            for (const topicId in this.dataManager.data.pages) {
                const pages = this.dataManager.data.pages[topicId];
                const pageIndex = pages.findIndex(p => p.id === this.currentPageId);
                
                if (pageIndex !== -1) {
                    this.dataManager.data.pages[topicId][pageIndex].content = json;
                    this.dataManager.save();
                    
                    this.dataManager.emit('diagramUpdated', {
                        pageId: this.currentPageId,
                        topicId: topicId
                    });
                    
                    console.log('✓ Diagrama guardado');
                    return;
                }
            }
        } catch (error) {
            console.error('Error guardando diagrama:', error);
        }
    }

    /**
     * Dispara el auto-guardado con debounce
     */
    triggerAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.saveDiagram();
        }, 3000);
    }

    /**
     * Muestra el contenedor y asegura coordenadas correctas
     */
    show() {
        if (!this.container) return;

        console.log('Mostrando Excalidraw...');
        
        // Limpiar cualquier estilo inline que pueda causar offset
        this.container.style.margin = '0';
        this.container.style.padding = '0';
        this.container.style.border = '0';
        this.container.style.transform = 'none';
        
        // Mostrar contenedor
        this.container.classList.remove('hidden');
        
        // CRÍTICO: Wrapper sin overflow para coordenadas correctas
        const wrapper = document.getElementById('content-wrapper');
        if (wrapper) {
            wrapper.style.overflow = 'hidden';
            wrapper.style.margin = '0';
            wrapper.style.padding = '0';
            console.log('✓ Wrapper configurado para coordenadas exactas');
        }
        
        // Forzar recálculo de layout después de mostrar
        setTimeout(() => {
            if (this.excalidrawAPI) {
                // Trigger resize para que Excalidraw recalcule dimensiones
                window.dispatchEvent(new Event('resize'));
            }
        }, 100);
    }

    /**
     * Oculta el contenedor y restaura el layout
     */
    hide() {
        if (!this.container) return;

        console.log('Ocultando Excalidraw...');
        
        // Ocultar contenedor
        this.container.classList.add('hidden');
        
        // Restaurar overflow del wrapper
        const wrapper = document.getElementById('content-wrapper');
        if (wrapper) {
            wrapper.style.overflow = '';
            console.log('✓ Overflow restaurado');
        }
    }

    /**
     * Limpia recursos
     */
    destroy() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }

        this.currentPageId = null;
        this.excalidrawAPI = null;
        
        console.log('ExcalidrawManager destruido');
    }

    /**
     * Exporta como PNG
     */
    async exportToPNG() {
        if (!this.excalidrawAPI) {
            this.notifications.error('No hay diagrama para exportar');
            return null;
        }

        try {
            const elements = this.excalidrawAPI.getSceneElements();
            const canvas = await ExcalidrawLib.exportToCanvas({
                elements: elements,
                appState: this.excalidrawAPI.getAppState(),
                files: this.excalidrawAPI.getFiles()
            });
            
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error exportando PNG:', error);
            this.notifications.error('Error al exportar diagrama');
            return null;
        }
    }

    /**
     * Exporta como SVG
     */
    async exportToSVG() {
        if (!this.excalidrawAPI) {
            this.notifications.error('No hay diagrama para exportar');
            return null;
        }

        try {
            const elements = this.excalidrawAPI.getSceneElements();
            const svg = await ExcalidrawLib.exportToSvg({
                elements: elements,
                appState: this.excalidrawAPI.getAppState(),
                files: this.excalidrawAPI.getFiles()
            });
            
            return new XMLSerializer().serializeToString(svg);
        } catch (error) {
            console.error('Error exportando SVG:', error);
            this.notifications.error('Error al exportar diagrama');
            return null;
        }
    }
}

export default ExcalidrawManager;
