/**
 * Vista de Temas - Diseño moderno con acordeones y Pomodoro
 */
import PomodoroManager from '../components/PomodoroManager.js';

class TopicsView {
    constructor(dataManager, router, notifications, quizManager = null) {
        this.dataManager = dataManager;
        this.router = router;
        this.notifications = notifications;
        this.quizManager = quizManager;
        
        this.container = document.getElementById('topics-view');
        this.currentSubject = null;
        this.resourceManager = null; // Se inicializará cuando sea necesario
        this.pomodoroManager = new PomodoroManager(dataManager, notifications);
        
        this.initializeEventListeners();
        this.setupDataListeners();
    }
    
    /**
     * Inicializa event listeners de la vista
     */
    initializeEventListeners() {
        // Los event listeners se configuran dinámicamente en render
    }
    
    /**
     * Configura listeners para cambios de datos
     */
    setupDataListeners() {
        this.dataManager.on('topicCreated', () => {
            if (this.currentSubject) this.render(this.currentSubject);
        });
        this.dataManager.on('topicUpdated', () => {
            if (this.currentSubject) this.render(this.currentSubject);
        });
        this.dataManager.on('topicDeleted', () => {
            if (this.currentSubject) this.render(this.currentSubject);
        });
        this.dataManager.on('subtaskCompleted', () => {
            if (this.currentSubject) this.render(this.currentSubject);
        });
        this.dataManager.on('eventCompleted', () => {
            if (this.currentSubject) this.render(this.currentSubject);
        });
        this.dataManager.on('resourceAdded', () => {
            if (this.currentSubject) this.render(this.currentSubject);
        });
        this.dataManager.on('resourceDeleted', () => {
            if (this.currentSubject) this.render(this.currentSubject);
        });
        this.dataManager.on('topicPositionsUpdated', () => {
            if (this.currentSubject) {
                this.render(this.currentSubject);
                this.notifications.success('Temas reordenados correctamente');
            }
        });
    }
    
    /**
     * Renderiza la vista de temas con diseño moderno
     */
    render(subject) {
        if (!subject || !this.container) return;
        
        // Si solo recibimos un ID, cargar el objeto completo
        if (subject.id && !subject.name) {
            const fullSubject = this.dataManager.getSubjects().find(s => s.id === subject.id);
            if (!fullSubject) {
                console.warn('Materia no encontrada, regresando al dashboard');
                this.router.navigateTo('dashboard');
                return;
            }
            subject = fullSubject;
        }
        
        // Limpiar contenedor primero
        this.container.innerHTML = '';
        
        this.currentSubject = subject;
        
        // Obtener datos necesarios
        const topics = this.dataManager.getTopics(subject.id);
        const resources = this.dataManager.data.resources[subject.id] || [];
        const events = this.getSubjectEvents(subject.id);
        const progress = this.calculateSubjectProgress(subject.id);
        
        // Renderizar vista completa
        this.container.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <!-- Navegación y Encabezado -->
                ${this.renderHeader(subject, progress)}
                
                <!-- Contenido de la Materia -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Columna principal de Temas (2/3) -->
                    <div class="lg:col-span-2">
                        ${this.renderTopicsSection(topics)}
                    </div>
                    
                    <!-- Columna lateral -->
                    <aside class="lg:col-span-1 space-y-4 lg:border-l lg:border-slate-700/50 lg:pl-6">
                        ${this.renderStudySection(subject)}
                        ${this.renderResourcesSection(resources, subject.id)}
                        ${this.renderEventsSection(events, subject.id)}
                    </aside>
                </div>
            </div>
        `;
        
        // Configurar event listeners
        this.attachEventListeners();
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Renderiza el encabezado de la vista
     */
    renderHeader(subject, progress) {
        return `
            <header class="mb-8">
                <!-- Migas de pan (Breadcrumbs) -->
                <nav class="flex items-center text-sm text-slate-400 mb-4">
                    <button id="back-to-dashboard" class="hover:text-indigo-400 transition-colors">Mis Cuadernos</button>
                    <i data-lucide="chevron-right" class="w-4 h-4 mx-1"></i>
                    <span class="font-semibold text-white">${subject.name}</span>
                </nav>

                <!-- Título y Acciones -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-white">${subject.name}</h1>
                        <p class="text-slate-400 mt-1">${subject.description || 'Sin descripción'}</p>
                    </div>
                </div>

                <!-- Barra de Progreso General -->
                <div class="mt-6">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-medium text-slate-400">Progreso General</span>
                        <span class="text-sm font-bold text-white">${progress}%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-2.5">
                        <div class="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                </div>
            </header>
        `;
    }
    
    /**
     * Renderiza la sección de temas con acordeones
     */
    renderTopicsSection(topics) {
        if (topics.length === 0) {
            return `
                <div class="text-center py-12">
                    <div class="inline-block p-6 bg-slate-800/50 rounded-full mb-4">
                        <i data-lucide="folder-open" class="w-12 h-12 text-slate-400"></i>
                    </div>
                    <h3 class="text-lg font-medium text-white mb-2">No hay temas aún</h3>
                    <p class="text-slate-400 mb-6">Comienza creando tu primer tema</p>
                    <button id="add-first-topic-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        <i data-lucide="plus" class="w-4 h-4 inline mr-2"></i>
                        Crear primer tema
                    </button>
                </div>
            `;
        }
        
        const topicsHtml = topics.map((topic, index) => this.renderTopicAccordion(topic, index)).join('');
        
        return `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold text-white">Temario</h2>
                <button id="add-topic-btn" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                    <i data-lucide="plus" class="w-5 h-5"></i>
                    <span>Añadir Tema</span>
                </button>
            </div>
            <div class="space-y-3">
                ${topicsHtml}
            </div>
        `;
    }
    
    /**
     * Renderiza un acordeón de tema
     */
    renderTopicAccordion(topic, index) {
        const subtasks = this.getTopicSubtasks(topic.id);
        const completedCount = subtasks.filter(s => s.completed).length;
        const totalCount = subtasks.length;
        const nextSubtask = subtasks.find(s => !s.completed);
        const isOpen = index === 0 && nextSubtask; // Abrir el primer tema si tiene siguiente tarea
        
        const iconColors = ['indigo', 'emerald', 'amber', 'rose', 'purple', 'cyan'];
        const iconColor = iconColors[index % iconColors.length];
        const icons = ['function-square', 'git-commit-vertical', 'area-chart', 'trending-up', 'layers', 'zap'];
        const icon = icons[index % icons.length];
        
        const subtasksHtml = subtasks.map(subtask => this.renderSubtask(subtask, nextSubtask?.id === subtask.id)).join('');
        
        return `
            <details class="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden" ${isOpen ? 'open' : ''}>
                <summary class="group p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800">
                    <div class="flex items-center gap-4">
                        <div class="p-2 bg-${iconColor}-500/20 rounded-lg">
                            <i data-lucide="${icon}" class="w-6 h-6 text-${iconColor}-400"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-lg text-white">${index + 1}. ${topic.name}</h3>
                            <p class="text-sm text-slate-400">${completedCount} de ${totalCount} temas completados</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="study-topic-btn px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5" title="Estudiar este tema" data-topic-id="${topic.id}">
                            <i data-lucide="book-open" class="w-4 h-4"></i>
                            <span>Estudiar</span>
                        </button>
                        <button class="add-subtask-btn opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-700" title="Añadir subtema" data-topic-id="${topic.id}">
                            <i data-lucide="plus" class="w-4 h-4 text-slate-400"></i>
                        </button>
                        <button class="delete-topic-btn opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-700 hover:text-red-400" title="Eliminar tema" data-topic-id="${topic.id}">
                            <i data-lucide="trash-2" class="w-4 h-4 text-slate-400"></i>
                        </button>
                        <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-200"></i>
                    </div>
                </summary>
                <div class="px-5 pb-5 pt-2 border-t border-slate-700">
                    <ul class="space-y-3">
                        ${subtasksHtml}
                    </ul>
                </div>
            </details>
        `;
    }
    
    /**
     * Renderiza una subtarea
     */
    renderSubtask(subtask, isNext = false) {
        const containerClass = isNext 
            ? 'p-3 rounded-md bg-indigo-600/20 border border-indigo-500/50'
            : 'p-3 rounded-md hover:bg-slate-700/50';
        
        const statusText = subtask.completed ? 'Completado' : (isNext ? 'Siguiente' : '');
        const statusClass = subtask.completed ? 'text-slate-500' : (isNext ? 'text-indigo-400 font-semibold' : 'text-slate-500');
        const textClass = isNext ? 'font-semibold text-white' : 'text-slate-300';
        
        return `
            <li class="flex items-center justify-between ${containerClass} group">
                <div class="flex items-center gap-3 flex-1 cursor-pointer" data-subtask-id="${subtask.id}">
                    <input type="checkbox" class="custom-checkbox appearance-none w-5 h-5 rounded-md border-2 border-slate-600 bg-slate-900 transition" ${subtask.completed ? 'checked' : ''}>
                    <span class="${textClass}">${subtask.name}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs ${statusClass}">${statusText}</span>
                    <button class="delete-subtask-btn opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-700 hover:text-red-400" data-subtask-id="${subtask.id}" title="Eliminar subtarea">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </li>
        `;
    }
    
    /**
     * Renderiza la sección de estudio
     */
    renderStudySection(subject) {
        return `
            <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <h2 class="text-base font-semibold text-white mb-3">Empezar a Estudiar</h2>
                <div class="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-4 rounded-xl text-center border border-indigo-700/50">
                    <div class="w-12 h-12 mx-auto mb-2 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <i data-lucide="book-open" class="w-6 h-6 text-indigo-400"></i>
                    </div>
                    <h3 class="text-base font-bold text-white mb-1">${subject.name}</h3>
                    <p class="text-xs text-slate-400">Accede a tus temas y recursos de estudio</p>
                </div>
                <button id="enter-study-btn" class="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                    <span>Entrar a Estudiar</span>
                </button>
                
                ${this.quizManager ? `
                    <button id="create-quiz-btn" class="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                        <i data-lucide="brain" class="w-5 h-5"></i>
                        <span>Crear Preguntas</span>
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Renderiza la sección de recursos
     */
    renderResourcesSection(resources, subjectId) {
        const resourcesList = resources.slice(0, 3).map(resource => {
            const icon = this.getResourceIcon(resource.type);
            const color = this.getResourceColor(resource.type);
            
            return `
                <li class="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/70 hover:bg-slate-900 transition-colors group">
                    <div class="flex items-center gap-2 flex-1 cursor-pointer" data-resource-id="${resource.id}">
                        <i data-lucide="${icon}" class="w-4 h-4 ${color}"></i>
                        <span class="text-slate-300 text-sm truncate">${resource.name}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button class="delete-resource-btn opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 hover:text-red-400 transition-all" data-resource-id="${resource.id}" title="Eliminar recurso">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-500 hover:text-white"></i>
                    </div>
                </li>
            `;
        }).join('');
        
        return `
            <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <h2 class="text-base font-semibold text-white mb-3">Recursos</h2>
                ${resources.length > 0 ? `
                    <ul class="space-y-2 mb-3">
                        ${resourcesList}
                    </ul>
                    ${resources.length > 3 ? `<p class="text-xs text-slate-400 mb-3">Y ${resources.length - 3} más...</p>` : ''}
                ` : `
                    <div class="text-center py-3 text-slate-500">
                        <i data-lucide="folder-x" class="w-6 h-6 mx-auto mb-1 opacity-50"></i>
                        <p class="text-xs">No hay recursos</p>
                    </div>
                `}
                <button id="add-resource-btn" class="w-full flex items-center justify-center gap-2 py-2 bg-slate-700/70 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                    <i data-lucide="plus" class="w-5 h-5"></i>
                    <span>Añadir Recurso</span>
                </button>
            </div>
        `;
    }
    
    /**
     * Renderiza la sección de eventos
     */
    renderEventsSection(events, subjectId) {
        // Mostrar TODOS los eventos (completados y no completados)
        const allEvents = events.slice(0, 5);
        
        const eventsList = allEvents.map(event => {
            const date = new Date(event.date);
            const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
            const day = date.getDate();
            const color = this.getEventColor(event.type);
            const isCompleted = event.completed;
            
            return `
                <li class="flex items-center gap-3 group ${isCompleted ? 'opacity-60' : ''}">
                    <div class="flex flex-col items-center justify-center w-10 h-10 ${color}/20 text-${color} rounded-lg ${isCompleted ? 'opacity-50' : ''}">
                        <span class="text-[10px]">${month}</span>
                        <span class="font-bold text-sm">${day}</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-sm text-white ${isCompleted ? 'line-through' : ''}">${event.title}</h4>
                        <p class="text-xs text-slate-400 ${isCompleted ? 'line-through' : ''}">${this.getEventTypeName(event.type)}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="checkbox" class="event-checkbox w-4 h-4 rounded border-slate-600 bg-slate-900" data-event-id="${event.id}" ${isCompleted ? 'checked' : ''}>
                        <button class="delete-event-btn opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 hover:text-red-400 transition-all" data-event-id="${event.id}" title="Eliminar evento">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');
        
        return `
            <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-base font-semibold text-white">Próximas Entregas</h2>
                    <button id="manage-events-btn" class="text-slate-400 hover:text-white transition-colors" title="Gestionar eventos">
                        <i data-lucide="settings" class="w-4 h-4"></i>
                    </button>
                </div>
                ${allEvents.length > 0 ? `
                    <ul class="space-y-3">
                        ${eventsList}
                    </ul>
                ` : `
                    <div class="text-center py-3 text-slate-500">
                        <i data-lucide="calendar-x" class="w-6 h-6 mx-auto mb-1 opacity-50"></i>
                        <p class="text-xs">No hay entregas próximas</p>
                    </div>
                `}
            </div>
        `;
    }
    
    /**
     * Crea una tarjeta de tema
     */
    createTopicCard(topic) {
        const pagesCount = this.dataManager.getPages(topic.id).length;
        
        // Este método ya no se usa en el nuevo diseño
        return '';
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
     * Selecciona un tema y navega a la vista de estudio
     */
    selectTopic(topicId) {
        try {
            const topic = this.dataManager.getTopic(topicId);
            if (!topic) {
                throw new Error('Tema no encontrado');
            }
            
            this.router.navigateTo('study', {
                subject: this.currentSubject,
                topic: topic
            });
        } catch (error) {
            console.error('Error seleccionando tema:', error);
            this.notifications.error('Error al abrir el tema');
        }
    }
    
    /**
     * Muestra modal para gestionar eventos de la materia
     */
    showEventsModal() {
        if (!this.currentSubject) {
            this.notifications.error('No hay materia seleccionada');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl border border-slate-700 max-h-[80vh] overflow-hidden flex flex-col">
                <div class="p-6 border-b border-slate-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">
                            Eventos de ${this.currentSubject.name}
                        </h3>
                        <button id="close-events-modal" class="text-slate-400 hover:text-white transition-colors">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                    
                    <button id="create-event-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Crear Evento</span>
                    </button>
                </div>
                
                <div class="p-6 overflow-y-auto flex-1">
                    <div id="events-list" class="space-y-3">
                        <!-- Lista de eventos se renderizará aquí -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners - después de añadir al DOM
        const closeBtn = document.getElementById('close-events-modal');
        const createBtn = document.getElementById('create-event-btn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                this.showCreateEventModal();
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Renderizar eventos existentes
        const eventsList = document.getElementById('events-list');
        if (eventsList) {
            this.renderEventsList(eventsList);
        }

        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Renderiza la lista de eventos
     */
    renderEventsList(container) {
        const events = this.dataManager.getEvents(this.currentSubject.id) || [];
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-400">
                    <i data-lucide="calendar" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>No hay eventos creados para esta materia</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="bg-slate-900/70 rounded-lg p-4 flex items-center justify-between hover:bg-slate-900 transition-colors">
                <div class="flex-1">
                    <h4 class="font-semibold text-white">${event.title}</h4>
                    <p class="text-sm text-slate-400 mt-1">${event.description || 'Sin descripción'}</p>
                    <p class="text-xs text-slate-500 mt-2">
                        ${new Date(event.date).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full bg-${this.getEventColor(event.type)}/20 text-${this.getEventColor(event.type)}">
                        ${this.getEventTypeName(event.type)}
                    </span>
                    <button class="delete-event-btn text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-700 transition-colors" data-event-id="${event.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();

        // Event listeners para eliminar eventos
        container.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.currentTarget.dataset.eventId;
                const event = events.find(ev => ev.id === eventId);
                
                this.showConfirmModal(
                    '¿Eliminar este evento?',
                    `Se eliminará "${event?.title || 'este evento'}". Esta acción no se puede deshacer.`,
                    () => {
                        this.dataManager.deleteEvent(this.currentSubject.id, eventId);
                        this.renderEventsList(container);
                        this.notifications.success('Evento eliminado');
                    }
                );
            });
        });
    }

    /**
     * Muestra modal para crear evento
     */
    showCreateEventModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-white mb-4">Crear Evento</h3>
                    <form id="create-event-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Título del evento
                            </label>
                            <input type="text" id="event-title" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Examen Final" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Tipo de evento
                            </label>
                            <select id="event-type" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="exam">Examen</option>
                                <option value="assignment">Entrega</option>
                                <option value="presentation">Presentación</option>
                                <option value="class">Clase Extra</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Fecha y hora
                            </label>
                            <input type="datetime-local" id="event-date" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Descripción (opcional)
                            </label>
                            <textarea id="event-description" rows="3" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Detalles del evento..."></textarea>
                        </div>
                        <div class="flex justify-end gap-3">
                            <button type="button" id="cancel-event" class="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Crear Evento
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Establecer fecha mínima (hoy)
        const dateInput = document.getElementById('event-date');
        if (dateInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            dateInput.min = now.toISOString().slice(0, 16);
        }

        // Event listeners - después de añadir al DOM
        const cancelBtn = document.getElementById('cancel-event');
        const form = document.getElementById('create-event-form');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const titleInput = document.getElementById('event-title');
                const typeSelect = document.getElementById('event-type');
                const dateInput = document.getElementById('event-date');
                const descTextarea = document.getElementById('event-description');
                
                const title = titleInput ? titleInput.value.trim() : '';
                const type = typeSelect ? typeSelect.value : 'other';
                const date = dateInput ? dateInput.value : '';
                const description = descTextarea ? descTextarea.value.trim() : '';

                if (!title || !date) {
                    this.notifications.error('Título y fecha son requeridos');
                    return;
                }

                try {
                    this.dataManager.addEvent(this.currentSubject.id, {
                        title,
                        type,
                        date: new Date(date).toISOString(),
                        description
                    });
                    this.notifications.success('Evento creado correctamente');
                    document.body.removeChild(modal);
                    // Actualizar la vista para mostrar el nuevo evento
                    this.render(this.currentSubject);
                } catch (error) {
                    this.notifications.error('Error al crear el evento');
                    console.error(error);
                }
            });
        }

        // Focus en el input
        const titleInput = document.getElementById('event-title');
        if (titleInput) {
            titleInput.focus();
        }
    }

    /**
     * Obtiene el color para el tipo de evento
     */
    getEventTypeColor(type) {
        const colors = {
            exam: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            assignment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            presentation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        };
        return colors[type] || colors.other;
    }

    /**
     * Obtiene el nombre del tipo de evento
     */
    getEventTypeName(type) {
        const names = {
            exam: 'Examen',
            assignment: 'Entrega',
            class: 'Clase Extra',
            presentation: 'Presentación',
            other: 'Otro'
        };
        return names[type] || 'Otro';
    }
    showCreateModal() {
        if (!this.currentSubject) {
            this.notifications.error('No hay materia seleccionada');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Nuevo Tema</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Crear tema en: <strong>${this.currentSubject.name}</strong>
                </p>
                <form id="create-topic-form">
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre del tema
                        </label>
                        <input 
                            type="text" 
                            id="topic-name"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ej: Introducción, Capítulo 1..."
                            required
                            maxlength="100"
                        >
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-create" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            Crear Tema
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = document.getElementById('cancel-create');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        const form = document.getElementById('create-topic-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const nameInput = document.getElementById('topic-name');
                const name = nameInput ? nameInput.value.trim() : '';
                
                if (!name) {
                    this.notifications.error('El nombre del tema es requerido');
                    return;
                }
                
                try {
                    this.dataManager.createTopic({
                        subjectId: this.currentSubject.id,
                        name
                    });
                    
                    this.notifications.success('Tema creado correctamente');
                    document.body.removeChild(modal);
                    
                } catch (error) {
                    this.notifications.error('Error al crear el tema');
                    console.error(error);
                }
            });
        }
        
        // Focus en el input
        const nameInput = document.getElementById('topic-name');
        if (nameInput) nameInput.focus();
    }
    
    // ==================== MÉTODOS AUXILIARES ====================
    
    /**
     * Adjunta event listeners después del render
     */
    attachEventListeners() {
        // Navegación
        const backBtn = this.container.querySelector('#back-to-dashboard');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.router.navigateTo('dashboard'));
        }
        
        // Botones principales
        const addTopicBtn = this.container.querySelector('#add-topic-btn');
        if (addTopicBtn) {
            addTopicBtn.addEventListener('click', () => this.showCreateTopicModal());
        }
        
        const addFirstTopicBtn = this.container.querySelector('#add-first-topic-btn');
        if (addFirstTopicBtn) {
            addFirstTopicBtn.addEventListener('click', () => this.showCreateTopicModal());
        }
        
        const enterStudyBtn = this.container.querySelector('#enter-study-btn');
        if (enterStudyBtn) {
            enterStudyBtn.addEventListener('click', () => this.enterStudyView());
        }
        
        // Botón crear preguntas
        const createQuizBtn = this.container.querySelector('#create-quiz-btn');
        if (createQuizBtn && this.quizManager) {
            createQuizBtn.addEventListener('click', () => this.showCreateQuizModal());
        }
        
        // Subtareas checkboxes
        this.container.querySelectorAll('[data-subtask-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                const subtaskId = item.dataset.subtaskId;
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                this.toggleSubtask(subtaskId, checkbox.checked);
            });
        });
        
        // Eventos checkboxes
        this.container.querySelectorAll('.event-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const eventId = e.target.dataset.eventId;
                this.completeEvent(eventId, e.target.checked);
            });
        });
        
        // Botones de eliminar eventos
        this.container.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = btn.dataset.eventId;
                this.deleteEventFromList(eventId);
            });
        });
        
        // Recursos
        const addResourceBtn = this.container.querySelector('#add-resource-btn');
        if (addResourceBtn) {
            addResourceBtn.addEventListener('click', () => this.showAddResourceModal());
        }
        
        // Eliminar recursos PRIMERO (antes de los clicks de recursos)
        this.container.querySelectorAll('.delete-resource-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const resourceId = btn.dataset.resourceId;
                this.showDeleteResourceConfirm(resourceId);
            });
        });
        
        // Recursos (después de eliminar)
        this.container.querySelectorAll('[data-resource-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                // No abrir si se hizo clic en el botón de eliminar
                if (e.target.closest('.delete-resource-btn')) return;
                
                const resourceId = item.dataset.resourceId;
                this.openResource(resourceId);
            });
        });
        
        // Gestión de eventos - Botón settings abre modal de gestión
        const manageEventsBtn = this.container.querySelector('#manage-events-btn');
        if (manageEventsBtn) {
            manageEventsBtn.addEventListener('click', () => this.showEventsModal());
        }
        
        // Añadir subtareas
        this.container.querySelectorAll('.add-subtask-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const topicId = btn.dataset.topicId;
                this.showAddSubtaskModal(topicId);
            });
        });
        
        // Botones de estudiar tema específico
        this.container.querySelectorAll('.study-topic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const topicId = btn.dataset.topicId;
                this.enterStudyView(topicId);
            });
        });
        
        // Eliminar temas
        this.container.querySelectorAll('.delete-topic-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const topicId = btn.dataset.topicId;
                this.showDeleteTopicConfirm(topicId);
            });
        });
        
        // Eliminar subtareas
        this.container.querySelectorAll('.delete-subtask-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subtaskId = btn.dataset.subtaskId;
                this.showDeleteSubtaskConfirm(subtaskId);
            });
        });
        
        // Drag and drop para reordenar temas
        this.initializeDragAndDrop();
    }
    
    /**
     * Inicializa el sistema de drag and drop para reordenar temas
     */
    initializeDragAndDrop() {
        const topicElements = this.container.querySelectorAll('details');
        
        topicElements.forEach((topicElement, index) => {
            // Hacer el elemento arrastrable
            topicElement.draggable = true;
            topicElement.dataset.dragIndex = index;
            topicElement.style.cursor = 'grab';
            
            // Prevenir que el summary interfiera con drag and drop
            const summary = topicElement.querySelector('summary');
            if (summary) {
                summary.addEventListener('dragstart', (e) => {
                    e.stopPropagation();
                });
                summary.addEventListener('click', (e) => {
                    // Solo permitir click si no hay drag activo
                    if (this.draggedElement) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }
            
            // Event listeners para drag and drop
            topicElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
            topicElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
            topicElement.addEventListener('dragover', (e) => this.handleDragOver(e));
            topicElement.addEventListener('drop', (e) => this.handleDrop(e));
            topicElement.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            topicElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }
    
    /**
     * Maneja el inicio del arrastre
     */
    handleDragStart(e) {
        this.draggedElement = e.target;
        this.draggedIndex = parseInt(e.target.dataset.dragIndex);
        e.target.classList.add('opacity-50', 'scale-95');
        e.target.style.cursor = 'grabbing';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }
    
    /**
     * Maneja el fin del arrastre
     */
    handleDragEnd(e) {
        e.target.classList.remove('opacity-50', 'scale-95');
        e.target.style.cursor = 'grab';
        this.draggedElement = null;
        
        // Remover todos los indicadores visuales
        this.container.querySelectorAll('.drag-target-above, .drag-target-below').forEach(el => {
            this.clearDragStyles(el);
        });
    }
    
    /**
     * Maneja cuando se arrastra sobre un elemento
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    /**
     * Maneja cuando entra en un elemento durante el arrastre
     */
    handleDragEnter(e) {
        e.preventDefault();
        
        const target = e.currentTarget;
        if (target === this.draggedElement) return;
        
        // Limpiar cualquier indicador anterior en otros elementos
        this.container.querySelectorAll('.drag-target-above, .drag-target-below').forEach(el => {
            if (el !== target) {
                this.clearDragStyles(el);
            }
        });
        
        // LÓGICA INTUITIVA: Determinar si insertar arriba o abajo basado en la dirección del arrastre
        // Si el elemento arrastrado viene desde arriba (posición menor) → insertar abajo del target (movimiento hacia abajo)
        // Si el elemento arrastrado viene desde abajo (posición mayor) → insertar arriba del target (movimiento hacia arriba)
        const allTopics = Array.from(this.container.querySelectorAll('details'));
        const draggedIndex = this.draggedIndex;
        const targetIndex = allTopics.indexOf(target);
        
        // Movimiento hacia abajo: draggedIndex < targetIndex → insertar abajo del target
        // Movimiento hacia arriba: draggedIndex > targetIndex → insertar arriba del target
        const insertAbove = draggedIndex > targetIndex;
        
        // Solo aplicar si no está ya en este estado
        const isAlreadyAbove = target.classList.contains('drag-target-above');
        const isAlreadyBelow = target.classList.contains('drag-target-below');
        
        if (insertAbove && !isAlreadyBelow) {
            // Limpiar estado anterior
            target.classList.remove('drag-target-above');
            // Aplicar nuevo estado - INSERTAR ARRIBA (elemento destino se mueve abajo)
            target.classList.add('drag-target-below');
            target.style.position = 'relative';
            target.style.zIndex = '10';
            target.style.transition = 'all 0.15s ease-out';
            target.style.transform = 'translateY(1.5rem)'; // movimiento más pronunciado para "insertar arriba"
            target.style.borderTop = '3px solid #3b82f6';
            target.style.borderTopLeftRadius = '0.5rem';
            target.style.borderTopRightRadius = '0.5rem';
            target.style.boxShadow = '0 -6px 16px rgba(59, 130, 246, 0.2)';
        } else if (!insertAbove && !isAlreadyAbove) {
            // Limpiar estado anterior
            target.classList.remove('drag-target-below');
            // Aplicar nuevo estado - INSERTAR ABAJO (elemento destino se queda, borde abajo)
            target.classList.add('drag-target-above');
            target.style.position = 'relative';
            target.style.zIndex = '10';
            target.style.transition = 'all 0.15s ease-out';
            target.style.borderBottom = '3px solid #3b82f6';
            target.style.borderBottomLeftRadius = '0.5rem';
            target.style.borderBottomRightRadius = '0.5rem';
            target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.2)';
        }
    }
    
    /**
     * Maneja cuando sale de un elemento durante el arrastre
     */
    handleDragLeave(e) {
        const target = e.currentTarget;
        // Solo limpiar si realmente estamos saliendo del elemento (no moviéndonos a un elemento hijo)
        if (!target.contains(e.relatedTarget) && e.relatedTarget !== target) {
            this.clearDragStyles(target);
        }
    }
    
    /**
     * Maneja el soltar del elemento
     */
    handleDrop(e) {
        e.preventDefault();
        
        const target = e.currentTarget;
        if (target === this.draggedElement) return;
        
        // Obtener el contenedor de temas
        const topicContainer = target.parentElement;
        const allTopics = Array.from(topicContainer.querySelectorAll('details'));
        
        // Determinar posición de inserción usando la misma lógica intuitiva que dragEnter
        // Movimiento hacia abajo: draggedIndex < targetIndex → insertar abajo del target
        // Movimiento hacia arriba: draggedIndex > targetIndex → insertar arriba del target
        const targetIndex = allTopics.indexOf(target);
        const draggedIndex = this.draggedIndex;
        const insertBefore = draggedIndex > targetIndex;
        
        // Calcular nueva posición
        let newIndex;
        if (insertBefore) {
            newIndex = targetIndex;
        } else {
            newIndex = targetIndex + 1;
        }
        
        // Si la nueva posición es después del elemento arrastrado, ajustar
        if (newIndex > draggedIndex) {
            newIndex--;
        }
        
        // Reordenar elementos DOM
        const draggedElement = this.draggedElement;
        if (insertBefore) {
            topicContainer.insertBefore(draggedElement, target);
        } else {
            topicContainer.insertBefore(draggedElement, target.nextSibling);
        }
        
        // Actualizar posiciones en data
        this.updateTopicPositions();
        
        // Limpiar estado
        this.draggedElement = null;
        this.container.querySelectorAll('.drag-target-above, .drag-target-below').forEach(el => {
            this.clearDragStyles(el);
        });
    }
    
    /**
     * Limpia todos los estilos de drag and drop de un elemento
     */
    clearDragStyles(element) {
        element.classList.remove('drag-target-above', 'drag-target-below');
        element.style.position = '';
        element.style.zIndex = '';
        element.style.transition = '';
        element.style.transform = '';
        element.style.borderTop = '';
        element.style.borderBottom = '';
        element.style.borderTopLeftRadius = '';
        element.style.borderTopRightRadius = '';
        element.style.borderBottomLeftRadius = '';
        element.style.borderBottomRightRadius = '';
        element.style.boxShadow = '';
    }
    updateTopicPositions() {
        const topicElements = this.container.querySelectorAll('details');
        const topicPositions = [];
        
        topicElements.forEach((element, index) => {
            const topicId = element.querySelector('.add-subtask-btn')?.dataset.topicId;
            if (topicId) {
                topicPositions.push({ id: topicId, position: index });
            }
        });
        
        // Actualizar en DataManager
        this.dataManager.updateTopicPositions(this.currentSubject.id, topicPositions);
        
        // No re-renderizar aquí, el event listener lo hará
    }
    getTopicSubtasks(topicId) {
        return this.dataManager.data.subtasks?.[topicId] || [];
    }
    
    /**
     * Obtiene los eventos de una materia
     */
    getSubjectEvents(subjectId) {
        return this.dataManager.data.events?.[subjectId] || [];
    }
    
    /**
     * Calcula el progreso de una materia de forma robusta
     * Basado en subtareas completadas vs total de subtareas
     */
    calculateSubjectProgress(subjectId) {
        const topics = this.dataManager.getTopics(subjectId);
        
        // Si no hay temas, progreso es 0%
        if (!topics || topics.length === 0) return 0;
        
        let totalSubtasks = 0;
        let completedSubtasks = 0;
        
        // Iterar sobre cada tema y contar sus subtareas
        topics.forEach(topic => {
            const subtasks = this.getTopicSubtasks(topic.id);
            
            if (subtasks && subtasks.length > 0) {
                totalSubtasks += subtasks.length;
                
                // Contar subtareas completadas
                subtasks.forEach(subtask => {
                    if (subtask.completed === true) {
                        completedSubtasks++;
                    }
                });
            }
        });
        
        // Si no hay subtareas, el progreso es 0%
        if (totalSubtasks === 0) return 0;
        
        // Calcular porcentaje y redondear
        const percentage = (completedSubtasks / totalSubtasks) * 100;
        return Math.round(percentage);
    }
    
    /**
     * Navega a la vista de estudio
     * @param {string} topicId - ID del tema específico (opcional)
     */
    enterStudyView(topicId = null) {
        const topics = this.dataManager.getTopics(this.currentSubject.id);
        
        if (topics.length === 0) {
            this.notifications.warning('Crea un tema primero para comenzar a estudiar');
            return;
        }
        
        let selectedTopic;
        let studyMode;
        
        if (topicId) {
            // Modo: Estudiar tema específico
            selectedTopic = this.dataManager.getTopic(topicId);
            studyMode = 'topic';
            
            if (!selectedTopic) {
                this.notifications.error('Tema no encontrado');
                return;
            }
        } else {
            // Modo: Estudiar toda la materia
            selectedTopic = topics[0];
            studyMode = 'subject';
        }
        
        this.router.navigateTo('study', {
            subject: this.currentSubject,
            topic: selectedTopic,
            studyMode: studyMode
        });
    }
    
    
    /**
     * Alterna el estado de una subtarea y actualiza el progreso
     */
    toggleSubtask(subtaskId, completed) {
        if (!this.dataManager.data.subtasks) {
            this.dataManager.data.subtasks = {};
        }
        
        // Buscar la subtarea en todos los temas
        let found = false;
        Object.keys(this.dataManager.data.subtasks).forEach(topicId => {
            const subtasks = this.dataManager.data.subtasks[topicId];
            const subtask = subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.completed = completed;
                found = true;
            }
        });
        
        if (found) {
            this.dataManager.save();
            
            // Re-renderizar para actualizar progreso y contadores en tiempo real
            this.render(this.currentSubject);
            
            // Emitir evento para que otras vistas se actualicen (ej: Dashboard)
            this.dataManager.emit('progressUpdated', { 
                subjectId: this.currentSubject.id,
                progress: this.calculateSubjectProgress(this.currentSubject.id)
            });
            
            // Mostrar notificación
            if (completed) {
                this.notifications.success('Tarea marcada como completada ✓');
            }
        }
    }
    
    /**
     * Completa un evento y actualiza todas las vistas
     */
    completeEvent(eventId, completed) {
        const events = this.dataManager.data.events[this.currentSubject.id] || [];
        const event = events.find(e => e.id === eventId);
        
        if (event) {
            event.completed = completed;
            this.dataManager.save();
            
            // Emitir evento para que StudyView actualice el header
            this.dataManager.emit('eventCompleted', { 
                eventId, 
                completed,
                subjectId: this.currentSubject.id 
            });
            
            // Re-renderizar para actualizar la lista
            this.render(this.currentSubject);
            
            if (completed) {
                this.notifications.success(`Evento "${event.title}" completado ✓`);
            } else {
                this.notifications.success(`Evento "${event.title}" marcado como pendiente`);
            }
        }
    }
    
    /**
     * Elimina un evento de la lista
     */
    deleteEventFromList(eventId) {
        const events = this.dataManager.data.events[this.currentSubject.id] || [];
        const event = events.find(e => e.id === eventId);
        
        if (!event) return;
        
        this.showConfirmModal(
            '¿Eliminar este evento?',
            `Se eliminará "${event.title}". Esta acción no se puede deshacer.`,
            () => {
                // Eliminar evento
                this.dataManager.data.events[this.currentSubject.id] = events.filter(e => e.id !== eventId);
                this.dataManager.save();
                
                // Emitir evento para actualizar otras vistas
                this.dataManager.emit('eventDeleted', { 
                    eventId,
                    subjectId: this.currentSubject.id 
                });
                
                this.render(this.currentSubject);
                this.notifications.success('Evento eliminado correctamente');
            }
        );
    }
    
    /**
     * Muestra modal para crear tema
     */
    showCreateTopicModal() {
        // Reutilizar el modal existente
        this.showCreateModal();
    }
    
    /**
     * Muestra modal para añadir subtarea
     */
    showAddSubtaskModal(topicId) {
        const topic = this.dataManager.getTopic(topicId);
        if (!topic) return;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-white mb-2">Añadir Subtemas</h3>
                    <p class="text-sm text-slate-400 mb-4">Tema: <strong>${topic.name}</strong></p>
                    
                    <!-- Tabs -->
                    <div class="flex gap-2 mb-4 border-b border-slate-700">
                        <button id="tab-single" class="tab-btn px-4 py-2 text-sm font-medium text-white border-b-2 border-indigo-500">
                            Uno por uno
                        </button>
                        <button id="tab-batch" class="tab-btn px-4 py-2 text-sm font-medium text-slate-400 border-b-2 border-transparent hover:text-white">
                            En lote
                        </button>
                    </div>
                    
                    <form id="add-subtask-form">
                        <!-- Modo individual -->
                        <div id="single-mode">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Nombre del subtema
                                </label>
                                <input type="text" id="subtask-name" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 1.1 Introducción" required>
                            </div>
                        </div>
                        
                        <!-- Modo lote -->
                        <div id="batch-mode" class="hidden">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Pega tus subtemas (uno por línea)
                                </label>
                                <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-3 mb-2 text-xs text-slate-400">
                                    <p class="mb-1">Formato: Cada línea será un subtema</p>
                                    <p class="font-mono text-slate-500">1.1 Introducción<br>1.2 Conceptos básicos<br>1.3 Ejemplos</p>
                                </div>
                                <textarea id="subtasks-batch" class="w-full h-48 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none" placeholder="1.1 Introducción&#10;1.2 Conceptos básicos&#10;1.3 Ejemplos&#10;1.4 Ejercicios"></textarea>
                                <p class="text-xs text-slate-500 mt-1">
                                    <span id="subtask-count">0</span> subtemas detectados
                                </p>
                            </div>
                        </div>
                        
                        <div class="flex justify-end gap-3">
                            <button type="button" id="cancel-subtask" class="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                <span id="submit-text">Añadir</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const form = modal.querySelector('#add-subtask-form');
        const cancelBtn = modal.querySelector('#cancel-subtask');
        const nameInput = modal.querySelector('#subtask-name');
        const batchTextarea = modal.querySelector('#subtasks-batch');
        const singleMode = modal.querySelector('#single-mode');
        const batchMode = modal.querySelector('#batch-mode');
        const tabSingle = modal.querySelector('#tab-single');
        const tabBatch = modal.querySelector('#tab-batch');
        const subtaskCount = modal.querySelector('#subtask-count');
        const submitText = modal.querySelector('#submit-text');
        
        let currentMode = 'single';
        
        // Tabs
        tabSingle.addEventListener('click', () => {
            currentMode = 'single';
            singleMode.classList.remove('hidden');
            batchMode.classList.add('hidden');
            tabSingle.classList.add('text-white', 'border-indigo-500');
            tabSingle.classList.remove('text-slate-400', 'border-transparent');
            tabBatch.classList.remove('text-white', 'border-indigo-500');
            tabBatch.classList.add('text-slate-400', 'border-transparent');
            submitText.textContent = 'Añadir';
            nameInput.required = true;
        });
        
        tabBatch.addEventListener('click', () => {
            currentMode = 'batch';
            singleMode.classList.add('hidden');
            batchMode.classList.remove('hidden');
            tabBatch.classList.add('text-white', 'border-indigo-500');
            tabBatch.classList.remove('text-slate-400', 'border-transparent');
            tabSingle.classList.remove('text-white', 'border-indigo-500');
            tabSingle.classList.add('text-slate-400', 'border-transparent');
            nameInput.required = false;
            batchTextarea.focus();
        });
        
        // Contador de subtemas en modo lote
        batchTextarea.addEventListener('input', () => {
            const lines = batchTextarea.value.split('\n').filter(line => line.trim() !== '');
            subtaskCount.textContent = lines.length;
            submitText.textContent = lines.length > 0 ? `Añadir ${lines.length} subtema${lines.length !== 1 ? 's' : ''}` : 'Añadir';
        });
        
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (currentMode === 'single') {
                // Modo individual
                const name = nameInput.value.trim();
                
                if (!name) {
                    this.notifications.error('El nombre es requerido');
                    return;
                }
                
                this.addSubtask(topicId, name);
                this.notifications.success('Subtema añadido');
            } else {
                // Modo lote
                const text = batchTextarea.value.trim();
                
                if (!text) {
                    this.notifications.error('Pega al menos un subtema');
                    return;
                }
                
                const lines = text.split('\n').filter(line => line.trim() !== '');
                
                if (lines.length === 0) {
                    this.notifications.error('No se detectaron subtemas válidos');
                    return;
                }
                
                // Crear todos los subtemas
                lines.forEach(line => {
                    const name = line.trim();
                    if (name) {
                        this.addSubtask(topicId, name);
                    }
                });
                
                this.notifications.success(`${lines.length} subtema${lines.length !== 1 ? 's' : ''} añadido${lines.length !== 1 ? 's' : ''}`);
            }
            
            document.body.removeChild(modal);
        });
        
        nameInput.focus();
    }
    
    /**
     * Añade una subtarea a un tema
     */
    addSubtask(topicId, name) {
        if (!this.dataManager.data.subtasks) {
            this.dataManager.data.subtasks = {};
        }
        
        if (!this.dataManager.data.subtasks[topicId]) {
            this.dataManager.data.subtasks[topicId] = [];
        }
        
        const subtask = {
            id: 'subtask_' + Date.now(),
            name,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.dataManager.data.subtasks[topicId].push(subtask);
        this.dataManager.save();
        
        this.render(this.currentSubject);
        this.notifications.success('Subtema añadido correctamente');
    }
    
    /**
     * Muestra modal para añadir recurso
     */
    showAddResourceModal() {
        // Crear input de archivo dinámicamente
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,application/pdf,.txt,audio/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validar tamaño (20MB)
            if (file.size > 20 * 1024 * 1024) {
                this.notifications.error('El archivo es demasiado grande. Máximo 20MB');
                return;
            }
            
            try {
                // Convertir a base64
                const reader = new FileReader();
                reader.onload = (event) => {
                    const resource = {
                        id: `resource_${Date.now()}`,
                        name: file.name,
                        type: this.getFileType(file.type),
                        data: event.target.result,
                        size: file.size,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Guardar recurso
                    if (!this.dataManager.data.resources) {
                        this.dataManager.data.resources = {};
                    }
                    if (!this.dataManager.data.resources[this.currentSubject.id]) {
                        this.dataManager.data.resources[this.currentSubject.id] = [];
                    }
                    
                    this.dataManager.data.resources[this.currentSubject.id].push(resource);
                    this.dataManager.save();
                    this.dataManager.emit('resourceAdded', { subjectId: this.currentSubject.id, resource });
                    
                    this.render(this.currentSubject);
                    this.notifications.success('Recurso añadido correctamente');
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error al añadir recurso:', error);
                this.notifications.error('Error al añadir recurso');
            }
        });
        
        // Trigger click
        fileInput.click();
    }
    
    /**
     * Obtiene el tipo de archivo
     */
    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('text/')) return 'text';
        return 'file';
    }
    
    /**
     * Abre un recurso
     */
    openResource(resourceId) {
        if (!this.resourceManager) {
            import('../components/ResourceManager.js').then(module => {
                const ResourceManager = module.default;
                this.resourceManager = new ResourceManager(this.dataManager, this.notifications);
                this.resourceManager.currentTopicId = this.currentSubject.id;
                
                const resources = this.dataManager.data.resources[this.currentSubject.id] || [];
                const resource = resources.find(r => r.id === resourceId);
                if (resource) {
                    this.resourceManager.openResource(resource);
                }
            });
        } else {
            const resources = this.dataManager.data.resources[this.currentSubject.id] || [];
            const resource = resources.find(r => r.id === resourceId);
            if (resource) {
                this.resourceManager.openResource(resource);
            }
        }
    }
    
    // ==================== MÉTODOS DE UTILIDAD ====================
    
    /**
     * Obtiene el icono para un tipo de recurso
     */
    getResourceIcon(type) {
        const icons = {
            image: 'image',
            pdf: 'file-text',
            text: 'file-code',
            audio: 'music'
        };
        return icons[type] || 'file';
    }
    
    /**
     * Obtiene el color para un tipo de recurso
     */
    getResourceColor(type) {
        const colors = {
            image: 'text-purple-400',
            pdf: 'text-red-400',
            text: 'text-blue-400',
            audio: 'text-green-400'
        };
        return colors[type] || 'text-gray-400';
    }
    
    /**
     * Obtiene el color para un tipo de evento
     */
    getEventColor(type) {
        const colors = {
            exam: 'rose-500',
            assignment: 'sky-500',
            presentation: 'amber-500',
            class: 'emerald-500'
        };
        return colors[type] || 'gray-500';
    }
    
    /**
     * Obtiene el nombre del tipo de evento
     */
    getEventTypeName(type) {
        const names = {
            exam: 'Examen',
            assignment: 'Entrega',
            presentation: 'Presentación',
            class: 'Clase Extra'
        };
        return names[type] || 'Evento';
    }
    
    /**
     * Muestra modal de confirmación para eliminar tema
     */
    showDeleteTopicConfirm(topicId) {
        const topic = this.dataManager.getTopic(topicId);
        if (!topic) return;
        
        const subtasks = this.getTopicSubtasks(topicId);
        const subtaskCount = subtasks.length;
        
        this.showConfirmModal(
            '¿Eliminar este tema?',
            `Se eliminará "${topic.name}" y ${subtaskCount} subtarea(s). Esta acción no se puede deshacer.`,
            () => {
                this.dataManager.deleteTopic(topicId);
                // Eliminar también sus subtareas
                if (this.dataManager.data.subtasks && this.dataManager.data.subtasks[topicId]) {
                    delete this.dataManager.data.subtasks[topicId];
                    this.dataManager.save();
                }
                this.render(this.currentSubject);
                this.notifications.success('Tema eliminado correctamente');
            }
        );
    }
    
    /**
     * Muestra modal de confirmación para eliminar subtarea
     */
    showDeleteSubtaskConfirm(subtaskId) {
        // Buscar la subtarea
        let subtask = null;
        let topicId = null;
        
        Object.keys(this.dataManager.data.subtasks || {}).forEach(tid => {
            const found = this.dataManager.data.subtasks[tid].find(s => s.id === subtaskId);
            if (found) {
                subtask = found;
                topicId = tid;
            }
        });
        
        if (!subtask) return;
        
        this.showConfirmModal(
            '¿Eliminar esta subtarea?',
            `Se eliminará "${subtask.name}". Esta acción no se puede deshacer.`,
            () => {
                // Eliminar subtarea
                this.dataManager.data.subtasks[topicId] = this.dataManager.data.subtasks[topicId].filter(s => s.id !== subtaskId);
                this.dataManager.save();
                this.render(this.currentSubject);
                this.notifications.success('Subtarea eliminada correctamente');
            }
        );
    }
    
    /**
     * Muestra modal de confirmación para eliminar recurso
     */
    showDeleteResourceConfirm(resourceId) {
        const resources = this.dataManager.data.resources[this.currentSubject.id] || [];
        const resource = resources.find(r => r.id === resourceId);
        
        if (!resource) return;
        
        this.showConfirmModal(
            '¿Eliminar este recurso?',
            `Se eliminará "${resource.name}". Esta acción no se puede deshacer.`,
            () => {
                this.dataManager.data.resources[this.currentSubject.id] = resources.filter(r => r.id !== resourceId);
                this.dataManager.save();
                this.dataManager.emit('resourceDeleted', { subjectId: this.currentSubject.id, resourceId });
                this.render(this.currentSubject);
                this.notifications.success('Recurso eliminado correctamente');
            }
        );
    }
    
    /**
     * Muestra un modal de confirmación genérico con estilo bonito
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
    
    /**
     * Muestra modal para crear colección de quizzes
     */
    showCreateQuizModal() {
        if (!this.quizManager) {
            this.notifications.warning('Sistema de quizzes no disponible');
            return;
        }

        // Modal de selección con 2 pasos: Materias -> Temas
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.id = 'select-topic-modal';

        const renderSubjects = () => {
            const subjects = this.dataManager.getSubjects();
            return `
                <div class="p-6">
                    <label class="block text-sm font-semibold text-white mb-3">1. Selecciona la Materia</label>
                    <div class="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                        ${subjects.map(s => `
                            <button class="select-subject-btn text-left p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-all border-2 border-transparent hover:border-blue-500" data-subject-id="${s.id}">
                                <div class="font-semibold text-white">${s.name}</div>
                                <div class="text-xs text-slate-400 mt-1">${(this.dataManager.getTopics(s.id) || []).length} temas</div>
                            </button>
                        `).join('')}
                    </div>
                    <div class="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-700">
                        <button id="cancel-modal" class="px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                    </div>
                </div>`;
        };

        const renderTopics = (subject) => {
            const topics = this.dataManager.getTopics(subject.id) || [];
            return `
                <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                        <label class="block text-sm font-semibold text-white">2. Selecciona el Tema de <span class='text-blue-400'>${subject.name}</span></label>
                        <button id="back-to-subjects" class="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-xs">← Cambiar materia</button>
                    </div>
                    <div class="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                        ${topics.length > 0 ? topics.map(topic => `
                            <button class="select-topic-btn text-left p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-all border-2 border-transparent hover:border-blue-500" data-topic-id="${topic.id}">
                                <div class="font-semibold text-white">${topic.name}</div>
                                <div class="text-xs text-slate-400 mt-1">Click para crear preguntas en este tema</div>
                            </button>
                        `).join('') : `
                            <div class="text-center text-slate-500 py-8">
                                <p>Esta materia no tiene temas.</p>
                                <p class="text-xs mt-1">Crea un tema primero.</p>
                            </div>
                        `}
                    </div>
                    <div class="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-700">
                        <button id="cancel-modal" class="px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">Cancelar</button>
                    </div>
                </div>`;
        };

        modal.innerHTML = `
            <div class="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700">
                <div class="p-6 border-b border-slate-700">
                    <h3 class="text-2xl font-bold text-white mb-2">Crear Colección de Preguntas</h3>
                    <p class="text-sm text-slate-400">Selecciona la materia y luego el tema</p>
                </div>
                <div id="modal-step-container">
                    ${renderSubjects()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const stepContainer = modal.querySelector('#modal-step-container');

        const wireSubjectsStep = () => {
            stepContainer.querySelectorAll('.select-subject-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const subjectId = btn.dataset.subjectId;
                    const subject = this.dataManager.getSubjects().find(s => s.id === subjectId);
                    if (!subject) return;
                    stepContainer.innerHTML = renderTopics(subject);
                    wireTopicsStep(subject);
                });
            });
            const cancel = modal.querySelector('#cancel-modal');
            if (cancel) cancel.addEventListener('click', () => document.body.removeChild(modal));
        };

        const wireTopicsStep = (subject) => {
            stepContainer.querySelectorAll('.select-topic-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const selectedTopicId = btn.dataset.topicId;
                    const topic = (this.dataManager.getTopics(subject.id) || []).find(t => t.id === selectedTopicId);
                    if (!topic) return;
                    // Cerrar modal y abrir creador batch normal
                    document.body.removeChild(modal);
                    if (window.QuizCreatorModal) {
                        const quizModal = new window.QuizCreatorModal(this.quizManager, this.dataManager, this.notifications);
                        quizModal.show(selectedTopicId, topic.name);
                    } else {
                        this.notifications.error('Error: QuizCreatorModal no está disponible');
                    }
                });
            });
            const back = modal.querySelector('#back-to-subjects');
            if (back) back.addEventListener('click', () => {
                stepContainer.innerHTML = renderSubjects();
                wireSubjectsStep();
            });
            const cancel = modal.querySelector('#cancel-modal');
            if (cancel) cancel.addEventListener('click', () => document.body.removeChild(modal));
        };

        // Inicial step
        wireSubjectsStep();

        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

export default TopicsView;
