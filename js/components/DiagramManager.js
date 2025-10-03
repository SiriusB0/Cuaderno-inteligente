/**
 * DiagramManager - Gestiona el editor de diagramas BPMN.js
 * Funcionalidad similar a demo.bpmn.io
 */
class DiagramManager {
    constructor(dataManager, notifications) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        this.modeler = null;
        this.container = document.getElementById('diagram-container');
        this.currentPageId = null;
        this.autoSaveTimeout = null;
        this.isInitialized = false;
    }

    /**
     * Inicializa el modeler BPMN en el contenedor
     */
    async initialize() {
        if (this.isInitialized || !this.container) {
            return;
        }

        try {
            // Verificar que BpmnJS esté disponible
            if (typeof BpmnJS === 'undefined') {
                console.error('BpmnJS no está cargado');
                this.notifications.error('El editor de diagramas no está disponible. Recarga la página.');
                return;
            }

            // Crear instancia del modeler BPMN
            this.modeler = new BpmnJS({
                container: this.container,
                keyboard: {
                    bindTo: document
                },
                height: '100%',
                width: '100%'
            });

            this.isInitialized = true;
            console.log('DiagramManager inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando DiagramManager:', error);
            this.notifications.error('Error al inicializar el editor de diagramas');
        }
    }

    /**
     * Crea un nuevo diagrama vacío
     */
    async createNewDiagram() {
        if (!this.modeler) {
            await this.initialize();
        }

        const emptyDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

        try {
            await this.modeler.importXML(emptyDiagram);
            
            // Centrar canvas
            const canvas = this.modeler.get('canvas');
            canvas.zoom('fit-viewport', 'auto');
            
            // Setup auto-save
            this.setupAutoSave();
            
            console.log('Diagrama nuevo creado');
        } catch (error) {
            console.error('Error creando diagrama nuevo:', error);
            this.notifications.error('Error al crear el diagrama');
        }
    }

    /**
     * Carga un diagrama existente desde contenido XML
     */
    async loadDiagram(xmlContent, pageId) {
        if (!this.modeler) {
            await this.initialize();
        }

        this.currentPageId = pageId;

        try {
            // Si el contenido está vacío o es JSON vacío, crear nuevo
            if (!xmlContent || xmlContent === '{}' || xmlContent.trim() === '') {
                await this.createNewDiagram();
                return;
            }

            await this.modeler.importXML(xmlContent);
            
            // Centrar canvas
            const canvas = this.modeler.get('canvas');
            canvas.zoom('fit-viewport', 'auto');
            
            // Setup auto-save
            this.setupAutoSave();
            
            console.log('Diagrama cargado correctamente');
        } catch (error) {
            console.error('Error cargando diagrama:', error);
            this.notifications.warning('Creando nuevo diagrama...');
            await this.createNewDiagram();
        }
    }

    /**
     * Obtiene el contenido XML actual del diagrama
     */
    async getDiagramXML() {
        if (!this.modeler) {
            return '{}';
        }

        try {
            const { xml } = await this.modeler.saveXML({ format: true });
            return xml;
        } catch (error) {
            console.error('Error obteniendo XML del diagrama:', error);
            return '{}';
        }
    }

    /**
     * Guarda el diagrama actual en DataManager
     */
    async saveDiagram() {
        if (!this.currentPageId || !this.modeler) {
            return;
        }

        try {
            const xml = await this.getDiagramXML();
            
            // Buscar la página en DataManager
            for (const topicId in this.dataManager.data.pages) {
                const pages = this.dataManager.data.pages[topicId];
                const pageIndex = pages.findIndex(p => p.id === this.currentPageId);
                
                if (pageIndex !== -1) {
                    // Actualizar contenido
                    this.dataManager.data.pages[topicId][pageIndex].content = xml;
                    this.dataManager.save();
                    
                    // Emitir evento de actualización
                    this.dataManager.emit('diagramUpdated', {
                        pageId: this.currentPageId,
                        topicId: topicId
                    });
                    
                    console.log('Diagrama guardado automáticamente');
                    return;
                }
            }
        } catch (error) {
            console.error('Error guardando diagrama:', error);
        }
    }

    /**
     * Configura auto-guardado cada 3 segundos
     */
    setupAutoSave() {
        if (!this.modeler) return;

        // Limpiar timeout anterior
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        // Escuchar cambios en el modeler
        const eventBus = this.modeler.get('eventBus');
        
        const autoSave = () => {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            
            this.autoSaveTimeout = setTimeout(() => {
                this.saveDiagram();
            }, 3000);
        };

        // Eventos que disparan auto-save
        const events = [
            'commandStack.changed',
            'element.changed',
            'elements.changed'
        ];

        events.forEach(event => {
            eventBus.on(event, autoSave);
        });
    }

    /**
     * Muestra el contenedor del diagrama
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }

    /**
     * Oculta el contenedor del diagrama
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }

    /**
     * Limpia el modeler y el contenedor
     */
    destroy() {
        if (this.modeler) {
            try {
                this.modeler.destroy();
                this.modeler = null;
                this.isInitialized = false;
            } catch (error) {
                console.error('Error destruyendo modeler:', error);
            }
        }

        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }

        this.currentPageId = null;
    }

    /**
     * Obtiene la instancia del modeler (para acceso directo si es necesario)
     */
    getModeler() {
        return this.modeler;
    }

    /**
     * Exporta el diagrama como SVG
     */
    async exportSVG() {
        if (!this.modeler) {
            this.notifications.error('No hay diagrama para exportar');
            return null;
        }

        try {
            const { svg } = await this.modeler.saveSVG();
            return svg;
        } catch (error) {
            console.error('Error exportando SVG:', error);
            this.notifications.error('Error al exportar diagrama');
            return null;
        }
    }

    /**
     * Zoom in
     */
    zoomIn() {
        if (this.modeler) {
            const canvas = this.modeler.get('canvas');
            canvas.zoom(canvas.zoom() + 0.1);
        }
    }

    /**
     * Zoom out
     */
    zoomOut() {
        if (this.modeler) {
            const canvas = this.modeler.get('canvas');
            canvas.zoom(canvas.zoom() - 0.1);
        }
    }

    /**
     * Zoom fit (ajustar al viewport)
     */
    zoomFit() {
        if (this.modeler) {
            const canvas = this.modeler.get('canvas');
            canvas.zoom('fit-viewport', 'auto');
        }
    }

    /**
     * Resetear zoom al 100%
     */
    zoomReset() {
        if (this.modeler) {
            const canvas = this.modeler.get('canvas');
            canvas.zoom(1.0);
        }
    }
}

export default DiagramManager;
