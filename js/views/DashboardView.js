/**
 * Vista de Dashboard - Página principal con resumen y estadísticas
 */
class DashboardView {
    constructor(dataManager, router, notifications, pomodoroManager, quizManager) {
        this.dataManager = dataManager;
        this.router = router;
        this.notifications = notifications;
        this.pomodoroManager = pomodoroManager;
        this.quizManager = quizManager;
        this.currentCalendarMonth = new Date().getMonth();
        this.currentCalendarYear = new Date().getFullYear();
        this.currentPeriodIndex = 0;
        
        this.container = document.getElementById('dashboard-view');
        this.initializeEventListeners();
        this.setupDataListeners();
    }
    
    /**
     * Inicializa event listeners del header
     */
    initializeEventListeners() {
        
    }
    
    /**
     * Configura listeners para cambios en los datos
     */
    setupDataListeners() {
        this.dataManager.on('subjectCreated', () => this.render());
        this.dataManager.on('subjectUpdated', () => this.render());
        this.dataManager.on('subjectDeleted', () => this.render());
        this.dataManager.on('progressUpdated', () => this.render()); // Actualizar cuando cambie el progreso
        this.dataManager.on('topicDeleted', () => this.render());
    }
    
    /**
     * Renderiza el dashboard completo
     */
    render() {
        if (!this.container) return;
        
        // Limpiar listeners anteriores antes de renderizar
        this.cleanupProfileMenuListeners();
        
        const currentPeriod = this.dataManager.data.currentPeriod;
        const allSubjects = this.dataManager.getSubjects();
        
        // Actualizar índice basado en currentPeriod
        const periodsFromSubjects = allSubjects.map(s => s.period).filter(p => p);
        const allPeriods = currentPeriod ? [...periodsFromSubjects, currentPeriod] : periodsFromSubjects;
        const periods = [...new Set(allPeriods)];
        this.currentPeriodIndex = periods.indexOf(currentPeriod);
        if (this.currentPeriodIndex === -1) this.currentPeriodIndex = 0;
        
        const subjects = allSubjects.filter(s => s.period === currentPeriod);
        const lastAccessed = this.getLastAccessedSubject();
        const upcomingEvents = this.getUpcomingEvents();
        const weeklyStats = this.getWeeklyStats();
        
        this.container.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <!-- Encabezado -->
                ${this.renderHeader()}
                
                <!-- Contenido del Dashboard en Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <!-- Columna principal (2/3) -->
                    <div class="lg:col-span-2">
                        <div class="max-w-4xl mx-auto">
                        <!-- Continuar donde lo dejaste + Próximos Exámenes -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            ${this.renderContinueSection(lastAccessed)}
                            ${this.renderUpcomingExams(upcomingEvents)}
                        </div>
                        
                        <!-- Carrusel de Quizzes -->
                        ${this.renderQuizCarousel()}
                        
                        <!-- Mis Cuadernos -->
                        ${this.renderSubjects(subjects)}
                        </div>
                    </div>
                    
                    <!-- Columna lateral (1/3) -->
                    <aside class="lg:col-span-1 space-y-4 lg:border-l lg:border-slate-700/50 lg:pl-4 max-w-xs">
                        <!-- Período Actual -->
                        ${this.renderPeriodSelector(currentPeriod, allSubjects)}
                        
                        <!-- Checklist de Tareas -->
                        ${this.renderTaskChecklist()}
                        
                        <!-- Calendario con Eventos -->
                        ${this.renderCalendar()}
                        
                        <!-- Resumen Semanal -->
                        ${this.renderWeeklyStats(weeklyStats)}
                    </aside>
                </div>
        `;
        
        // Agregar event listeners
        this.attachEventListeners();
        
        // Cargar frase motivacional
        this.loadMotivationalQuote();
        
        // Inicializar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Renderiza el encabezado del dashboard
     */
    renderHeader() {
        const userName = 'José'; // Nombre fijo por ahora
        const greeting = this.getTimeBasedGreeting(userName);
        
        return `
            <header class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
                        ${greeting}
                    </h1>
                    <p class="text-slate-400 text-sm mt-0.5" id="motivational-quote">Cargando frase motivacional...</p>
                </div>
                <div class="flex items-center space-x-4 mt-4 sm:mt-0">
                    
                    <div class="relative">
                        <button id="profile-menu-btn" class="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform">
                            J
                        </button>
                        <div id="profile-menu" class="hidden absolute right-0 top-full mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 z-50">
                            <button id="shortcuts-menu-btn" class="w-full px-4 py-2.5 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-slate-200">
                                <i data-lucide="keyboard" class="w-4 h-4"></i>
                                <span>Atajos de Teclado</span>
                            </button>
                            <div class="border-t border-slate-700 my-1"></div>
                            <button id="config-credentials-menu" class="w-full px-4 py-2.5 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-slate-200">
                                <i data-lucide="key" class="w-4 h-4"></i>
                                <span>Cambiar Credenciales</span>
                            </button>
                            <div class="border-t border-slate-700 my-1"></div>
                            <button id="config-pomodoro-menu" class="w-full px-4 py-2.5 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-slate-200">
                                <i data-lucide="timer" class="w-4 h-4"></i>
                                <span>Pomodoro</span>
                            </button>
                            <div class="border-t border-slate-700 my-1"></div>
                            <button id="logout-menu" class="w-full px-4 py-2.5 text-left hover:bg-red-900/50 transition-colors flex items-center gap-3 text-red-400">
                                <i data-lucide="log-out" class="w-4 h-4"></i>
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
    
    /**
     * Renderiza selector de período
     */
    renderPeriodSelector(currentPeriod, allSubjects) {
        // Obtener períodos únicos de todas las materias + el currentPeriod
        const periodsFromSubjects = allSubjects.map(s => s.period).filter(p => p);
        const allPeriods = currentPeriod ? [...periodsFromSubjects, currentPeriod] : periodsFromSubjects;
        const periods = [...new Set(allPeriods)];
        
        // Asegurar que el índice esté dentro del rango
        if (this.currentPeriodIndex >= periods.length) {
            this.currentPeriodIndex = 0;
        }
        
        const displayPeriod = periods.length > 0 ? periods[this.currentPeriodIndex] : (currentPeriod || 'Sin período');
        
        return `
            <section class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-base font-semibold text-white">Estudio</h2>
                    <button id="add-period-btn" class="p-1 hover:bg-slate-700 rounded transition-colors" title="Crear nuevo período">
                        <i data-lucide="plus" class="w-4 h-4 text-indigo-400"></i>
                    </button>
                </div>
                
                ${periods.length > 1 ? `
                    <!-- Buscador arriba -->
                    <div class="mb-3 relative">
                        <div class="relative">
                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                            <input 
                                type="text" 
                                id="period-search" 
                                placeholder="Buscar estudio..." 
                                class="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                autocomplete="off"
                            />
                        </div>
                        <div id="period-dropdown" class="hidden absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-2xl max-h-48 overflow-y-auto" style="z-index: 99999;">
                            <!-- Resultados de búsqueda aquí -->
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex items-center justify-between gap-2 group">
                    <div class="flex items-center gap-2 flex-1">
                        ${periods.length > 1 ? `
                            <button id="period-prev" class="p-0.5 hover:bg-slate-700 rounded transition-colors">
                                <i data-lucide="chevron-left" class="w-4 h-4 text-slate-400"></i>
                            </button>
                        ` : ''}
                        <span class="text-sm font-medium text-white truncate flex-1 text-center" title="${displayPeriod}">${displayPeriod}</span>
                        ${periods.length > 1 ? `
                            <button id="period-next" class="p-0.5 hover:bg-slate-700 rounded transition-colors">
                                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        ${periods.length > 0 ? `
                            <button id="delete-period-btn" class="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 hover:text-red-400 rounded transition-all" title="Eliminar período">
                                <i data-lucide="trash-2" class="w-4 h-4 text-slate-400"></i>
                            </button>
                        ` : ''}
                        ${periods.length > 1 ? `
                            <div class="text-xs text-slate-500">
                                ${this.currentPeriodIndex + 1}/${periods.length}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </section>
        `;
    }
    
    /**
     * Renderiza la sección "Continuar donde lo dejaste"
     */
    renderContinueSection(lastAccessed) {
        if (!lastAccessed) {
            return `
                <section>
                    <h2 class="text-base font-semibold text-white mb-2">Continuar donde lo dejaste</h2>
                    <div class="bg-slate-800/50 p-3 rounded-xl border-2 border-dashed border-slate-700 text-center text-slate-500 h-[90px] flex flex-col justify-center">
                        <i data-lucide="book-open" class="w-8 h-8 mx-auto mb-1 opacity-50"></i>
                        <p class="text-xs">Aún no has comenzado</p>
                    </div>
                </section>
            `;
        }
        
        const icon = this.getSubjectIcon(lastAccessed.icon);
        const iconColor = this.getSubjectIconColor(lastAccessed.color);
        const timeAgo = this.getTimeAgo(lastAccessed.lastAccessed);
        
        return `
            <section>
                <h2 class="text-base font-semibold text-white mb-2">Continuar donde lo dejaste</h2>
                <div class="bg-slate-800/80 p-3 rounded-xl hover:bg-slate-700/80 transition-colors cursor-pointer border border-slate-700 h-[90px] flex items-center justify-between"
                     data-continue-subject-id="${lastAccessed.id}">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <i data-lucide="${icon}" class="w-4 h-4 ${iconColor}"></i>
                            <h3 class="text-sm font-bold text-white truncate" title="${lastAccessed.name}">${lastAccessed.name}</h3>
                        </div>
                        <p class="text-slate-400 text-xs truncate" title="${lastAccessed.lastTopic || 'Comienza a estudiar'}">${lastAccessed.lastTopic ? `${lastAccessed.lastTopic}` : 'Comienza a estudiar'}</p>
                        <p class="text-xs text-slate-500 mt-1">${timeAgo}</p>
                    </div>
                    <button class="p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors ml-3 flex-shrink-0">
                        <i data-lucide="play" class="w-4 h-4 text-white"></i>
                    </button>
                </div>
            </section>
        `;
    }
    
    /**
     * Renderiza la sección de materias
     */
    renderSubjects(subjects) {
        const subjectCards = subjects.map(subject => this.renderSubjectCard(subject)).join('');
        
        return `
            <section>
                <h2 class="text-base font-semibold text-white mb-3">Mis Cuadernos</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${subjectCards}
                    
                    <!-- Card para añadir nueva materia -->
                    <div class="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800/80 hover:border-indigo-600 hover:text-indigo-500 transition-colors cursor-pointer min-h-[160px]"
                         id="add-subject-card">
                        <i data-lucide="plus-circle" class="w-6 h-6 mb-1"></i>
                        <span class="font-semibold text-sm">Añadir materia</span>
                    </div>
                </div>
            </section>
        `;
    }
    
    /**
     * Renderiza una tarjeta de materia
     */
    renderSubjectCard(subject) {
        const icon = this.getSubjectIcon(subject.icon);
        const colorClass = this.getSubjectColorClass(subject.color);
        const iconColorClass = this.getSubjectIconColor(subject.color);
        const progress = this.calculateSubjectProgress(subject);
        const description = subject.description || 'Sin descripción.';
        
        return `
            <div class="subject-card bg-slate-800/80 p-4 rounded-xl flex flex-col justify-between border border-slate-700 hover:-translate-y-1 transition-transform cursor-pointer"
                 data-subject-id="${subject.id}">
                <div>
                    <div class="flex justify-between items-start">
                        <div class="p-2 ${colorClass}/20 rounded-lg mb-3">
                            <i data-lucide="${icon}" class="w-5 h-5 ${iconColorClass}"></i>
                        </div>
                        <div class="relative subject-menu-container">
                            <button class="subject-menu-btn p-1 hover:bg-slate-700 rounded" data-subject-id="${subject.id}">
                                <i data-lucide="more-vertical" class="text-slate-500 w-5 h-5"></i>
                            </button>
                            <div class="subject-dropdown hidden absolute right-0 top-full mt-1 bg-slate-700 rounded-lg shadow-2xl border border-slate-600 py-1 z-50 min-w-[140px]" data-subject-id="${subject.id}">
                                <button class="edit-subject-btn w-full px-4 py-2 text-left hover:bg-slate-600 transition-colors flex items-center gap-2 text-slate-200" data-subject-id="${subject.id}">
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                    <span class="text-sm">Editar</span>
                                </button>
                                <button class="delete-subject-btn w-full px-4 py-2 text-left hover:bg-slate-600 transition-colors flex items-center gap-2 text-red-400" data-subject-id="${subject.id}">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    <span class="text-sm">Eliminar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <h3 class="font-bold text-base text-white">${subject.name}</h3>
                    <p class="text-slate-400 text-xs mt-1 mb-3 line-clamp-2">${description}</p>
                </div>
                <div>
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="text-xs font-medium text-slate-400">Progreso</span>
                        <span class="text-xs font-bold text-white">${progress}%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5">
                        <div class="bg-indigo-500 h-1.5 rounded-full progress-bar-fill transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza solo los próximos exámenes
     */
    renderUpcomingExams(events) {
        const exams = events.filter(e => e.type === 'exam');
        
        if (exams.length === 0) {
            return `
                <section>
                    <h2 class="text-base font-semibold text-white mb-2">Próximos Exámenes</h2>
                    <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-center text-slate-500 h-[90px] flex flex-col justify-center">
                        <i data-lucide="calendar-check" class="w-8 h-8 mx-auto mb-1 opacity-50"></i>
                        <p class="text-xs">No hay exámenes próximos</p>
                    </div>
                </section>
            `;
        }
        
        const examsList = exams.slice(0, 2).map(event => {
            const date = new Date(event.date);
            const month = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
            const day = date.getDate();
            
            return `
                <li class="flex items-center gap-3">
                    <div class="flex flex-col items-center justify-center w-12 h-12 bg-rose-500/20 text-rose-400 rounded-lg flex-shrink-0">
                        <span class="text-[10px]">${month}</span>
                        <span class="font-bold text-sm">${day}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-sm text-white truncate" title="${event.title}">${event.title}</h4>
                        <p class="text-xs text-slate-400 truncate" title="${event.subjectName || 'General'}">${event.subjectName || 'General'}</p>
                    </div>
                </li>
            `;
        }).join('');
        
        return `
            <section>
                <h2 class="text-base font-semibold text-white mb-2">Próximos Exámenes</h2>
                <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 h-[90px] flex flex-col justify-center">
                    <ul class="space-y-2">
                        ${examsList}
                    </ul>
                </div>
            </section>
        `;
    }
    
    /**
     * Renderiza el checklist de tareas
     */
    renderTaskChecklist() {
        const tasks = this.dataManager.data.dashboardTasks || [];
        
        const tasksList = tasks.map(task => {
            const checkedClass = task.completed ? 'line-through text-slate-500' : 'text-white';
            const checkIcon = task.completed ? 'check-square' : 'square';
            
            return `
                <li class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors group">
                    <button class="toggle-task-btn flex-shrink-0 text-slate-400 hover:text-indigo-400 transition-colors" data-task-id="${task.id}">
                        <i data-lucide="${checkIcon}" class="w-5 h-5"></i>
                    </button>
                    <span class="flex-1 text-sm ${checkedClass} transition-all">${task.text}</span>
                    <button class="delete-task-btn opacity-0 group-hover:opacity-100 flex-shrink-0 text-slate-500 hover:text-red-400 transition-all" data-task-id="${task.id}">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </li>
            `;
        }).join('');
        
        return `
            <section class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-base font-semibold text-white">Tareas Rápidas</h2>
                    <button id="add-task-btn" class="p-1 hover:bg-slate-700 rounded transition-colors" title="Añadir tarea">
                        <i data-lucide="plus" class="w-4 h-4 text-indigo-400"></i>
                    </button>
                </div>
                ${tasks.length > 0 ? `
                    <ul class="space-y-2">
                        ${tasksList}
                    </ul>
                ` : `
                    <div class="text-center text-slate-500 py-3">
                        <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-1 opacity-50"></i>
                        <p class="text-xs">No hay tareas pendientes</p>
                    </div>
                `}
            </section>
        `;
    }
    
    /**
     * Renderiza el calendario con eventos
     */
    renderCalendar() {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const viewMonth = this.currentCalendarMonth;
        const viewYear = this.currentCalendarYear;
        
        // Obtener primer y último día del mes
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Día de la semana del primer día (0=domingo, 1=lunes, ...)
        const firstDayOfWeek = firstDay.getDay();
        const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Ajustar para que lunes sea 0
        
        // Nombres del mes
        const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const monthName = monthNames[viewMonth];
        
        // Obtener eventos del mes
        const events = this.getEventsForMonth(viewYear, viewMonth);
        
        // Generar días del calendario
        let calendarDays = '';
        
        // Espacios vacíos antes del primer día
        for (let i = 0; i < startOffset; i++) {
            calendarDays += '<span></span>';
        }
        
        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events[dateStr] || [];
            const isToday = day === currentDay && viewMonth === currentMonth && viewYear === currentYear;
            const hasEvents = dayEvents.length > 0;
            
            let dayClass = '';
            if (isToday) {
                dayClass = 'bg-blue-600 text-white font-bold';
            } else if (hasEvents) {
                dayClass = 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-400 font-semibold';
            }
            
            if (hasEvents) {
                const tooltipContent = `
                    <div class="tooltip">
                        <h5 class="text-xs font-semibold text-emerald-300 mb-1">${day} ${monthName}</h5>
                        <ul class="space-y-1">
                            ${dayEvents.map(e => `<li class="text-xs">• ${e.title}</li>`).join('')}
                        </ul>
                    </div>
                `;
                calendarDays += `<span class="${dayClass} has-event" data-date="${dateStr}">${day}${tooltipContent}</span>`;
            } else {
                calendarDays += `<span class="${dayClass}">${day}</span>`;
            }
        }
        
        return `
            <section class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div class="flex items-center justify-between mb-3">
                    <h2 class="text-sm font-semibold text-white">Calendario</h2>
                    <div class="flex items-center gap-2">
                        <button id="calendar-prev-month" class="p-1 hover:bg-slate-700 rounded transition-colors">
                            <i data-lucide="chevron-left" class="w-4 h-4 text-slate-400"></i>
                        </button>
                        <span class="text-xs font-medium text-slate-300 min-w-[70px] text-center">${monthName} ${viewYear}</span>
                        <button id="calendar-next-month" class="p-1 hover:bg-slate-700 rounded transition-colors">
                            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
                        </button>
                    </div>
                </div>
                <div class="calendar-grid">
                    <div class="grid grid-cols-7 gap-1 text-[10px] text-center">
                        <span class="text-slate-500 font-semibold">L</span>
                        <span class="text-slate-500 font-semibold">M</span>
                        <span class="text-slate-500 font-semibold">X</span>
                        <span class="text-slate-500 font-semibold">J</span>
                        <span class="text-slate-500 font-semibold">V</span>
                        <span class="text-slate-500 font-semibold">S</span>
                        <span class="text-slate-500 font-semibold">D</span>
                        ${calendarDays}
                    </div>
                </div>
            </section>
            
            <style>
                .calendar-grid span {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-radius: 50%;
                    font-size: 10px;
                    position: relative;
                    transition: all 0.2s;
                }
                
                .calendar-grid .has-event .tooltip {
                    visibility: hidden;
                    opacity: 0;
                    width: 160px;
                    background-color: #1e293b;
                    border: 1px solid #475569;
                    color: #fff;
                    text-align: left;
                    border-radius: 8px;
                    padding: 8px;
                    position: absolute;
                    z-index: 50;
                    bottom: 125%;
                    left: 50%;
                    margin-left: -80px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    transition: opacity 0.3s, visibility 0.3s;
                }
                
                .calendar-grid .has-event .tooltip::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: #1e293b transparent transparent transparent;
                }
                
                .calendar-grid .has-event:hover .tooltip {
                    visibility: visible;
                    opacity: 1;
                }
            </style>
        `;
    }
    
    /**
     * Renderiza el resumen semanal
     */
    renderWeeklyStats(stats) {
        const totalHours = stats.totalHours.toFixed(1);
        const bestDay = stats.bestDay;
        const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
        
        const bars = stats.dailyHours.map((hours, index) => {
            // Calcular altura proporcional (0-100%)
            const percentage = stats.maxHours > 0 ? (hours / stats.maxHours) * 100 : 0;
            const isBestDay = index === stats.bestDayIndex && hours > 0;
            
            // Colores bonitos: emerald para mejor día, slate/indigo gradiente para otros
            const barColor = isBestDay ? 'bg-emerald-400' : 'bg-slate-600/50';
            
            // Mostrar horas encima de la barra solo si es mayor a 0
            const hoursLabel = hours > 0 ? `<span class="text-xs font-medium text-slate-300 mb-2">${hours}h</span>` : '';
            
            return `
                <div class="flex flex-col items-center gap-1 flex-1">
                    <div class="h-24 flex flex-col justify-end items-center w-full">
                        ${hoursLabel}
                        <div class="w-5 rounded-full transition-all duration-700 ease-out ${barColor}" 
                             style="height: ${percentage}%; min-height: ${hours > 0 ? '4px' : '0px'};" 
                             title="${hours.toFixed(1)} horas">
                        </div>
                    </div>
                    <span class="text-[10px] text-slate-500">${dayNames[index]}</span>
                </div>
            `;
        }).join('');
        
        return `
            <section class="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <h2 class="text-base font-semibold text-white mb-1">Resumen Semanal</h2>
                <p class="text-xs text-slate-400 mb-1">Total de ${totalHours} horas de estudio</p>
                ${bestDay ? `<p class="text-xs font-semibold text-emerald-400 mb-3">¡El ${bestDay} fue tu día más productivo!</p>` : ''}
                <div class="flex items-end justify-between gap-2">
                    ${bars}
                </div>
            </section>
        `;
    }
    
    /**
     * Adjunta event listeners después del render
     */
    attachEventListeners() {
        // Click en continuar estudiando
        const continueBtn = this.container.querySelector('[data-continue-subject-id]');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                const subjectId = continueBtn.dataset.continueSubjectId;
                this.openSubject(subjectId);
            });
        }
        
        // Click en tarjetas de materias
        this.container.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', () => {
                const subjectId = card.dataset.subjectId;
                this.openSubject(subjectId);
            });
        });
        
        // Menú desplegable de materias
        this.container.querySelectorAll('.subject-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = btn.nextElementSibling;
                
                // Cerrar otros dropdowns
                this.container.querySelectorAll('.subject-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.add('hidden');
                });
                
                // Toggle este dropdown
                dropdown.classList.toggle('hidden');
            });
        });
        
        // Botones de editar materia
        this.container.querySelectorAll('.edit-subject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subjectId = btn.dataset.subjectId;
                this.editSubject(subjectId);
                // Cerrar dropdown
                btn.closest('.subject-dropdown').classList.add('hidden');
            });
        });
        
        // Botones de eliminar materia
        this.container.querySelectorAll('.delete-subject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subjectId = btn.dataset.subjectId;
                this.deleteSubject(subjectId);
                // Cerrar dropdown
                btn.closest('.subject-dropdown').classList.add('hidden');
            });
        });
        
        // Cerrar dropdowns al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.subject-menu-container')) {
                this.container.querySelectorAll('.subject-dropdown').forEach(d => {
                    d.classList.add('hidden');
                });
            }
        });
        
        // Click en añadir materia
        const addCard = this.container.querySelector('#add-subject-card');
        if (addCard) {
            addCard.addEventListener('click', () => this.createNewSubject());
        }
        
        // Atajos de teclado
        const shortcutsMenuBtn = this.container.querySelector('#shortcuts-menu-btn');
        if (shortcutsMenuBtn) {
            shortcutsMenuBtn.addEventListener('click', () => {
                this.showKeyboardShortcutsModal();
                profileMenu?.classList.add('hidden');
            });
        }
        // Botón eliminar período
        const deletePeriodBtn = this.container.querySelector('#delete-period-btn');
        if (deletePeriodBtn) {
            deletePeriodBtn.addEventListener('click', () => {
                this.deletePeriod();
            });
        }
        
        // Navegación de períodos
        const periodPrevBtn = this.container.querySelector('#period-prev');
        const periodNextBtn = this.container.querySelector('#period-next');
        
        if (periodPrevBtn) {
            periodPrevBtn.addEventListener('click', () => {
                const allSubjects = this.dataManager.data.subjects || [];
                const currentPeriod = this.dataManager.data.currentPeriod;
                const periodsFromSubjects = allSubjects.map(s => s.period).filter(p => p);
                const allPeriods = currentPeriod ? [...periodsFromSubjects, currentPeriod] : periodsFromSubjects;
                const periods = [...new Set(allPeriods)];
                
                this.currentPeriodIndex--;
                if (this.currentPeriodIndex < 0) {
                    this.currentPeriodIndex = periods.length - 1;
                }
                
                this.dataManager.data.currentPeriod = periods[this.currentPeriodIndex];
                this.dataManager.save();
                this.render();
            });
        }
        
        if (periodNextBtn) {
            periodNextBtn.addEventListener('click', () => {
                const allSubjects = this.dataManager.data.subjects || [];
                const currentPeriod = this.dataManager.data.currentPeriod;
                const periodsFromSubjects = allSubjects.map(s => s.period).filter(p => p);
                const allPeriods = currentPeriod ? [...periodsFromSubjects, currentPeriod] : periodsFromSubjects;
                const periods = [...new Set(allPeriods)];
                
                this.currentPeriodIndex++;
                if (this.currentPeriodIndex >= periods.length) {
                    this.currentPeriodIndex = 0;
                }
                
                this.dataManager.data.currentPeriod = periods[this.currentPeriodIndex];
                this.dataManager.save();
                this.render();
            });
        }
        
        // Buscador de períodos con autocompletado
        const periodSearchInput = this.container.querySelector('#period-search');
        const periodDropdown = this.container.querySelector('#period-dropdown');
        
        if (periodSearchInput && periodDropdown) {
            periodSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                const allSubjects = this.dataManager.data.subjects || [];
                const currentPeriod = this.dataManager.data.currentPeriod;
                const periodsFromSubjects = allSubjects.map(s => s.period).filter(p => p);
                const allPeriods = currentPeriod ? [...periodsFromSubjects, currentPeriod] : periodsFromSubjects;
                const periods = [...new Set(allPeriods)];
                
                if (searchTerm === '') {
                    periodDropdown.classList.add('hidden');
                    return;
                }
                
                // Filtrar períodos de forma inteligente
                // 1. Buscar al inicio del período
                // 2. Buscar al inicio de cualquier palabra
                const filteredPeriods = periods.filter(p => {
                    const periodLower = p.toLowerCase();
                    
                    // Coincide al inicio del período
                    if (periodLower.startsWith(searchTerm)) return true;
                    
                    // Coincide al inicio de cualquier palabra
                    const words = periodLower.split(/\s+/);
                    return words.some(word => word.startsWith(searchTerm));
                })
                
                // Ordenar: primero los que empiezan con el término, luego el resto
                .sort((a, b) => {
                    const aLower = a.toLowerCase();
                    const bLower = b.toLowerCase();
                    const aStarts = aLower.startsWith(searchTerm);
                    const bStarts = bLower.startsWith(searchTerm);
                    
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return a.localeCompare(b);
                });
                
                if (filteredPeriods.length === 0) {
                    periodDropdown.innerHTML = `
                        <div class="p-3 text-center text-sm text-slate-400">
                            No se encontraron períodos
                        </div>
                    `;
                    periodDropdown.classList.remove('hidden');
                } else {
                    periodDropdown.innerHTML = filteredPeriods.map(period => `
                        <button class="period-search-result w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-600 transition-colors flex items-center justify-between" data-period="${period}">
                            <span class="truncate">${period}</span>
                            ${period === this.dataManager.data.currentPeriod ? '<i data-lucide="check" class="w-4 h-4 text-indigo-400 flex-shrink-0"></i>' : ''}
                        </button>
                    `).join('');
                    periodDropdown.classList.remove('hidden');
                    
                    // Re-inicializar iconos de Lucide
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                    
                    // Event listeners para resultados
                    periodDropdown.querySelectorAll('.period-search-result').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const selectedPeriod = btn.dataset.period;
                            this.dataManager.data.currentPeriod = selectedPeriod;
                            this.dataManager.save();
                            periodSearchInput.value = '';
                            periodDropdown.classList.add('hidden');
                            this.render();
                        });
                    });
                }
            });
            
            // Cerrar dropdown al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!periodSearchInput.contains(e.target) && !periodDropdown.contains(e.target)) {
                    periodDropdown.classList.add('hidden');
                }
            });
            
            // Limpiar al presionar Escape
            periodSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    periodSearchInput.value = '';
                    periodDropdown.classList.add('hidden');
                }
            });
        }
        
        // Menús de opciones de materias
        this.container.querySelectorAll('.subject-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subjectId = btn.dataset.subjectId;
                this.showSubjectMenu(subjectId, btn);
            });
        });
        
        // Botón añadir tarea
        const addTaskBtn = this.container.querySelector('#add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => this.addTask());
        }
        
        // Botones toggle de tareas
        this.container.querySelectorAll('.toggle-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.taskId;
                this.toggleTask(taskId);
            });
        });
        
        // Botones eliminar tareas
        this.container.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.taskId;
                this.deleteTask(taskId);
            });
        });
        
        // Navegación del calendario
        const prevMonthBtn = this.container.querySelector('#calendar-prev-month');
        const nextMonthBtn = this.container.querySelector('#calendar-next-month');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.currentCalendarMonth--;
                if (this.currentCalendarMonth < 0) {
                    this.currentCalendarMonth = 11;
                    this.currentCalendarYear--;
                }
                this.render();
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.currentCalendarMonth++;
                if (this.currentCalendarMonth > 11) {
                    this.currentCalendarMonth = 0;
                    this.currentCalendarYear++;
                }
                this.render();
            });
        }
        
        // Toggle menú de perfil
        const profileBtn = this.container.querySelector('#profile-menu-btn');
        const profileMenu = this.container.querySelector('#profile-menu');
        if (profileBtn && profileMenu) {
            // Remover listeners anteriores para evitar duplicados
            profileBtn.removeEventListener('click', this.handleProfileMenuClick);
            document.removeEventListener('click', this.handleProfileMenuClose);
            
            // Agregar listeners nuevos
            this.handleProfileMenuClick = (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('hidden');
            };
            
            this.handleProfileMenuClose = (e) => {
                if (!profileMenu.contains(e.target) && e.target !== profileBtn) {
                    profileMenu.classList.add('hidden');
                }
            };
            
            profileBtn.addEventListener('click', this.handleProfileMenuClick);
            document.addEventListener('click', this.handleProfileMenuClose);
        }
        
        // Toggle menú de atajos
        const shortcutsBtn = this.container.querySelector('#shortcuts-menu-btn');
        const shortcutsMenu = this.container.querySelector('#shortcuts-menu');
        if (shortcutsBtn && shortcutsMenu) {
            // Remover listeners anteriores para evitar duplicados
            shortcutsBtn.removeEventListener('click', this.handleShortcutsMenuClick);
            document.removeEventListener('click', this.handleShortcutsMenuClose);
            
            // Agregar listeners nuevos
            this.handleShortcutsMenuClick = (e) => {
                e.stopPropagation();
                shortcutsMenu.classList.toggle('hidden');
            };
            
            this.handleShortcutsMenuClose = (e) => {
                if (!shortcutsMenu.contains(e.target) && e.target !== shortcutsBtn) {
                    shortcutsMenu.classList.add('hidden');
                }
            };
            
            shortcutsBtn.addEventListener('click', this.handleShortcutsMenuClick);
            document.addEventListener('click', this.handleShortcutsMenuClose);
        }
        
        // Cambiar Credenciales
        const configCredentialsBtn = this.container.querySelector('#config-credentials-menu');
        if (configCredentialsBtn) {
            configCredentialsBtn.addEventListener('click', () => {
                if (window.showSettingsModal) {
                    window.showSettingsModal();
                    profileMenu?.classList.add('hidden');
                }
            });
        }
        
        // Configurar Pomodoro
        const configPomodoroBtn = this.container.querySelector('#config-pomodoro-menu');
        if (configPomodoroBtn) {
            configPomodoroBtn.addEventListener('click', () => {
                if (this.pomodoroManager) {
                    this.pomodoroManager.showAudioConfigModal();
                    profileMenu?.classList.add('hidden');
                } else {
                    this.notifications.error('PomodoroManager no está disponible');
                }
            });
        }
        
        // Cerrar Sesión
        const logoutBtn = this.container.querySelector('#logout-menu');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const confirmed = await window.ConfirmModal.show({
                    title: '¿Cerrar sesión?',
                    message: 'Tendrás que volver a iniciar sesión para acceder a tu cuaderno.',
                    confirmText: 'Cerrar Sesión',
                    cancelText: 'Cancelar',
                    type: 'warning'
                });
                
                if (confirmed && window.logout) {
                    window.logout();
                } else if (confirmed) {
                    this.notifications.error('Sistema de logout no disponible');
                }
            });
        }
        
        // Event listeners del carrusel de quizzes
        this.attachQuizCarouselListeners();
        
        // Botón crear preguntas en dashboard
        const createQuizDashboardBtn = this.container.querySelector('#create-quiz-dashboard-btn');
        if (createQuizDashboardBtn && this.quizManager) {
            createQuizDashboardBtn.addEventListener('click', () => this.showCreateQuizModal());
        }
        
        // Botón CTA para crear primera colección
        const createQuizCtaBtn = this.container.querySelector('.create-quiz-cta-btn');
        if (createQuizCtaBtn && this.quizManager) {
            createQuizCtaBtn.addEventListener('click', () => this.showCreateQuizModal());
        }
    }
    
    /**
     * Adjunta event listeners del carrusel de quizzes
     */
    attachQuizCarouselListeners() {
        if (!this.quizManager) return;
        
        // Navegación del carrusel
        const quizCarouselPrev = this.container.querySelector('#quiz-carousel-prev');
        const quizCarouselNext = this.container.querySelector('#quiz-carousel-next');
        const quizTrack = this.container.querySelector('#quiz-carousel-track');
        
        if (quizCarouselPrev && quizCarouselNext && quizTrack) {
            let scrollPosition = 0;
            const cardWidth = 268; // 256px (w-64) + 12px gap
            
            quizCarouselPrev.addEventListener('click', () => {
                scrollPosition = Math.max(0, scrollPosition - cardWidth);
                quizTrack.style.transform = `translateX(-${scrollPosition}px)`;
            });
            
            quizCarouselNext.addEventListener('click', () => {
                const maxScroll = quizTrack.scrollWidth - quizTrack.parentElement.clientWidth;
                scrollPosition = Math.min(maxScroll, scrollPosition + cardWidth);
                quizTrack.style.transform = `translateX(-${scrollPosition}px)`;
            });
        }
        
        // Botones estudiar quiz
        const studyQuizBtns = this.container.querySelectorAll('.study-quiz-btn');
        studyQuizBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const collectionId = btn.dataset.collectionId;
                const topicId = btn.dataset.topicId;
                const collection = this.quizManager.getCollection(collectionId, topicId);
                
                if (collection && window.QuizStudyModal) {
                    const modal = new window.QuizStudyModal(this.quizManager, this.notifications);
                    modal.show(collection);
                } else {
                    this.notifications.error('No se pudo cargar la colección');
                }
            });
        });
        
        // Botones fijar quiz
        const pinQuizBtns = this.container.querySelectorAll('.pin-quiz-btn');
        pinQuizBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const collectionId = btn.dataset.collectionId;
                const topicId = btn.dataset.topicId;
                
                const isPinned = this.quizManager.togglePinCollection(collectionId, topicId);
                this.notifications.success(isPinned ? 'Colección fijada' : 'Colección desfijada');
                this.render();
            });
        });
        
        // Botones eliminar quiz
        const deleteQuizBtns = this.container.querySelectorAll('.delete-quiz-btn');
        deleteQuizBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const collectionId = btn.dataset.collectionId;
                const topicId = btn.dataset.topicId;
                this.showDeleteQuizConfirm(collectionId, topicId);
            });
        });
    }
    
    /**
     * Muestra modal de confirmación para eliminar colección de quiz
     */
    showDeleteQuizConfirm(collectionId, topicId) {
        const collection = this.quizManager.getCollection(collectionId, topicId);
        if (!collection) return;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <i data-lucide="alert-triangle" class="w-6 h-6 text-red-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-white">¿Eliminar colección?</h3>
                            <p class="text-sm text-slate-400 mt-1">Esta acción no se puede deshacer</p>
                        </div>
                    </div>
                    
                    <div class="bg-slate-900/50 rounded-lg p-3 mb-4">
                        <p class="text-sm text-white font-semibold">${collection.name}</p>
                        <p class="text-xs text-slate-400 mt-1">${collection.questions.length} preguntas serán eliminadas</p>
                    </div>
                    
                    <div class="flex gap-3">
                        <button id="cancel-delete-quiz" class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button id="confirm-delete-quiz" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const cancelBtn = modal.querySelector('#cancel-delete-quiz');
        const confirmBtn = modal.querySelector('#confirm-delete-quiz');
        
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        confirmBtn.addEventListener('click', () => {
            this.quizManager.deleteCollection(collectionId, topicId);
            this.notifications.success('Colección eliminada correctamente');
            document.body.removeChild(modal);
            this.render();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        if (window.lucide) window.lucide.createIcons();
    }
    
    /**
     * Abre una materia navegando a la vista de temas
     */
    openSubject(subjectId) {
        const subject = this.dataManager.getSubject(subjectId);
        if (subject) {
            // Actualizar último acceso
            subject.lastAccessed = new Date().toISOString();
            this.dataManager.save();
            
            this.router.navigateTo('topics', subject);
        }
    }
    
    /**
     * Crea una nueva materia
     */
    createNewSubject() {
        this.showCreateSubjectModal();
    }
    
    /**
     * Muestra modal para crear materia
     */
    showCreateSubjectModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-xl font-semibold text-white mb-4">Nueva Materia</h3>
                    <form id="create-subject-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Nombre de la materia
                            </label>
                            <input 
                                type="text" 
                                id="subject-name"
                                class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ej: Matemáticas, Historia..."
                                required
                                maxlength="100"
                            >
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Descripción (opcional)
                            </label>
                            <textarea 
                                id="subject-description"
                                class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Breve descripción de la materia..."
                                rows="3"
                                maxlength="200"
                            ></textarea>
                        </div>
                        <div class="flex justify-end gap-3">
                            <button type="button" id="cancel-create" class="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Crear Materia
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const form = modal.querySelector('#create-subject-form');
        const cancelBtn = modal.querySelector('#cancel-create');
        const nameInput = modal.querySelector('#subject-name');
        
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = nameInput.value.trim();
            const description = modal.querySelector('#subject-description').value.trim();
            
            if (!name) {
                this.notifications.error('El nombre es requerido');
                return;
            }
            
            try {
                const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                
                this.dataManager.createSubject({
                    name,
                    description: description || `Apuntes de ${name}`,
                    color: randomColor
                });
                
                this.notifications.success('Materia creada correctamente');
                document.body.removeChild(modal);
            } catch (error) {
                this.notifications.error('Error al crear la materia');
                console.error(error);
            }
        });
        
        nameInput.focus();
    }
    
    /**
     * Muestra notificaciones
     */
    showNotifications() {
        this.notifications.info('Sistema de notificaciones próximamente');
    }
    
    /**
     * Muestra menú de opciones de materia
     */
    showSubjectMenu(subjectId, buttonElement) {
        // TODO: Implementar menú contextual
        console.log('Menú de materia:', subjectId);
    }
    
    // ==================== UTILIDADES ====================
    
    /**
     * Obtiene el saludo según la hora del día
     */
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 19) return 'Buenas tardes';
        return 'Buenas noches';
    }
    
    /**
     * Obtiene la última materia accedida
     */
    getLastAccessedSubject() {
        const subjects = this.dataManager.getSubjects();
        if (subjects.length === 0) return null;
        
        const sorted = subjects
            .filter(s => s.lastAccessed)
            .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
        
        if (sorted.length === 0) return null;
        
        const subject = sorted[0];
        const topics = this.dataManager.getTopics(subject.id);
        const lastTopic = topics.length > 0 ? topics[topics.length - 1].name : null;
        
        return {
            ...subject,
            lastTopic
        };
    }
    
    /**
     * Obtiene próximos eventos
     */
    getUpcomingEvents() {
        const allEvents = [];
        const subjects = this.dataManager.getSubjects();
        const now = new Date();
        
        subjects.forEach(subject => {
            const events = this.dataManager.data.events?.[subject.id] || [];
            events.forEach(event => {
                if (new Date(event.date) >= now) {
                    allEvents.push({
                        ...event,
                        subjectName: subject.name,
                        subjectId: subject.id
                    });
                }
            });
        });
        
        return allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    /**
     * Obtiene estadísticas semanales basadas en studyStats reales
     */
    getWeeklyStats() {
        const studyStats = this.dataManager.data.studyStats || {};
        const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const dailyHours = [0, 0, 0, 0, 0, 0, 0]; // L, M, X, J, V, S, D
        
        // Obtener las fechas de la semana actual (lunes a domingo)
        const today = new Date();
        const currentDay = today.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Ajustar para que lunes sea el inicio
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + mondayOffset + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        // Calcular horas por día de la semana
        dates.forEach((dateStr, index) => {
            const dayStats = studyStats[dateStr] || {};
            let dayMinutes = 0;
            
            // Sumar minutos de todas las materias en ese día
            Object.values(dayStats).forEach(minutes => {
                dayMinutes += minutes;
            });
            
            // Convertir a horas
            dailyHours[index] = Math.round((dayMinutes / 60) * 10) / 10; // Redondear a 1 decimal
        });
        
        const totalHours = dailyHours.reduce((a, b) => a + b, 0);
        const maxHours = Math.max(...dailyHours);
        const bestDayIndex = dailyHours.indexOf(maxHours);
        
        return {
            dailyHours,
            totalHours: Math.round(totalHours * 10) / 10,
            maxHours,
            bestDayIndex,
            bestDay: maxHours > 0 ? dayNames[bestDayIndex] : null
        };
    }
    
    /**
     * Calcula el progreso de una materia basado en subtareas completadas
     * (Mismo cálculo que TopicsView para consistencia)
     */
    calculateSubjectProgress(subject) {
        const topics = this.dataManager.getTopics(subject.id);
        
        // Si no hay temas, progreso es 0%
        if (!topics || topics.length === 0) return 0;
        
        let totalSubtasks = 0;
        let completedSubtasks = 0;
        
        // Iterar sobre cada tema y contar sus subtareas
        topics.forEach(topic => {
            const subtasks = this.dataManager.data.subtasks?.[topic.id] || [];
            
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
     * Obtiene el icono de una materia
     */
    getSubjectIcon(icon) {
        const icons = {
            book: 'book',
            code: 'code-2',
            calculator: 'sigma',
            flask: 'flask-conical',
            globe: 'globe',
            microscope: 'microscope',
            music: 'music',
            palette: 'palette',
            scroll: 'scroll-text'
        };
        return icons[icon] || 'book-open';
    }
    
    /**
     * Obtiene la clase de color del icono de materia
     */
    getSubjectIconColor(color) {
        const colors = {
            blue: 'text-blue-400',
            indigo: 'text-indigo-400',
            purple: 'text-purple-400',
            pink: 'text-pink-400',
            red: 'text-red-400',
            orange: 'text-orange-400',
            yellow: 'text-yellow-400',
            green: 'text-green-400',
            emerald: 'text-emerald-400',
            teal: 'text-teal-400',
            cyan: 'text-cyan-400'
        };
        return colors[color] || 'text-slate-400';
    }
    
    /**
     * Obtiene la clase de color base para el fondo de la materia
     */
    getSubjectColorClass(color) {
        const colors = {
            blue: 'bg-blue-500',
            indigo: 'bg-indigo-500',
            purple: 'bg-purple-500',
            pink: 'bg-pink-500',
            red: 'bg-red-500',
            orange: 'bg-orange-500',
            yellow: 'bg-yellow-500',
            green: 'bg-green-500',
            emerald: 'bg-emerald-500',
            teal: 'bg-teal-500',
            cyan: 'bg-cyan-500'
        };
        return colors[color] || 'bg-slate-500';
    }
    
    /**
     * Exporta todos los datos
     */
    exportData() {
        try {
            const dataStr = JSON.stringify(this.dataManager.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `cuaderno-inteligente-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.notifications.success('Datos exportados correctamente');
        } catch (error) {
            console.error('Error al exportar datos:', error);
            this.notifications.error('Error al exportar los datos');
        }
    }
    
    /**
     * Resetea todos los datos
     */
    resetData() {
        // Primera confirmación
        this.showConfirmModal(
            '¿Resetear todos los datos?',
            'Esta acción eliminará TODAS tus materias, temas, páginas, recursos y configuraciones. No se puede deshacer.',
            () => {
                // Segunda confirmación (más fuerte)
                this.showConfirmModal(
                    '⚠️ ÚLTIMA ADVERTENCIA',
                    'Se borrarán TODOS tus datos permanentemente. Esta es tu última oportunidad para cancelar.',
                    () => {
                        localStorage.clear();
                        this.notifications.success('Datos reseteados. Recargando...');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                );
            }
        );
    }
    
    /**
     * Obtiene la clase de color para eventos
     */
    getEventColorClass(type) {
        const types = {
            exam: 'rose-500',
            project: 'sky-500',
            assignment: 'amber-500',
            presentation: 'purple-500'
        };
        return types[type] || 'blue-500';
    }
    
    /**
     * Calcula el tiempo transcurrido
     */
    getTimeAgo(dateString) {
        if (!dateString) return 'Nunca';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        return date.toLocaleDateString('es-ES');
    }
    
    /**
     * Muestra modal de atajos de teclado
     */
    showKeyboardShortcutsModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <i data-lucide="keyboard" class="w-6 h-6 text-blue-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-white">Atajos de Teclado</h3>
                            <p class="text-sm text-slate-400">Funciones rápidas disponibles</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <i data-lucide="sidebar" class="w-4 h-4 text-blue-400"></i>
                                <span class="text-sm text-slate-300">Sidebar izquierdo</span>
                            </div>
                            <kbd class="px-2 py-1 bg-slate-700 text-slate-200 rounded text-xs">Ctrl+B</kbd>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <i data-lucide="sidebar" class="w-4 h-4 text-emerald-400"></i>
                                <span class="text-sm text-slate-300">Sidebar derecho</span>
                            </div>
                            <kbd class="px-2 py-1 bg-slate-700 text-slate-200 rounded text-xs">Ctrl+Shift+B</kbd>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <i data-lucide="eye-off" class="w-4 h-4 text-red-400"></i>
                                <span class="text-sm text-slate-300">Ocultar header</span>
                            </div>
                            <kbd class="px-2 py-1 bg-slate-700 text-slate-200 rounded text-xs">Ctrl+H</kbd>
                        </div>
                    </div>
                    
                    <button id="close-shortcuts-modal" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        Entendido
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('#close-shortcuts-modal');
        closeBtn.addEventListener('click', () => document.body.removeChild(modal));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        if (window.lucide) window.lucide.createIcons();
    }
    
    /**
     * Edita una materia
     */
    editSubject(subjectId) {
        const subject = this.dataManager.getSubjects().find(s => s.id === subjectId);
        if (!subject) return;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-white mb-4">Editar Materia</h3>
                    
                    <form id="edit-subject-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Nombre de la materia
                            </label>
                            <input type="text" id="subject-name" value="${subject.name}" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Descripción
                            </label>
                            <textarea id="subject-description" rows="3" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">${subject.description || ''}</textarea>
                        </div>
                        
                        <div class="flex justify-end gap-3">
                            <button type="button" id="cancel-edit" class="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#edit-subject-form');
        const cancelBtn = modal.querySelector('#cancel-edit');
        const nameInput = modal.querySelector('#subject-name');
        const descInput = modal.querySelector('#subject-description');
        
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = nameInput.value.trim();
            const description = descInput.value.trim();
            
            if (!name) {
                this.notifications.error('El nombre es requerido');
                return;
            }
            
            subject.name = name;
            subject.description = description;
            this.dataManager.save();
            this.render();
            this.notifications.success('Materia actualizada correctamente');
            document.body.removeChild(modal);
        });
        
        nameInput.focus();
        nameInput.select();
    }
    
    /**
     * Elimina una materia
     */
    deleteSubject(subjectId) {
        const subject = this.dataManager.getSubjects().find(s => s.id === subjectId);
        if (!subject) return;
        
        const topics = this.dataManager.getTopics(subjectId);
        
        this.showConfirmModal(
            '¿Eliminar esta materia?',
            `Se eliminará "${subject.name}" con ${topics.length} tema(s) y todo su contenido. Esta acción no se puede deshacer.`,
            () => {
                this.dataManager.deleteSubject(subjectId);
                this.render();
                this.notifications.success('Materia eliminada correctamente');
            }
        );
    }
    
    /**
     * Elimina el período actual
     */
    deletePeriod() {
        const allSubjects = this.dataManager.data.subjects || [];
        const currentPeriod = this.dataManager.data.currentPeriod;
        
        if (!currentPeriod) {
            this.notifications.error('No hay período para eliminar');
            return;
        }
        
        // Contar materias en este período
        const subjectsInPeriod = allSubjects.filter(s => s.period === currentPeriod);
        
        this.showConfirmModal(
            '¿Eliminar este período?',
            `Se eliminará el período "${currentPeriod}" y ${subjectsInPeriod.length} materia(s) asociada(s). Esta acción no se puede deshacer.`,
            () => {
                // Eliminar materias del período
                this.dataManager.data.subjects = allSubjects.filter(s => s.period !== currentPeriod);
                
                // Obtener períodos restantes
                const periodsFromSubjects = this.dataManager.data.subjects.map(s => s.period).filter(p => p);
                const periods = [...new Set(periodsFromSubjects)];
                
                // Establecer nuevo período actual
                if (periods.length > 0) {
                    this.dataManager.data.currentPeriod = periods[0];
                    this.currentPeriodIndex = 0;
                } else {
                    this.dataManager.data.currentPeriod = null;
                    this.currentPeriodIndex = 0;
                }
                
                this.dataManager.save();
                this.render();
                this.notifications.success('Período eliminado correctamente');
            }
        );
    }
    
    /**
     * Muestra modal para añadir período
     */
    showAddPeriodModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-white mb-4">Crear Nuevo Período</h3>
                    
                    <form id="add-period-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Nombre del período
                            </label>
                            <input type="text" id="period-name" value="Cuatrimestre 2 - 2025" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Cuatrimestre 1 - 2025" required>
                        </div>
                        
                        <div class="flex justify-end gap-3">
                            <button type="button" id="cancel-period" class="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Crear
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#add-period-form');
        const cancelBtn = modal.querySelector('#cancel-period');
        const nameInput = modal.querySelector('#period-name');
        
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = nameInput.value.trim();
            
            if (!name) {
                this.notifications.error('El nombre es requerido');
                return;
            }
            
            this.dataManager.data.currentPeriod = name;
            this.dataManager.save();
            this.currentPeriodIndex = 0;
            this.render();
            this.notifications.success('Período creado correctamente');
            document.body.removeChild(modal);
        });
        
        nameInput.focus();
        nameInput.select();
    }
    
    /**
     * Muestra modal para añadir tarea
     */
    showAddTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-white mb-4">Nueva Tarea</h3>
                    
                    <form id="add-task-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Descripción de la tarea
                            </label>
                            <input type="text" id="task-text" class="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Revisar apuntes" required>
                        </div>
                        
                        <div class="flex justify-end gap-3">
                            <button type="button" id="cancel-task" class="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                Añadir
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#add-task-form');
        const cancelBtn = modal.querySelector('#cancel-task');
        const textInput = modal.querySelector('#task-text');
        
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = textInput.value.trim();
            
            if (!text) {
                this.notifications.error('La descripción es requerida');
                return;
            }
            
            if (!this.dataManager.data.dashboardTasks) {
                this.dataManager.data.dashboardTasks = [];
            }
            
            const newTask = {
                id: `task_${Date.now()}`,
                text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.dataManager.data.dashboardTasks.push(newTask);
            this.dataManager.save();
            this.render();
            this.notifications.success('Tarea añadida');
            document.body.removeChild(modal);
        });
        
        textInput.focus();
    }
    
    /**
     * Añade una nueva tarea al checklist (mantiene compatibilidad)
     */
    addTask() {
        this.showAddTaskModal();
    }
    
    /**
     * Marca/desmarca una tarea como completada
     */
    toggleTask(taskId) {
        const tasks = this.dataManager.data.dashboardTasks || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            this.dataManager.save();
            this.render();
        }
    }
    
    /**
     * Elimina una tarea del checklist
     */
    deleteTask(taskId) {
        const tasks = this.dataManager.data.dashboardTasks || [];
        const task = tasks.find(t => t.id === taskId);
        
        this.showConfirmModal(
            '¿Eliminar esta tarea?',
            `Se eliminará "${task?.text || 'esta tarea'}". Esta acción no se puede deshacer.`,
            () => {
                this.dataManager.data.dashboardTasks = tasks.filter(t => t.id !== taskId);
                this.dataManager.save();
                this.render();
                this.notifications.success('Tarea eliminada');
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
    
    /**
     * Carga una frase motivacional
     */
    async loadMotivationalQuote() {
        const quoteElement = document.getElementById('motivational-quote');
        if (!quoteElement) return;
        
        // Frases motivacionales sobre estudio y aprendizaje
        const quotes = [
            'El aprendizaje es un tesoro que seguirá a su dueño a todas partes.',
            'La educación es el arma más poderosa para cambiar el mundo.',
            'El único modo de hacer un gran trabajo es amar lo que haces.',
            'La persistencia es el camino del éxito.',
            'Cada día es una nueva oportunidad para aprender algo nuevo.',
            'El conocimiento es poder.',
            'No te rindas. El comienzo es siempre el más difícil.',
            'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
            'La motivación es lo que te pone en marcha, el hábito es lo que hace que sigas.',
            'El aprendizaje nunca agota la mente.',
            'La educación es el pasaporte hacia el futuro.',
            'Aprende como si fueras a vivir para siempre.',
            'El estudio sin deseo estropea la memoria.',
            'La inteligencia consiste no solo en el conocimiento, sino en la habilidad de aplicarlo.',
            'Todo lo que has aprendido es tu mejor herramienta.',
            'El secreto para salir adelante es comenzar.'
        ];
        
        // Seleccionar una frase aleatoria
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteElement.textContent = randomQuote;
    }
    
    /**
     * Obtiene eventos del mes actual agrupados por día
     */
    getEventsForMonth(year, month) {
        const eventsByDay = {};
        const subjects = this.dataManager.getSubjects();
        
        subjects.forEach(subject => {
            const events = this.dataManager.data.events?.[subject.id] || [];
            events.forEach(event => {
                const eventDate = new Date(event.date);
                if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
                    if (!eventsByDay[dateStr]) {
                        eventsByDay[dateStr] = [];
                    }
                    eventsByDay[dateStr].push({
                        ...event,
                        subjectName: subject.name
                    });
                }
            });
        });
        
        return eventsByDay;
    }
    
    /**
     * Limpia los event listeners del menú de perfil
     */
    cleanupProfileMenuListeners() {
        if (this.handleProfileMenuClick) {
            const profileBtn = this.container?.querySelector('#profile-menu-btn');
            if (profileBtn) {
                profileBtn.removeEventListener('click', this.handleProfileMenuClick);
            }
        }
        
        if (this.handleProfileMenuClose) {
            document.removeEventListener('click', this.handleProfileMenuClose);
        }
    }
    
    /**
     * Renderiza el carrusel de colecciones de quizzes
     */
    renderQuizCarousel() {
        if (!this.quizManager) return '';
        
        const currentPeriod = this.dataManager.data.currentPeriod;
        const subjects = this.dataManager.getSubjects().filter(s => s.period === currentPeriod);
        
        // Obtener todas las colecciones de todas las materias
        const allCollections = [];
        subjects.forEach(subject => {
            const collections = this.quizManager.getCollectionsBySubject(subject.id);
            collections.forEach(collection => {
                allCollections.push({
                    ...collection,
                    subjectName: subject.name,
                    subjectId: subject.id
                });
            });
        });
        
        return `
            <div class="mb-4">
                ${allCollections.length === 0 ? `
                    <!-- Solo título cuando no hay colecciones -->
                    <div class="flex items-center gap-3 mb-3">
                        <div class="flex-1 h-px bg-slate-700/50"></div>
                        <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <i data-lucide="brain" class="w-4 h-4 text-purple-400"></i>
                            Colecciones de Preguntas
                        </h2>
                        <div class="flex-1 h-px bg-slate-700/50"></div>
                    </div>
                ` : `
                    <!-- Separador con título y botón cuando hay colecciones -->
                    <div class="flex items-center gap-3 mb-3">
                        <div class="flex-1 h-px bg-slate-700/50"></div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <i data-lucide="brain" class="w-4 h-4 text-blue-400"></i>
                                Colecciones de Preguntas
                            </h2>
                            <button id="create-quiz-dashboard-btn" class="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1">
                                <i data-lucide="plus" class="w-3 h-3"></i>
                                <span>Crear</span>
                            </button>
                        </div>
                        <div class="flex-1 h-px bg-slate-700/50"></div>
                    </div>
                `}
                
                ${allCollections.length === 0 ? `
                    <!-- Mensaje cuando no hay colecciones (compacto) -->
                    <div class="bg-slate-800/50 border border-dashed border-slate-700 rounded-lg p-4 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i data-lucide="brain" class="w-5 h-5 text-purple-400"></i>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-white">No hay colecciones de preguntas</p>
                                <p class="text-xs text-slate-400">Crea tu primera colección para practicar</p>
                            </div>
                        </div>
                        <button class="create-quiz-cta-btn px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-lg transition-all shadow-md flex items-center gap-2">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            <span>Crear</span>
                        </button>
                    </div>
                ` : `
                    <!-- Carrusel -->
                    <div class="relative quiz-carousel-container" style="z-index: 1;">
                        <button id="quiz-carousel-prev" class="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-slate-700/80 hover:bg-slate-600 rounded-full shadow-lg transition-all opacity-0 hover:opacity-100 -ml-4" style="z-index: 2;">
                            <i data-lucide="chevron-left" class="w-6 h-6 text-white"></i>
                        </button>
                        
                        <div class="overflow-hidden">
                            <div id="quiz-carousel-track" class="flex gap-3 transition-transform duration-300">
                                ${allCollections.map(collection => this.renderQuizCard(collection)).join('')}
                            </div>
                        </div>
                        
                        <button id="quiz-carousel-next" class="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-slate-700/80 hover:bg-slate-600 rounded-full shadow-lg transition-all opacity-0 hover:opacity-100 -mr-4" style="z-index: 2;">
                            <i data-lucide="chevron-right" class="w-6 h-6 text-white"></i>
                        </button>
                    </div>
                    
                    <style>
                        .quiz-carousel-container:hover #quiz-carousel-prev,
                        .quiz-carousel-container:hover #quiz-carousel-next {
                            opacity: 1;
                        }
                    </style>
                `}
            </div>
        `;
    }
    
    /**
     * Renderiza una tarjeta de colección de quiz
     */
    renderQuizCard(collection) {
        const lastStats = this.quizManager.getLastStats(collection.id);
        const questionCount = collection.questions.length;
        
        return `
            <div class="flex-shrink-0 w-64 bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 hover:bg-slate-700/80 transition-all group">
                <!-- Header compacto -->
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-xs font-bold text-white truncate flex items-center gap-1">
                            ${collection.name}
                            ${collection.isPinned ? '<i data-lucide="pin" class="w-2.5 h-2.5 text-amber-400 flex-shrink-0"></i>' : ''}
                        </h3>
                        <p class="text-xs text-slate-500 truncate">${collection.subjectName} • ${collection.topicName}</p>
                    </div>
                    <div class="flex items-center gap-0.5">
                        <button class="pin-quiz-btn opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-600 rounded transition-all flex-shrink-0" 
                                data-collection-id="${collection.id}" 
                                data-topic-id="${collection.topicId}"
                                title="${collection.isPinned ? 'Desfijar' : 'Fijar'}">
                            <i data-lucide="${collection.isPinned ? 'pin-off' : 'pin'}" class="w-3 h-3 text-slate-400"></i>
                        </button>
                        <button class="delete-quiz-btn opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all flex-shrink-0" 
                                data-collection-id="${collection.id}" 
                                data-topic-id="${collection.topicId}"
                                title="Eliminar colección">
                            <i data-lucide="trash-2" class="w-3 h-3 text-red-400"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Info y stats en una línea -->
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-1 text-xs text-indigo-400">
                        <i data-lucide="help-circle" class="w-3 h-3"></i>
                        <span>${questionCount} preguntas</span>
                    </div>
                    ${lastStats ? `
                        <div class="flex items-center gap-1.5 text-xs">
                            <span class="text-emerald-400 font-semibold">${lastStats.correctAnswers}✓</span>
                            <span class="text-red-400 font-semibold">${lastStats.incorrectAnswers}✗</span>
                            <span class="text-white font-bold">${lastStats.accuracy}%</span>
                        </div>
                    ` : `
                        <span class="text-xs text-slate-500">Sin intentos</span>
                    `}
                </div>
                
                <!-- Botón estudiar compacto -->
                <button class="study-quiz-btn w-full py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                        data-collection-id="${collection.id}"
                        data-topic-id="${collection.topicId}">
                    <i data-lucide="play" class="w-3 h-3"></i>
                    <span>Estudiar</span>
                </button>
            </div>
        `;
    }
    
    /**
     * Muestra el modal para crear colección de quizzes
     */
    showCreateQuizModal() {
        if (!this.quizManager) return;
        
        const subjects = this.dataManager.getSubjects();
        if (subjects.length === 0) {
            this.notifications.warning('Primero debes crear al menos una materia');
            return;
        }
        
        // Modal de selección de materia y tema
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.id = 'select-subject-topic-modal';
        
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700">
                <div class="p-6 border-b border-slate-700">
                    <h3 class="text-2xl font-bold text-white mb-2">Selecciona Materia y Tema</h3>
                    <p class="text-sm text-slate-400">Elige dónde quieres crear las preguntas</p>
                </div>
                
                <div class="p-6">
                    <!-- Seleccionar Materia -->
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-white mb-3">1. Selecciona la Materia</label>
                        <div class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            ${subjects.map(subject => `
                                <button class="select-subject-btn text-left p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-all border-2 border-transparent hover:border-indigo-500" data-subject-id="${subject.id}">
                                    <div class="font-semibold text-white">${subject.name}</div>
                                    <div class="text-xs text-slate-400 mt-1">${this.dataManager.getTopics(subject.id).length} temas</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Seleccionar Tema (se mostrará después de seleccionar materia) -->
                    <div id="topic-selection" class="hidden mb-6">
                        <label class="block text-sm font-semibold text-white mb-3">2. Selecciona el Tema</label>
                        <div id="topics-list" class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            <!-- Los temas se cargarán aquí -->
                        </div>
                    </div>
                    
                    <!-- Botones -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button id="cancel-selection" class="px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        let selectedSubjectId = null;
        let selectedTopicId = null;
        
        // Event listeners para materias
        const subjectBtns = modal.querySelectorAll('.select-subject-btn');
        subjectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                selectedSubjectId = btn.dataset.subjectId;
                
                // Marcar como seleccionado
                subjectBtns.forEach(b => {
                    b.classList.remove('border-indigo-500', 'bg-slate-700');
                    b.classList.add('border-transparent');
                });
                btn.classList.add('border-indigo-500', 'bg-slate-700');
                
                // Cargar temas
                const topics = this.dataManager.getTopics(selectedSubjectId);
                const topicSelection = modal.querySelector('#topic-selection');
                const topicsList = modal.querySelector('#topics-list');
                
                if (topics.length === 0) {
                    topicsList.innerHTML = '<p class="text-slate-400 text-sm text-center py-4">Esta materia no tiene temas. Crea uno primero.</p>';
                    topicSelection.classList.remove('hidden');
                    return;
                }
                
                topicsList.innerHTML = topics.map(topic => `
                    <button class="select-topic-btn text-left p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-all border-2 border-transparent hover:border-purple-500" data-topic-id="${topic.id}">
                        <div class="font-semibold text-white">${topic.name}</div>
                        <div class="text-xs text-slate-400 mt-1">Click para seleccionar</div>
                    </button>
                `).join('');
                
                topicSelection.classList.remove('hidden');
                
                // Event listeners para temas
                const topicBtns = modal.querySelectorAll('.select-topic-btn');
                topicBtns.forEach(topicBtn => {
                    topicBtn.addEventListener('click', () => {
                        selectedTopicId = topicBtn.dataset.topicId;
                        const topic = topics.find(t => t.id === selectedTopicId);
                        
                        // Cerrar modal y abrir creador de quiz
                        document.body.removeChild(modal);
                        
                        if (window.QuizCreatorModal) {
                            const quizModal = new window.QuizCreatorModal(this.quizManager, this.dataManager, this.notifications);
                            quizModal.show(selectedTopicId, topic.name);
                        }
                    });
                });
                
                // Inicializar iconos
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
        });
        
        // Botón cancelar
        const cancelBtn = modal.querySelector('#cancel-selection');
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        
        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Obtiene un saludo basado en la hora del día
     */
    getTimeBasedGreeting(userName) {
        const now = new Date();
        const hour = now.getHours();
        
        let greeting;
        if (hour >= 6 && hour < 12) {
            greeting = "¡Buenos días";
        } else if (hour >= 12 && hour < 19) {
            greeting = "¡Buenas tardes";
        } else {
            greeting = "¡Buenas noches";
        }
        
        return `${greeting}, ${userName}!`;
    }
}

export default DashboardView;
