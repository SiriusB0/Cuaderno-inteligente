import StorageManager from './StorageManager.js';
import Validator from '../utils/Validator.js';

/**
 * Gestor central de datos de la aplicación
 */
class DataManager {
    constructor() {
        this.data = this.initializeData();
        this.listeners = new Map();
        this.syncEnabled = true; // Habilitar sincronización con Supabase
        this.syncQueue = []; // Cola de operaciones pendientes
        this.loadFromSupabase(); // Cargar datos desde Supabase al iniciar
    }
    
    /**
     * Inicializa datos desde localStorage o crea estructura por defecto
     */
    initializeData() {
        const savedData = StorageManager.load();
        
        if (savedData) {
            // Asegurar que todas las propiedades requeridas existan
            const completeData = {
                ...savedData,
                userName: savedData.userName || 'Estudiante',
                currentPeriod: savedData.currentPeriod || 'Cuatrimestre 1 - 2025',
                subjects: savedData.subjects || [],
                topics: savedData.topics || [],
                pages: savedData.pages || {},
                events: savedData.events || {},
                resources: savedData.resources || {},
                settings: savedData.settings || {
                    theme: 'light',
                    autoSave: true,
                    autoSaveInterval: 3000
                },
                lastModified: new Date().toISOString()
            };
            return completeData;
        }
        
        return this.getDefaultData();
    }
    
    /**
     * Estructura de datos por defecto
     */
    getDefaultData() {
        return {
            userName: 'Estudiante',
            currentPeriod: 'Cuatrimestre 1 - 2025',
            subjects: [
                {
                    id: 'subj_1',
                    name: "Cálculo I",
                    description: "Fundamentos de cálculo diferencial e integral",
                    color: "#6366f1",
                    period: 'Cuatrimestre 1 - 2025',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'subj_2',
                    name: "Programación",
                    description: "Conceptos de programación orientada a objetos",
                    color: "#ec4899",
                    period: 'Cuatrimestre 1 - 2025',
                    createdAt: new Date().toISOString()
                }
            ],
            topics: [
                {
                    id: 'topic_1',
                    subjectId: 'subj_1',
                    name: "Derivadas",
                    description: "Concepto y aplicaciones de derivadas",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'topic_2',
                    subjectId: 'subj_1',
                    name: "Integrales",
                    description: "Cálculo integral y sus aplicaciones",
                    createdAt: new Date().toISOString()
                }
            ],
            pages: {
                'topic_1': [
                    {
                        id: 'page_1',
                        type: 'text',
                        title: 'Introducción a Derivadas',
                        content: '<h1>Concepto de Derivada</h1><p>La derivada representa la tasa de cambio instantánea...</p>',
                        createdAt: new Date().toISOString()
                    }
                ]
            },
            events: {
                'subj_1': [
                    {
                        id: 'event_1',
                        title: 'Examen Final de Cálculo',
                        description: 'Examen final que incluye derivadas e integrales',
                        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // En 7 días
                        type: 'exam',
                        createdAt: new Date().toISOString()
                    }
                ]
            },
            resources: {},
            settings: {
                theme: 'light',
                autoSave: true,
                autoSaveInterval: 3000
            },
            lastModified: new Date().toISOString()
        };
    }
    
    /**
     * Guarda datos en localStorage
     */
    save() {
        this.data.lastModified = new Date().toISOString();
        const result = StorageManager.save(this.data);
        
        if (result.success) {
            this.emit('dataSaved', this.data);
        } else {
            this.emit('saveError', result.error);
        }
        
        return result;
    }
    
    // === GESTIÓN DE MATERIAS ===
    
    getSubjects() {
        return this.data.subjects || [];
    }
    
    getSubject(id) {
        return this.data.subjects.find(s => s.id === id);
    }
    
    createSubject(subjectData) {
        try {
            // Sanitizar y validar datos
            const sanitizedData = Validator.sanitizeAndValidate(subjectData, 'subject');
            
            const subject = {
                id: `subj_${Date.now()}`,
                name: sanitizedData.name,
                description: sanitizedData.description,
                color: sanitizedData.color,
                period: this.data.currentPeriod || 'Sin período',
                createdAt: new Date().toISOString()
            };
            
            this.data.subjects.push(subject);
            this.save();
            this.emit('subjectCreated', subject);
            
            // Sincronizar con Supabase en background
            this.syncToSupabase('subjects', 'POST', subject);
            
            return subject;
        } catch (error) {
            console.error('Error creando materia:', error);
            throw error;
        }
    }
    
    updateSubject(id, updates) {
        const index = this.data.subjects.findIndex(s => s.id === id);
        if (index === -1) return null;
        
        this.data.subjects[index] = { ...this.data.subjects[index], ...updates };
        this.save();
        this.emit('subjectUpdated', this.data.subjects[index]);
        
        // Sincronizar con Supabase
        this.syncToSupabase('subjects', 'PUT', { id, ...updates });
        
        return this.data.subjects[index];
    }
    
    deleteSubject(id) {
        // Eliminar materia y todos sus temas y páginas
        this.data.subjects = this.data.subjects.filter(s => s.id !== id);
        this.data.topics = this.data.topics.filter(t => t.subjectId !== id);
        
        // Eliminar páginas de todos los temas de esta materia
        Object.keys(this.data.pages).forEach(topicId => {
            const topic = this.data.topics.find(t => t.id === topicId);
            if (!topic || topic.subjectId === id) {
                delete this.data.pages[topicId];
            }
        });
        
        this.save();
        this.emit('subjectDeleted', id);
        
        // Sincronizar con Supabase
        this.syncToSupabase('subjects', 'DELETE', { id });
    }
    
    // === GESTIÓN DE TEMAS ===
    
    getTopics(subjectId) {
        return this.data.topics.filter(t => t.subjectId === subjectId);
    }
    
    getTopic(id) {
        return this.data.topics.find(t => t.id === id);
    }
    
    createTopic(topicData) {
        try {
            // Sanitizar y validar datos
            const sanitizedData = Validator.sanitizeAndValidate(topicData, 'topic');
            
            const topic = {
                id: `topic_${Date.now()}`,
                subjectId: sanitizedData.subjectId,
                name: sanitizedData.name,
                description: sanitizedData.description,
                createdAt: new Date().toISOString()
            };
            
            this.data.topics.push(topic);
            
            // Inicializar páginas para este tema
            if (!this.data.pages[topic.id]) {
                this.data.pages[topic.id] = [];
            }
            
            this.save();
            this.emit('topicCreated', topic);
            
            // Sincronizar con Supabase
            this.syncToSupabase('topics', 'POST', topic);
            
            return topic;
        } catch (error) {
            console.error('Error creando tema:', error);
            throw error;
        }
    }
    
    updateTopic(id, updates) {
        const index = this.data.topics.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        this.data.topics[index] = { ...this.data.topics[index], ...updates };
        this.save();
        this.emit('topicUpdated', this.data.topics[index]);
        
        // Sincronizar con Supabase
        this.syncToSupabase('topics', 'PUT', { id, ...updates });
        
        return this.data.topics[index];
    }
    
    deleteTopic(id) {
        this.data.topics = this.data.topics.filter(t => t.id !== id);
        delete this.data.pages[id];
        delete this.data.resources[id];
        
        this.save();
        this.emit('topicDeleted', id);
        
        // Sincronizar con Supabase
        this.syncToSupabase('topics', 'DELETE', { id });
    }
    
    // === GESTIÓN DE PÁGINAS ===
    
    getPages(topicId) {
        return this.data.pages[topicId] || [];
    }
    
    getPage(topicId, pageId) {
        const pages = this.data.pages[topicId] || [];
        return pages.find(p => p.id === pageId);
    }
    
    createPage(topicId, pageData) {
        try {
            // Sanitizar y validar datos
            const sanitizedData = Validator.sanitizeAndValidate(pageData, 'page');
            
            const page = {
                id: `page_${Date.now()}`,
                type: sanitizedData.type,
                title: sanitizedData.title || 'Nueva página',
                content: sanitizedData.content,
                createdAt: new Date().toISOString()
            };
            
            if (!this.data.pages[topicId]) {
                this.data.pages[topicId] = [];
            }
            
            this.data.pages[topicId].push(page);
            this.save();
            this.emit('pageCreated', { topicId, page });
            
            // Sincronizar con Supabase
            this.syncToSupabase('save-page', 'POST', { topicId, ...page });
            
            return page;
        } catch (error) {
            console.error('Error creando página:', error);
            throw error;
        }
    }
    
    updatePage(topicId, pageId, updates) {
        const pages = this.data.pages[topicId] || [];
        const index = pages.findIndex(p => p.id === pageId);
        
        if (index === -1) return null;
        
        pages[index] = { ...pages[index], ...updates };
        this.save();
        this.emit('pageUpdated', { topicId, page: pages[index] });
        
        // Sincronizar con Supabase
        this.syncToSupabase('save-page', 'POST', { topicId, pageId, ...updates });
        
        return pages[index];
    }
    
    deletePage(topicId, pageId) {
        if (!this.data.pages[topicId]) return false;
        
        this.data.pages[topicId] = this.data.pages[topicId].filter(p => p.id !== pageId);
        this.save();
        this.emit('pageDeleted', { topicId, pageId });
        
        // Sincronizar con Supabase
        this.syncToSupabase('delete-page', 'DELETE', { pageId });
        
        return true;
    }
    
    // === SISTEMA DE EVENTOS ===
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error en listener de evento ${event}:`, error);
            }
        });
    }
    
    // === UTILIDADES ===
    
    reset() {
        this.data = this.getDefaultData();
        this.save();
        this.emit('dataReset', this.data);
    }
    
    export() {
        return StorageManager.export();
    }
    
    getStats() {
        return StorageManager.getStats();
    }
    
    // === GESTIÓN DE EVENTOS ===
    
    getEvents(subjectId) {
        if (!this.data.events) {
            this.data.events = {};
        }
        return this.data.events[subjectId] || [];
    }
    
    createEvent(subjectId, eventData) {
        try {
            // Asegurar que events existe
            if (!this.data.events) {
                this.data.events = {};
            }
            
            const event = {
                id: `event_${Date.now()}`,
                title: eventData.title,
                description: eventData.description || '',
                date: eventData.date,
                type: eventData.type || 'general',
                createdAt: new Date().toISOString()
            };
            
            if (!this.data.events[subjectId]) {
                this.data.events[subjectId] = [];
            }
            
            this.data.events[subjectId].push(event);
            this.save();
            this.emit('eventCreated', { subjectId, event });
            
            // Sincronizar con Supabase
            this.syncToSupabase('events', 'POST', { subjectId, ...event });
            
            return event;
        } catch (error) {
            console.error('Error creando evento:', error);
            throw error;
        }
    }
    
    updateEvent(subjectId, eventId, updates) {
        if (!this.data.events) {
            this.data.events = {};
        }
        const events = this.data.events[subjectId] || [];
        const index = events.findIndex(e => e.id === eventId);
        
        if (index === -1) return null;
        
        events[index] = { ...events[index], ...updates };
        this.save();
        this.emit('eventUpdated', { subjectId, event: events[index] });
        
        // Sincronizar con Supabase
        this.syncToSupabase('events', 'PUT', { id: eventId, ...updates });
        
        return events[index];
    }
    
    deleteEvent(subjectId, eventId) {
        if (!this.data.events) {
            this.data.events = {};
        }
        if (!this.data.events[subjectId]) return false;
        
        this.data.events[subjectId] = this.data.events[subjectId].filter(e => e.id !== eventId);
        this.save();
        this.emit('eventDeleted', { subjectId, eventId });
        
        // Sincronizar con Supabase
        this.syncToSupabase('events', 'DELETE', { id: eventId });
        
        return true;
    }
    
    // === SINCRONIZACIÓN CON SUPABASE ===
    
    /**
     * Sincroniza una operación con Supabase en background
     * @param {string} endpoint - Endpoint de la API (subjects, topics, save-page, etc.)
     * @param {string} method - Método HTTP (POST, PUT, DELETE)
     * @param {object} data - Datos a enviar
     */
    async syncToSupabase(endpoint, method, data) {
        if (!this.syncEnabled) {
            console.log('[Sync] Sincronización deshabilitada');
            return;
        }

        try {
            const url = `/api/${endpoint}`;
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // Para GET no enviamos body
            if (method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            console.log(`[Sync] ${method} ${url}`, data);

            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error en la sincronización');
            }

            console.log(`[Sync] ✅ Éxito:`, result);
            this.emit('syncSuccess', { endpoint, method, data, result });

        } catch (error) {
            console.warn(`[Sync] ⚠️ Error sincronizando con Supabase:`, error);
            console.warn('[Sync] Los datos están guardados en localStorage');
            
            // Agregar a cola de reintentos (opcional)
            this.syncQueue.push({ endpoint, method, data, timestamp: Date.now() });
            this.emit('syncError', { endpoint, method, data, error: error.message });
        }
    }

    /**
     * Habilita o deshabilita la sincronización con Supabase
     */
    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
        console.log(`[Sync] Sincronización ${enabled ? 'habilitada' : 'deshabilitada'}`);
    }

    /**
     * Reintentar operaciones pendientes en la cola
     */
    async retrySyncQueue() {
        if (this.syncQueue.length === 0) {
            console.log('[Sync] No hay operaciones pendientes');
            return;
        }

        console.log(`[Sync] Reintentando ${this.syncQueue.length} operaciones pendientes...`);
        const queue = [...this.syncQueue];
        this.syncQueue = [];

        for (const operation of queue) {
            await this.syncToSupabase(operation.endpoint, operation.method, operation.data);
        }
    }

    /**
     * Carga datos iniciales desde Supabase al arrancar la app
     * Esto permite recuperar datos en cualquier dispositivo o si se borra localStorage
     */
    async loadFromSupabase() {
        console.log('[Load] 🔄 Cargando datos desde Supabase...');
        
        try {
            // Cargar subjects
            const subjectsResponse = await fetch('/api/subjects');
            if (subjectsResponse.ok) {
                const subjectsData = await subjectsResponse.json();
                if (subjectsData.success && subjectsData.subjects.length > 0) {
                    this.data.subjects = subjectsData.subjects;
                    console.log(`[Load] ✅ ${subjectsData.subjects.length} materias cargadas`);
                }
            }

            // Para cada subject, cargar sus topics
            for (const subject of this.data.subjects) {
                const topicsResponse = await fetch(`/api/topics?subjectId=${subject.id}`);
                if (topicsResponse.ok) {
                    const topicsData = await topicsResponse.json();
                    if (topicsData.success && topicsData.topics.length > 0) {
                        // Agregar topics que no existan en local
                        topicsData.topics.forEach(topic => {
                            if (!this.data.topics.find(t => t.id === topic.id)) {
                                this.data.topics.push(topic);
                            }
                        });
                    }
                }

                // Cargar eventos de este subject
                const eventsResponse = await fetch(`/api/events?subjectId=${subject.id}`);
                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    if (eventsData.success && eventsData.events.length > 0) {
                        if (!this.data.events) this.data.events = {};
                        this.data.events[subject.id] = eventsData.events;
                    }
                }
            }

            // Para cada topic, cargar sus pages
            for (const topic of this.data.topics) {
                const pagesResponse = await fetch(`/api/list-pages?topicId=${topic.id}`);
                if (pagesResponse.ok) {
                    const pagesData = await pagesResponse.json();
                    if (pagesData.success && pagesData.pages.length > 0) {
                        this.data.pages[topic.id] = pagesData.pages;
                    }
                }
            }

            // Guardar en localStorage
            this.save();
            console.log('[Load] ✅ Todos los datos cargados y sincronizados con localStorage');
            this.emit('dataLoaded', this.data);

        } catch (error) {
            console.warn('[Load] ⚠️ Error cargando desde Supabase:', error);
            console.warn('[Load] Usando datos de localStorage');
        }
    }
}

export default DataManager;
