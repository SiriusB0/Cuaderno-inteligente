import StorageManager from './StorageManager.js';
import Validator from '../utils/Validator.js';

/**
 * Gestor central de datos de la aplicación
 */
class DataManager {
    constructor() {
        this.data = this.initializeData();
        this.listeners = new Map();
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
        
        return this.data.topics[index];
    }
    
    deleteTopic(id) {
        this.data.topics = this.data.topics.filter(t => t.id !== id);
        delete this.data.pages[id];
        delete this.data.resources[id];
        
        this.save();
        this.emit('topicDeleted', id);
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
        
        return pages[index];
    }
    
    deletePage(topicId, pageId) {
        if (!this.data.pages[topicId]) return false;
        
        this.data.pages[topicId] = this.data.pages[topicId].filter(p => p.id !== pageId);
        this.save();
        this.emit('pageDeleted', { topicId, pageId });
        
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
        
        return true;
    }
}

export default DataManager;
