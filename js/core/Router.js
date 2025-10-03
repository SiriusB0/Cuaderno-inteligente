/**
 * Sistema de navegación y routing para la aplicación
 * Usa Hash Routing (#) que funciona sin servidor
 */
class Router {
    constructor() {
        this.currentView = null;
        this.currentData = null;
        this.views = new Map();
        this.listeners = new Map();
        this.STORAGE_KEY = 'cuaderno_route_state';
        
        this.initializeViews();
        this.setupHashListener();
    }
    
    /**
     * Inicializa las vistas disponibles
     */
    initializeViews() {
        this.views.set('login', {
            element: document.getElementById('login-view'),
            title: 'Iniciar Sesión'
        });
        
        this.views.set('dashboard', {
            element: document.getElementById('dashboard-view'),
            title: 'Dashboard'
        });
        
        this.views.set('subjects', {
            element: document.getElementById('subjects-view'),
            title: 'Mis Materias'
        });
        
        this.views.set('topics', {
            element: document.getElementById('topics-view'),
            title: 'Temas'
        });
        
        this.views.set('study', {
            element: document.getElementById('study-view'),
            title: 'Estudiar'
        });
    }
    
    /**
     * Alias para navigateTo (más corto)
     */
    navigate(viewName, data = null) {
        return this.navigateTo(viewName, data);
    }
    
    /**
     * Navega a una vista específica
     */
    navigateTo(viewName, data = null) {
        try {
            // Validar que la vista existe
            if (!this.views.has(viewName)) {
                throw new Error(`Vista '${viewName}' no encontrada`);
            }
            
            // Ocultar vista actual
            if (this.currentView) {
                const currentViewData = this.views.get(this.currentView);
                if (currentViewData?.element) {
                    currentViewData.element.classList.add('hidden');
                }
            }
            
            // Mostrar nueva vista
            const newViewData = this.views.get(viewName);
            if (newViewData?.element) {
                newViewData.element.classList.remove('hidden');
            }
            
            // Actualizar estado
            const previousView = this.currentView;
            this.currentView = viewName;
            this.currentData = data;
            
            // Actualizar hash en la URL
            const hash = this.buildHash(viewName, data);
            if (window.location.hash !== hash) {
                window.location.hash = hash;
            }
            
            // Guardar estado en localStorage como backup
            this.saveCurrentState();
            
            // Emitir evento de navegación
            this.emit('navigationChanged', {
                from: previousView,
                to: viewName,
                data: data
            });
            
            // Actualizar título de la página
            this.updatePageTitle(newViewData.title);
            
            return true;
        } catch (error) {
            console.error('Error en navegación:', error);
            this.emit('navigationError', error);
            return false;
        }
    }
    
    /**
     * Construye el hash para una vista
     */
    buildHash(viewName, data) {
        switch (viewName) {
            case 'dashboard':
                return '';
            case 'topics':
                if (data && data.id) {
                    return `#${data.id}`;
                }
                return '';
            case 'study':
                if (data && data.subject && data.topic) {
                    return `#${data.subject.id}/${data.topic.id}`;
                }
                return '';
            default:
                return '';
        }
    }
    
    /**
     * Configura listener para cambios en el hash
     */
    setupHashListener() {
        window.addEventListener('hashchange', () => {
            this.parseHashAndNavigate();
        });
    }
    
    /**
     * Parsea el hash actual y navega
     */
    parseHashAndNavigate() {
        const hash = window.location.hash.substring(1); // Quitar el #
        
        if (!hash || hash === '') {
            // Sin hash: Dashboard
            this.currentView = 'dashboard';
            this.showView('dashboard');
            return;
        }
        
        const parts = hash.split('/');
        
        if (parts.length === 1) {
            // Un segmento: Topics
            const subjectId = parts[0];
            const savedState = this.restoreState();
            if (savedState && savedState.data && savedState.data.id === subjectId) {
                this.currentView = 'topics';
                this.currentData = savedState.data;
                this.showView('topics');
                this.emit('navigationChanged', {
                    from: null,
                    to: 'topics',
                    data: savedState.data
                });
            } else {
                this.currentView = 'topics';
                this.currentData = { id: subjectId };
                this.showView('topics');
                this.emit('navigationChanged', {
                    from: null,
                    to: 'topics',
                    data: { id: subjectId }
                });
            }
        } else if (parts.length === 2) {
            // Dos segmentos: Study
            const subjectId = parts[0];
            const topicId = parts[1];
            const savedState = this.restoreState();
            if (savedState && savedState.data && savedState.data.subject && savedState.data.topic) {
                this.currentView = 'study';
                this.currentData = savedState.data;
                this.showView('study');
                this.emit('navigationChanged', {
                    from: null,
                    to: 'study',
                    data: savedState.data
                });
            } else {
                this.currentView = 'study';
                this.currentData = {
                    subject: { id: subjectId },
                    topic: { id: topicId }
                };
                this.showView('study');
                this.emit('navigationChanged', {
                    from: null,
                    to: 'study',
                    data: {
                        subject: { id: subjectId },
                        topic: { id: topicId }
                    }
                });
            }
        }
    }
    
    /**
     * Muestra una vista (helper interno)
     */
    showView(viewName) {
        // Ocultar todas
        this.views.forEach((viewData) => {
            if (viewData.element) {
                viewData.element.classList.add('hidden');
            }
        });
        
        // Mostrar la solicitada
        const viewData = this.views.get(viewName);
        if (viewData?.element) {
            viewData.element.classList.remove('hidden');
        }
    }
    
    /**
     * Obtiene la vista actual
     */
    getCurrentView() {
        return {
            name: this.currentView,
            data: this.currentData
        };
    }
    
    /**
     * Navega hacia atrás
     */
    goBack() {
        switch (this.currentView) {
            case 'study':
                this.navigateTo('topics', this.currentData?.subject);
                break;
            case 'topics':
                this.navigateTo('dashboard');
                break;
            case 'subjects':
                this.navigateTo('dashboard');
                break;
            default:
                // Ya estamos en la vista principal (dashboard)
                break;
        }
    }
    
    /**
     * Actualiza el título de la página
     */
    updatePageTitle(title) {
        document.title = title ? `${title} - Cuaderno Inteligente` : 'Cuaderno Inteligente';
    }
    
    /**
     * Registra un listener para eventos de navegación
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    /**
     * Elimina un listener
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    /**
     * Emite un evento
     */
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error en listener de router ${event}:`, error);
            }
        });
    }
    
    /**
     * Guarda el estado actual de navegación
     */
    saveCurrentState() {
        try {
            const state = {
                view: this.currentView,
                data: this.serializeData(this.currentData),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('No se pudo guardar el estado de navegación:', error);
        }
    }
    
    /**
     * Restaura el estado guardado de navegación
     */
    restoreState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return null;
            
            const state = JSON.parse(saved);
            
            // Verificar que el estado no sea muy antiguo (más de 24 horas)
            const savedTime = new Date(state.timestamp);
            const now = new Date();
            const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                localStorage.removeItem(this.STORAGE_KEY);
                return null;
            }
            
            return {
                view: state.view,
                data: this.deserializeData(state.data)
            };
        } catch (error) {
            console.warn('No se pudo restaurar el estado de navegación:', error);
            return null;
        }
    }
    
    /**
     * Serializa datos para guardar en localStorage
     */
    serializeData(data) {
        if (!data) return null;
        
        try {
            // Para StudyView que tiene subject y topic
            if (data.subject && data.topic) {
                return {
                    subject: { id: data.subject.id },
                    topic: { id: data.topic.id }
                };
            }
            
            // Para objetos individuales con ID
            if (data.id) {
                return { id: data.id };
            }
            
            return null;
        } catch (error) {
            console.warn('Error serializando datos:', error);
            return null;
        }
    }
    
    /**
     * Deserializa datos desde localStorage
     */
    deserializeData(serialized) {
        // Los datos completos se cargarán desde el DataManager en las vistas
        return serialized;
    }
    
    /**
     * Limpia el estado guardado
     */
    clearSavedState() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
    
    /**
     * Inicializa la navegación leyendo el hash actual
     */
    initialize() {
        // Si hay hash, parsear y navegar
        if (window.location.hash) {
            this.parseHashAndNavigate();
        } else {
            // Sin hash: ir al dashboard
            this.navigateTo('dashboard');
        }
    }
}

export default Router;
