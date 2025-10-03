/**
 * Gestor de eventos para materias
 */
class EventsManager {
    constructor(dataManager, notifications) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        this.currentEvents = [];
        this.currentEventIndex = 0;
        this.currentSubjectId = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        this.dataManager.on('eventCreated', () => this.loadEvents(this.currentSubjectId));
        this.dataManager.on('eventUpdated', () => this.loadEvents(this.currentSubjectId));
        this.dataManager.on('eventDeleted', () => this.loadEvents(this.currentSubjectId));
        this.dataManager.on('eventCompleted', () => this.loadEvents(this.currentSubjectId));
    }
    
    /**
     * Carga eventos de una materia
     */
    loadEvents(subjectId) {
        if (!subjectId) {
            this.currentEvents = [];
            this.currentSubjectId = null;
            return;
        }
        
        this.currentSubjectId = subjectId;
        this.currentEvents = this.dataManager.getEvents(subjectId) || [];
        this.currentEventIndex = 0;
        this.renderEventsWidget();
    }
    
    /**
     * Renderiza el widget de eventos
     */
    renderEventsWidget() {
        const container = document.getElementById('events-widget');
        if (!container) return;
        
        // Solo mostrar en la vista de estudio, no en dashboard
        const studyView = document.getElementById('study-view');
        if (!studyView || studyView.classList.contains('hidden')) {
            container.innerHTML = '';
            return;
        }
        
        if (this.currentEvents.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const upcomingEvents = this.getUpcomingEvents();
        
        if (upcomingEvents.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const currentEvent = upcomingEvents[this.currentEventIndex] || upcomingEvents[0];
        const daysLeft = this.getDaysUntilEvent(currentEvent.date);
        
        container.innerHTML = `
            <div class="flex flex-col gap-1 text-sm select-none max-w-xl">
                <!-- Línea 1: Título y fecha -->
                <div class="flex items-center gap-2">
                    <i data-lucide="calendar" class="w-4 h-4 text-blue-500 flex-shrink-0"></i>
                    <span class="font-semibold text-blue-600 dark:text-blue-300 flex-shrink-0">Próximo:</span>
                    <span class="truncate font-medium text-gray-900 dark:text-gray-100">${currentEvent.title}</span>
                    <span class="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 text-xs font-medium flex-shrink-0">
                        ${Math.abs(daysLeft)} ${daysLeft === 0 ? 'Hoy' : daysLeft === 1 ? 'día' : 'días'}
                    </span>
                </div>
                <!-- Línea 2: Descripción y navegación -->
                <div class="flex items-center gap-2 pl-6">
                    ${currentEvent.description ? `
                        <span class="truncate text-gray-600 dark:text-gray-400 text-xs">${currentEvent.description}</span>
                        <span class="text-gray-400 flex-shrink-0">•</span>
                    ` : ''}
                    <span class="text-gray-600 dark:text-gray-400 text-xs flex-shrink-0">${this.formatEventDate(currentEvent.date)}</span>
                    ${upcomingEvents.length > 1 ? `
                        <span class="text-gray-400 flex-shrink-0">|</span>
                        <button class="prev-event-btn p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex-shrink-0" title="Anterior">
                            <i data-lucide=\"chevron-left\" class=\"w-3 h-3\"></i>
                        </button>
                        <span class="text-blue-600 dark:text-blue-400 text-xs flex-shrink-0">${this.currentEventIndex + 1}/${upcomingEvents.length}</span>
                        <button class="next-event-btn p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex-shrink-0" title="Siguiente">
                            <i data-lucide=\"chevron-right\" class=\"w-3 h-3\"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Event listeners
        const prevBtn = container.querySelector('.prev-event-btn');
        const nextBtn = container.querySelector('.next-event-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousEvent());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextEvent());
        }
        
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Obtiene eventos próximos no completados (ordenados por fecha)
     */
    getUpcomingEvents() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        return this.currentEvents
            .filter(event => !event.completed && new Date(event.date) >= thirtyDaysAgo)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    /**
     * Calcula días hasta un evento
     */
    getDaysUntilEvent(eventDate) {
        const now = new Date();
        const event = new Date(eventDate);
        const diffTime = event.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Formatea fecha del evento (formato: "Martes 7 de octubre, 13:35")
     */
    formatEventDate(dateString) {
        const date = new Date(dateString);
        const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
        const day = date.getDate();
        const month = date.toLocaleDateString('es-ES', { month: 'long' });
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        // Capitalizar primera letra del día de la semana
        const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        
        return `${weekdayCapitalized} ${day} de ${month}, ${hours}:${minutes}`;
    }
    
    /**
     * Navega al evento anterior
     */
    previousEvent() {
        const upcomingEvents = this.getUpcomingEvents();
        if (upcomingEvents.length <= 1) return;
        
        this.currentEventIndex = (this.currentEventIndex - 1 + upcomingEvents.length) % upcomingEvents.length;
        this.renderEventsWidget();
    }
    
    /**
     * Navega al evento siguiente
     */
    nextEvent() {
        const upcomingEvents = this.getUpcomingEvents();
        if (upcomingEvents.length <= 1) return;
        
        this.currentEventIndex = (this.currentEventIndex + 1) % upcomingEvents.length;
        this.renderEventsWidget();
    }
    
    /**
     * Muestra modal para gestionar eventos
     */
    showEventsModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Gestionar Eventos</h3>
                    <button class="close-modal-btn p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <!-- Botón crear evento -->
                <button id="create-event-btn" class="w-full mb-4 flex items-center justify-center gap-2 text-sm py-3 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                    <i data-lucide="calendar-plus" class="w-4 h-4"></i>
                    Crear Nuevo Evento
                </button>
                
                <!-- Lista de eventos -->
                <div id="events-list" class="space-y-3">
                    ${this.renderEventsList()}
                </div>
                
                <div class="flex justify-end mt-6">
                    <button class="cancel-events-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeBtn = modal.querySelector('.close-modal-btn');
        const cancelBtn = modal.querySelector('.cancel-events-btn');
        const createBtn = modal.getElementById('create-event-btn');
        
        const closeModal = () => document.body.removeChild(modal);
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        createBtn.addEventListener('click', () => {
            closeModal();
            this.showCreateEventModal();
        });
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Renderiza la lista de eventos
     */
    renderEventsList() {
        if (this.currentEvents.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i data-lucide="calendar" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>No hay eventos creados</p>
                    <p class="text-sm">Crea tu primer evento para comenzar</p>
                </div>
            `;
        }
        
        return this.currentEvents.map(event => {
            const daysLeft = this.getDaysUntilEvent(event.date);
            const isPast = daysLeft < 0;
            
            return `
                <div class="event-item p-4 border border-gray-200 dark:border-gray-600 rounded-lg ${isPast ? 'opacity-60' : ''}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-900 dark:text-white">${event.title}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${this.formatEventDate(event.date)}</p>
                            ${event.description ? `<p class="text-sm text-gray-500 dark:text-gray-500 mt-2">${event.description}</p>` : ''}
                        </div>
                        <div class="flex items-center gap-2 ml-4">
                            <div class="text-right">
                                <div class="text-sm font-medium ${isPast ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}">${Math.abs(daysLeft)} días</div>
                                <div class="text-xs text-gray-400">${isPast ? 'pasado' : 'restantes'}</div>
                            </div>
                            <button class="delete-event-btn p-1 text-gray-400 hover:text-red-500" data-event-id="${event.id}" title="Eliminar evento">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Muestra modal para crear evento
     */
    showCreateEventModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Crear Nuevo Evento</h3>
                <form id="create-event-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Título del evento
                        </label>
                        <input 
                            type="text" 
                            id="event-title"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ej: Examen Final, Entrega de Proyecto..."
                            required
                            maxlength="100"
                        >
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fecha y hora
                        </label>
                        <input 
                            type="datetime-local" 
                            id="event-date"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        >
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de evento
                        </label>
                        <select 
                            id="event-type"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="exam">Examen</option>
                            <option value="assignment">Entrega</option>
                            <option value="class">Clase Extra</option>
                            <option value="presentation">Presentación</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea 
                            id="event-description"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Detalles adicionales del evento..."
                            rows="3"
                            maxlength="500"
                        ></textarea>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" class="cancel-create-event-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Crear Evento
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Establecer fecha mínima como hoy
        const dateInput = modal.getElementById('event-date');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateInput.min = now.toISOString().slice(0, 16);
        
        // Event listeners
        const form = modal.getElementById('create-event-form');
        const cancelBtn = modal.querySelector('.cancel-create-event-btn');
        
        const closeModal = () => document.body.removeChild(modal);
        
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = modal.getElementById('event-title').value.trim();
            const date = modal.getElementById('event-date').value;
            const type = modal.getElementById('event-type').value;
            const description = modal.getElementById('event-description').value.trim();
            
            if (!title || !date) {
                this.notifications.error('Título y fecha son requeridos');
                return;
            }
            
            try {
                // Obtener el ID de la materia actual desde el contexto
                const subjectId = this.getCurrentSubjectId();
                if (!subjectId) {
                    this.notifications.error('No se pudo determinar la materia actual');
                    return;
                }
                
                this.dataManager.createEvent(subjectId, {
                    title,
                    date: new Date(date).toISOString(),
                    type,
                    description
                });
                
                this.notifications.success('Evento creado correctamente');
                closeModal();
                
            } catch (error) {
                console.error('Error creando evento:', error);
                this.notifications.error('Error al crear el evento');
            }
        });
        
        // Focus en el input
        modal.getElementById('event-title').focus();
    }
    
    /**
     * Obtiene el ID de la materia actual
     */
    getCurrentSubjectId() {
        // Buscar en el contexto actual de la aplicación
        const titleElement = document.getElementById('study-view-title');
        if (titleElement && titleElement.dataset.subjectId) {
            return titleElement.dataset.subjectId;
        }
        
        // Fallback: buscar en localStorage o contexto global
        const currentData = JSON.parse(localStorage.getItem('cuaderno_inteligente') || '{}');
        if (currentData.subjects && Object.keys(currentData.subjects).length > 0) {
            return Object.keys(currentData.subjects)[0]; // Usar la primera materia como fallback
        }
        
        return null;
    }
}

export default EventsManager;
