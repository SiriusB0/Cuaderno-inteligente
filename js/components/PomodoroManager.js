/**
 * Gestor de Pomodoro - Sistema de estudio con técnica Pomodoro
 */
class PomodoroManager {
    constructor(dataManager, notifications) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        
        // Configuración del Pomodoro
        this.config = {
            workTime: 25, // minutos
            breakTime: 5, // Un solo tipo de descanso
            music: 'silence' // lofi, rain, silence, nature, jazz, classical, whitenoise, binaurals
        };
        
        // Tipos de sonidos disponibles
        this.soundTypes = [
            { value: 'lofi', icon: 'music', label: 'Lo-fi Beats', color: 'purple' },
            { value: 'rain', icon: 'cloud-rain', label: 'Lluvia', color: 'blue' },
            { value: 'nature', icon: 'trees', label: 'Naturaleza', color: 'emerald' },
            { value: 'jazz', icon: 'music-2', label: 'Jazz Suave', color: 'amber' },
            { value: 'classical', icon: 'music-4', label: 'Clásica', color: 'rose' },
            { value: 'whitenoise', icon: 'radio', label: 'Ruido Blanco', color: 'slate' },
            { value: 'binaurals', icon: 'headphones', label: 'Binaurales', color: 'cyan' },
            { value: 'silence', icon: 'volume-x', label: 'Silencio', color: 'gray' }
        ];
        
        // Estado del timer
        this.isRunning = false;
        this.isPaused = false;
        this.isWaitingForStart = false; // Esperando a que el usuario inicie la siguiente sesión
        this.currentMode = 'work'; // work, break
        this.timeRemaining = 0; // en segundos
        this.sessionsCompleted = 0;
        this.currentSubjectId = null;
        this.timerInterval = null;
        this.sessionStartTime = null;
        this.totalStudyTime = 0; // segundos estudiados en esta sesión
        
        // Audio
        this.audioElement = null;
        
        // Inicializar audios personalizados si existen
        this.loadCustomAudios();
    }
    
    /**
     * Muestra el modal de configuración del Pomodoro
     */
    showConfigModal(subjectId) {
        this.currentSubjectId = subjectId;
        
        const modal = document.createElement('div');
        modal.id = 'pomodoro-modal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i data-lucide="timer" class="w-7 h-7 text-white"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-white">Pomodoro</h2>
                                <p class="text-indigo-100 text-sm">Configura tu sesión de estudio</p>
                            </div>
                        </div>
                        <button id="close-pomodoro-modal" class="text-white/80 hover:text-white transition-colors">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- Configuración de tiempos -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                <i data-lucide="brain" class="w-4 h-4 inline mr-1"></i>
                                Tiempo de trabajo
                            </label>
                            <div class="flex items-center gap-2">
                                <input type="number" id="work-time" value="${this.config.workTime}" min="1" max="60" 
                                    class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                <span class="text-slate-400 text-sm">min</span>
                            </div>
                        </div>
                        
                        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                <i data-lucide="coffee" class="w-4 h-4 inline mr-1"></i>
                                Descanso
                            </label>
                            <div class="flex items-center gap-2">
                                <input type="number" id="break-time" value="${this.config.breakTime}" min="1" max="30" 
                                    class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                <span class="text-slate-400 text-sm">min</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Música ambiental con botón -->
                    <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <div class="flex items-center justify-between mb-3">
                            <label class="block text-sm font-medium text-slate-300">
                                <i data-lucide="music" class="w-4 h-4 inline mr-1"></i>
                                Música de fondo
                            </label>
                            <button id="toggle-music-selector" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2">
                                <i data-lucide="volume-2" class="w-4 h-4"></i>
                                <span class="text-sm" id="current-music-label">${this.getMusicLabel(this.config.music)}</span>
                                <i data-lucide="chevron-down" class="w-3 h-3"></i>
                            </button>
                        </div>
                        <div id="music-selector" class="hidden grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            ${this.renderMusicOptions()}
                        </div>
                    </div>
                    
                    <!-- Información -->
                    <div class="bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-4">
                        <div class="flex gap-3">
                            <div class="flex-shrink-0">
                                <i data-lucide="info" class="w-5 h-5 text-indigo-400"></i>
                            </div>
                            <div class="text-sm text-indigo-200">
                                <p class="font-semibold mb-1">Técnica Pomodoro</p>
                                <p class="text-indigo-300">Trabaja concentrado durante el tiempo establecido, luego toma un descanso. El tiempo estudiado se sumará a tus estadísticas.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="bg-slate-900/50 p-6 border-t border-slate-700 flex justify-end gap-3">
                    <button id="cancel-pomodoro" class="px-6 py-2.5 text-slate-300 hover:text-white transition-colors font-medium">
                        Cancelar
                    </button>
                    <button id="start-pomodoro" class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2">
                        <i data-lucide="play" class="w-5 h-5"></i>
                        <span>Comenzar</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('close-pomodoro-modal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-pomodoro')?.addEventListener('click', () => this.closeModal());
        document.getElementById('start-pomodoro')?.addEventListener('click', () => this.startPomodoro());
        
        // Toggle music selector
        document.getElementById('toggle-music-selector')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const selector = document.getElementById('music-selector');
            if (selector) {
                selector.classList.toggle('hidden');
            }
        });
        
        // Music option listeners
        document.querySelectorAll('input[name="music"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const label = document.getElementById('current-music-label');
                if (label) {
                    label.textContent = this.getMusicLabel(e.target.value);
                }
                // Ocultar selector después de seleccionar
                const selector = document.getElementById('music-selector');
                if (selector) {
                    setTimeout(() => selector.classList.add('hidden'), 200);
                }
            });
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Obtiene la etiqueta de la música
     */
    getMusicLabel(musicType) {
        const sound = this.soundTypes.find(s => s.value === musicType);
        return sound ? sound.label : 'Silencio';
    }
    
    /**
     * Renderiza las opciones de música
     */
    renderMusicOptions() {
        return this.soundTypes.map(opt => {
            const hasCustomAudio = this.hasCustomAudio(opt.value);
            return `
                <label class="relative cursor-pointer">
                    <input type="radio" name="music" value="${opt.value}" ${this.config.music === opt.value ? 'checked' : ''} class="peer hidden">
                    <div class="p-3 rounded-lg border-2 border-slate-700 peer-checked:border-${opt.color}-500 peer-checked:bg-${opt.color}-500/20 hover:border-slate-600 transition-all text-center">
                        ${hasCustomAudio ? '<div class="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" title="Audio personalizado"></div>' : ''}
                        <i data-lucide="${opt.icon}" class="w-6 h-6 mx-auto mb-1 text-slate-400 peer-checked:text-${opt.color}-400"></i>
                        <p class="text-xs text-slate-400 peer-checked:text-${opt.color}-300 font-medium">${opt.label}</p>
                    </div>
                </label>
            `;
        }).join('');
    }
    
    /**
     * Renderiza los controles según el estado actual
     */
    renderControls() {
        // Si está esperando que el usuario inicie la siguiente sesión
        if (this.isWaitingForStart) {
            if (this.currentMode === 'work') {
                // Terminó el descanso, mostrar botón para iniciar trabajo
                return `
                    <button id="pomodoro-start-work" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
                        <i data-lucide="play" class="w-4 h-4"></i>
                        <span>Empezar Pomodoro</span>
                    </button>
                    <button id="pomodoro-stop" class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" title="Finalizar">
                        <i data-lucide="square" class="w-4 h-4"></i>
                    </button>
                `;
            } else {
                // Terminó el trabajo, mostrar botón para iniciar descanso
                return `
                    <button id="pomodoro-start-break" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors">
                        <i data-lucide="coffee" class="w-4 h-4"></i>
                        <span>Empezar Descanso</span>
                    </button>
                    <button id="pomodoro-stop" class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" title="Finalizar">
                        <i data-lucide="square" class="w-4 h-4"></i>
                    </button>
                `;
            }
        }
        
        // Controles normales cuando está corriendo
        return `
            <button id="pomodoro-pause" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors">
                <i data-lucide="${this.isPaused ? 'play' : 'pause'}" class="w-4 h-4"></i>
                <span>${this.isPaused ? 'Reanudar' : 'Pausar'}</span>
            </button>
            <button id="pomodoro-stop" class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" title="Finalizar">
                <i data-lucide="square" class="w-4 h-4"></i>
            </button>
        `;
    }
    
    /**
     * Inicia el Pomodoro
     */
    startPomodoro() {
        // Guardar configuración
        const workTime = parseInt(document.getElementById('work-time')?.value || 25);
        const breakTime = parseInt(document.getElementById('break-time')?.value || 5);
        const music = document.querySelector('input[name="music"]:checked')?.value || 'silence';
        
        this.config = {
            workTime,
            breakTime,
            music
        };
        
        // Cerrar modal
        this.closeModal();
        
        // Inicializar sesión
        this.currentMode = 'work';
        this.timeRemaining = this.config.workTime * 60;
        this.sessionsCompleted = 0;
        this.sessionStartTime = Date.now();
        this.totalStudyTime = 0;
        this.isRunning = true;
        this.isPaused = false;
        
        // Mostrar widget flotante
        this.showPomodoroWidget();
        
        // Iniciar música
        if (this.config.music !== 'silence') {
            this.playMusic(this.config.music);
        }
        
        // Iniciar timer
        this.startTimer();
        
        this.notifications.success('¡Pomodoro iniciado! Concéntrate en tu estudio 🍅');
    }
    
    /**
     * Muestra el widget flotante del Pomodoro
     */
    showPomodoroWidget() {
        // Remover widget existente si hay
        const existing = document.getElementById('pomodoro-widget');
        if (existing) existing.remove();
        
        const widget = document.createElement('div');
        widget.id = 'pomodoro-widget';
        widget.className = 'fixed bottom-6 right-6 z-50';
        widget.innerHTML = `
            <div class="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 min-w-[280px]">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <span class="text-sm font-medium text-slate-400" id="pomodoro-mode">${this.getModeText()}</span>
                    <div class="flex items-center gap-2">
                        <button id="hide-pomodoro-widget" class="text-slate-500 hover:text-slate-300 transition-colors" title="Ocultar (pestaña lateral)">
                            <i data-lucide="chevrons-right" class="w-4 h-4"></i>
                        </button>
                        <button id="close-pomodoro-widget" class="text-slate-500 hover:text-slate-300 transition-colors" title="Cerrar">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Timer -->
                <div class="text-center mb-6">
                    <div class="text-5xl font-bold text-slate-200 font-mono mb-2" id="pomodoro-display">
                        ${this.formatTime(this.timeRemaining)}
                    </div>
                    <div class="text-xs text-slate-500">
                        <span id="session-counter">Sesión ${this.sessionsCompleted + 1}</span>
                    </div>
                </div>
                
                <!-- Progress bar -->
                <div class="w-full bg-slate-700 rounded-full h-1.5 mb-4">
                    <div id="pomodoro-progress" class="h-1.5 rounded-full transition-all duration-1000 bg-slate-500" style="width: 100%"></div>
                </div>
                
                <!-- Controls -->
                <div id="pomodoro-controls" class="flex items-center justify-center gap-3">
                    ${this.renderControls()}
                </div>
            </div>
        `;
        
        document.body.appendChild(widget);
        
        // Event listeners
        this.attachWidgetListeners();
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Adjunta event listeners al widget
     */
    attachWidgetListeners() {
        document.getElementById('pomodoro-pause')?.addEventListener('click', () => this.togglePause());
        document.getElementById('pomodoro-stop')?.addEventListener('click', () => this.stopPomodoro());
        document.getElementById('pomodoro-start-work')?.addEventListener('click', () => this.startWorkSession());
        document.getElementById('pomodoro-start-break')?.addEventListener('click', () => this.startBreakSession());
        document.getElementById('hide-pomodoro-widget')?.addEventListener('click', () => this.hideToTab());
        document.getElementById('close-pomodoro-widget')?.addEventListener('click', () => this.stopPomodoro());
    }
    
    /**
     * Inicia una nueva sesión de trabajo
     */
    startWorkSession() {
        this.currentMode = 'work';
        this.timeRemaining = this.config.workTime * 60;
        this.isWaitingForStart = false;
        this.isRunning = true;
        this.isPaused = false;
        this.sessionStartTime = Date.now();
        this.updateWidget();
        this.notifications.success('¡Pomodoro iniciado! Concéntrate en tu estudio 🍅');
        
        // Reproducir música si está configurada
        if (this.config.music !== 'silence' && !this.audioElement) {
            this.playMusic(this.config.music);
        }
    }
    
    /**
     * Inicia una sesión de descanso
     */
    startBreakSession() {
        this.currentMode = 'break';
        this.timeRemaining = this.config.breakTime * 60;
        this.isWaitingForStart = false;
        this.isRunning = true;
        this.isPaused = false;
        this.updateWidget();
        this.notifications.info('Descanso iniciado. Relájate un momento ☕');
        
        // Reproducir música si está configurada
        if (this.config.music !== 'silence' && !this.audioElement) {
            this.playMusic(this.config.music);
        }
    }
    
    /**
     * Inicia el timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                this.timeRemaining--;
                
                // Si estamos en modo trabajo, acumular tiempo
                if (this.currentMode === 'work') {
                    this.totalStudyTime++;
                }
                
                this.updateDisplay();
                
                // Verificar si terminó el tiempo
                if (this.timeRemaining <= 0) {
                    this.handleSessionComplete();
                }
            }
        }, 1000);
    }
    
    /**
     * Actualiza el display del timer
     */
    updateDisplay() {
        // Actualizar widget completo
        const display = document.getElementById('pomodoro-display');
        const progress = document.getElementById('pomodoro-progress');
        
        if (display) {
            display.textContent = this.formatTime(this.timeRemaining);
        }
        
        if (progress) {
            const totalTime = this.currentMode === 'work' 
                ? this.config.workTime * 60 
                : this.config.breakTime * 60;
            const percentage = (this.timeRemaining / totalTime) * 100;
            progress.style.width = `${percentage}%`;
        }
        
        // Actualizar pestaña lateral si está visible
        const tab = document.getElementById('pomodoro-tab');
        if (tab) {
            const tabTime = tab.querySelector('.font-mono');
            if (tabTime) {
                tabTime.textContent = this.formatTime(this.timeRemaining);
            }
        }
    }
    
    /**
     * Maneja el final de una sesión
     */
    handleSessionComplete() {
        // Detener timer
        this.isRunning = false;
        this.timeRemaining = 0;
        
        // Reproducir alarma personalizada o por defecto
        this.playAlarm();
        
        // Detener música de fondo
        if (this.audioElement) {
            if (this.audioElement.pause) {
                this.audioElement.pause();
            } else {
                this.audioElement.remove();
            }
            this.audioElement = null;
        }
        
        // Cambiar estado según modo actual
        if (this.currentMode === 'work') {
            // Terminó trabajo, preparar para descanso
            this.sessionsCompleted++;
            this.currentMode = 'break';
            this.isWaitingForStart = true;
            this.notifications.success('¡Pomodoro completado! Haz clic para comenzar el descanso ☕');
        } else {
            // Terminó descanso, preparar para trabajo
            this.currentMode = 'work';
            this.isWaitingForStart = true;
            this.notifications.info('Descanso terminado. Haz clic para comenzar otro Pomodoro 🍅');
        }
        
        // Actualizar widget para mostrar botones de inicio
        this.updateWidget();
    }
    
    /**
     * Actualiza el widget después de cambios
     */
    updateWidget() {
        const widget = document.getElementById('pomodoro-widget');
        if (widget) {
            widget.remove();
            this.showPomodoroWidget();
        }
    }
    
    /**
     * Pausa/reanuda el timer
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        const btn = document.getElementById('pomodoro-pause');
        if (btn) {
            btn.innerHTML = `
                <i data-lucide="${this.isPaused ? 'play' : 'pause'}" class="w-4 h-4"></i>
                <span>${this.isPaused ? 'Reanudar' : 'Pausar'}</span>
            `;
            if (window.lucide) window.lucide.createIcons();
        }
        
        this.notifications.info(this.isPaused ? 'Pomodoro pausado' : 'Pomodoro reanudado');
    }
    
    /**
     * Salta la sesión actual
     */
    skipSession() {
        this.timeRemaining = 0;
        this.handleSessionComplete();
    }
    
    /**
     * Detiene el Pomodoro completamente
     */
    stopPomodoro() {
        if (!confirm('¿Finalizar la sesión de Pomodoro? El tiempo estudiado se guardará en tus estadísticas.')) {
            return;
        }
        
        // Guardar estadísticas
        this.saveStudyStats();
        
        // Limpiar
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }
        
        const widget = document.getElementById('pomodoro-widget');
        if (widget) widget.remove();
        
        this.isRunning = false;
        this.notifications.success(`Sesión finalizada. Estudiaste ${Math.floor(this.totalStudyTime / 60)} minutos 🎓`);
    }
    
    /**
     * Oculta el widget a pestaña lateral
     */
    hideToTab() {
        const widget = document.getElementById('pomodoro-widget');
        if (widget) widget.remove();
        
        // Crear pestaña lateral
        const tab = document.createElement('div');
        tab.id = 'pomodoro-tab';
        tab.style.position = 'fixed';
        tab.style.right = '0';
        tab.style.top = '50vh';
        tab.style.zIndex = '50';
        tab.style.transition = 'top 0.15s ease-out';
        tab.innerHTML = `
            <div class="pomodoro-tab-handle" style="background: rgba(100, 116, 139, 0.3); backdrop-filter: blur(4px); border-radius: 8px 0 0 8px; box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.2); padding: 8px 6px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); color: rgba(203, 213, 225, 0.6); width: 20px; height: 50px; display: flex; align-items: center; justify-content: center; cursor: grab;" onmouseover="this.style.width='24px'; this.style.background='rgba(99, 102, 241, 0.4)'; this.style.boxShadow='-3px 3px 12px rgba(0, 0, 0, 0.3)'; this.style.color='rgba(255, 255, 255, 0.9)';" onmouseout="this.style.width='20px'; this.style.background='rgba(100, 116, 139, 0.3)'; this.style.boxShadow='-2px 2px 8px rgba(0, 0, 0, 0.2)'; this.style.color='rgba(203, 213, 225, 0.6)';">
                <i data-lucide="timer" style="width: 14px; height: 14px;"></i>
            </div>
        `;
        
        document.body.appendChild(tab);
        
        const handle = tab.querySelector('.pomodoro-tab-handle');
        let isDragging = false;
        let hasMoved = false;
        let startY = 0;
        let startTop = 0;
        
        // Drag para reposicionar verticalmente
        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            e.preventDefault();
            isDragging = true;
            hasMoved = false;
            startY = e.clientY;
            
            const currentTop = tab.style.top;
            if (currentTop && currentTop.includes('vh')) {
                const vhValue = parseFloat(currentTop);
                startTop = (vhValue / 100) * window.innerHeight;
            } else {
                startTop = parseInt(currentTop) || tab.offsetTop;
            }
            
            handle.style.cursor = 'grabbing';
            
            const onMouseMove = (e) => {
                if (!isDragging) return;
                
                const deltaY = e.clientY - startY;
                if (Math.abs(deltaY) > 3) hasMoved = true;
                
                let newTop = startTop + deltaY;
                
                const handleHeight = handle.offsetHeight;
                const minTop = 20;
                const maxTop = window.innerHeight - handleHeight - 20;
                
                newTop = Math.max(minTop, Math.min(newTop, maxTop));
                
                tab.style.top = `${newTop}px`;
            };
            
            const onMouseUp = () => {
                isDragging = false;
                handle.style.cursor = 'grab';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                setTimeout(() => { hasMoved = false; }, 100);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        // Event listener para expandir (solo si no se arrastró)
        handle.addEventListener('click', (e) => {
            if (!hasMoved) {
                tab.remove();
                this.showPomodoroWidget();
            }
        });
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Guarda las estadísticas de estudio
     */
    saveStudyStats() {
        if (!this.currentSubjectId || this.totalStudyTime === 0) return;
        
        const today = new Date().toISOString().split('T')[0];
        const minutesStudied = Math.floor(this.totalStudyTime / 60);
        
        if (!this.dataManager.data.studyStats) {
            this.dataManager.data.studyStats = {};
        }
        
        if (!this.dataManager.data.studyStats[today]) {
            this.dataManager.data.studyStats[today] = {};
        }
        
        if (!this.dataManager.data.studyStats[today][this.currentSubjectId]) {
            this.dataManager.data.studyStats[today][this.currentSubjectId] = 0;
        }
        
        this.dataManager.data.studyStats[today][this.currentSubjectId] += minutesStudied;
        this.dataManager.save();
        
        console.log(`Guardado: ${minutesStudied} minutos para ${this.currentSubjectId} en ${today}`);
    }
    
    /**
     * Reproduce música ambiental
     */
    playMusic(type) {
        if (type === 'silence') return;
        
        // Verificar si hay audio personalizado
        const customAudio = this.dataManager.data.customPomodoroAudios?.[type];
        
        if (customAudio && customAudio.data) {
            // Reproducir audio personalizado
            this.playCustomAudio(customAudio.data);
        } else {
            // Reproducir audio por defecto (YouTube)
            this.playDefaultMusic(type);
        }
    }
    
    /**
     * Reproduce audio personalizado en bucle
     */
    playCustomAudio(audioData) {
        const audio = new Audio(audioData);
        audio.loop = true; // Reproducir en bucle
        audio.volume = 0.5;
        
        audio.play().catch(err => {
            console.error('Error al reproducir audio:', err);
            this.notifications.warning('No se pudo reproducir el audio. Interactúa con la página primero.');
        });
        
        this.audioElement = audio;
    }
    
    /**
     * Reproduce música por defecto (silencio - no hay por defecto)
     */
    playDefaultMusic(type) {
        // Ya no hay música por defecto
        // El usuario debe subir sus propios audios
        this.notifications.warning(`No hay audio configurado para ${this.getMusicLabel(type)}. Ve a Configurar Pomodoro.`);
    }
    
    /**
     * Reproduce la alarma cuando termina una sesión
     */
    playAlarm() {
        // Verificar si hay alarma personalizada
        const customAlarm = this.dataManager.data.customPomodoroAudios?.alarm;
        
        if (customAlarm && customAlarm.data) {
            // Reproducir alarma personalizada
            const audio = new Audio(customAlarm.data);
            audio.volume = 0.7;
            audio.play().catch(err => {
                console.error('Error al reproducir alarma:', err);
            });
        } else {
            // Alarma por defecto (beep simple)
            this.playDefaultAlarm();
        }
    }
    
    /**
     * Reproduce alarma por defecto (beep simple)
     */
    playDefaultAlarm() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Beep simple de 3 tonos
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        const duration = 0.15;
        
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + (index * duration);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }
    
    /**
     * Reproduce sonido de completado agradable
     */
    playCompletionSound() {
        // Crear un sonido de campana agradable (notas músicales ascendentes)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Notas: C5, E5, G5 (acorde Do mayor)
        const notes = [523.25, 659.25, 783.99];
        const duration = 0.15; // Duración de cada nota
        
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine'; // Sonido suave tipo campana
            
            // Envelope ADSR para sonido más natural
            const startTime = audioContext.currentTime + (index * duration);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02); // Attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Decay
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }
    
    /**
     * Formatea el tiempo en MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Obtiene el texto del modo actual
     */
    getModeText() {
        if (this.isWaitingForStart) {
            return this.currentMode === 'work' ? '⏸️ Listo para trabajar' : '⏸️ Listo para descansar';
        }
        
        const modes = {
            work: '🍅 Tiempo de trabajo',
            break: '☕ Descanso'
        };
        return modes[this.currentMode] || 'Pomodoro';
    }
    
    /**
     * Cierra el modal
     */
    closeModal() {
        const modal = document.getElementById('pomodoro-modal');
        if (modal) modal.remove();
    }
    
    /**
     * Carga audios personalizados desde el almacenamiento
     */
    loadCustomAudios() {
        if (!this.dataManager.data.customPomodoroAudios) {
            this.dataManager.data.customPomodoroAudios = {};
        }
    }
    
    /**
     * Verifica si hay audio personalizado para un tipo
     */
    hasCustomAudio(soundType) {
        return this.dataManager.data.customPomodoroAudios && 
               this.dataManager.data.customPomodoroAudios[soundType] && 
               this.dataManager.data.customPomodoroAudios[soundType].data;
    }
    
    /**
     * Guarda un audio personalizado
     */
    saveCustomAudio(soundType, audioData, fileName) {
        if (!this.dataManager.data.customPomodoroAudios) {
            this.dataManager.data.customPomodoroAudios = {};
        }
        
        this.dataManager.data.customPomodoroAudios[soundType] = {
            data: audioData,
            fileName: fileName,
            uploadDate: new Date().toISOString()
        };
        
        this.dataManager.save();
        console.log(`Audio personalizado guardado para ${soundType}: ${fileName}`);
    }
    
    /**
     * Elimina un audio personalizado
     */
    deleteCustomAudio(soundType) {
        if (this.dataManager.data.customPomodoroAudios && 
            this.dataManager.data.customPomodoroAudios[soundType]) {
            delete this.dataManager.data.customPomodoroAudios[soundType];
            this.dataManager.save();
            console.log(`Audio personalizado eliminado para ${soundType}`);
        }
    }
    
    /**
     * Muestra modal de configuración de audios
     */
    showAudioConfigModal() {
        const modal = document.createElement('div');
        modal.id = 'audio-config-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-6 border-b border-slate-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                                <i data-lucide="settings" class="w-6 h-6"></i>
                                Configurar Audios Pomodoro
                            </h2>
                            <p class="text-sm text-slate-400 mt-1">Sube tus propios audios para cada tipo de sonido</p>
                        </div>
                        <button id="close-audio-config" class="text-slate-400 hover:text-white transition-colors">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6 overflow-y-auto flex-1">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${this.renderAudioConfigOptions()}
                    </div>
                    
                    <!-- Info -->
                    <div class="mt-6 bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-4">
                        <div class="flex gap-3">
                            <div class="flex-shrink-0">
                                <i data-lucide="info" class="w-5 h-5 text-indigo-400"></i>
                            </div>
                            <div class="text-sm text-indigo-200">
                                <p class="font-semibold mb-1">Formatos soportados</p>
                                <p class="text-indigo-300">MP3, WAV, OGG, M4A • Máximo 20MB por archivo • Los audios se reproducen en bucle</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('close-audio-config')?.addEventListener('click', () => this.closeAudioConfigModal());
        
        // Listeners para botones de subida (incluir alarma)
        const alarmOption = { value: 'alarm', label: 'Alarma' };
        const allOptions = [alarmOption, ...this.soundTypes];
        
        allOptions.forEach(sound => {
            const uploadBtn = document.getElementById(`upload-${sound.value}`);
            const deleteBtn = document.getElementById(`delete-${sound.value}`);
            const fileInput = document.getElementById(`file-${sound.value}`);
            
            if (uploadBtn && fileInput) {
                uploadBtn.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => this.handleAudioUpload(e, sound.value));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.handleAudioDelete(sound.value));
            }
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAudioConfigModal();
        });
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Renderiza las opciones de configuración de audio
     */
    renderAudioConfigOptions() {
        // Agregar alarma al principio
        const alarmOption = {
            value: 'alarm',
            icon: 'bell',
            label: 'Alarma de finalización',
            color: 'red'
        };
        
        const allOptions = [alarmOption, ...this.soundTypes.filter(s => s.value !== 'silence')];
        
        return allOptions.map(sound => {
            const hasAudio = this.hasCustomAudio(sound.value);
            const audioData = this.dataManager.data.customPomodoroAudios?.[sound.value];
            
            return `
                <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <i data-lucide="${sound.icon}" class="w-5 h-5 text-${sound.color}-400"></i>
                            <h3 class="font-semibold text-white">${sound.label}</h3>
                        </div>
                        ${hasAudio ? '<span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Configurado</span>' : '<span class="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">Sin audio</span>'}
                    </div>
                    
                    ${hasAudio ? `
                        <div class="mb-3 p-2 bg-slate-900/50 rounded-lg">
                            <p class="text-xs text-slate-400 truncate">${audioData.fileName}</p>
                            <p class="text-xs text-slate-500 mt-1">Subido: ${new Date(audioData.uploadDate).toLocaleDateString()}</p>
                        </div>
                    ` : ''}
                    
                    <div class="flex gap-2">
                        <button id="upload-${sound.value}" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-${sound.color}-600 hover:bg-${sound.color}-700 text-white rounded-lg transition-colors text-sm font-medium">
                            <i data-lucide="upload" class="w-4 h-4"></i>
                            ${hasAudio ? 'Cambiar' : 'Subir'}
                        </button>
                        ${hasAudio ? `
                            <button id="delete-${sound.value}" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" title="Eliminar audio">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>
                    <input type="file" id="file-${sound.value}" accept="audio/*" class="hidden">
                </div>
            `;
        }).join('');
    }
    
    /**
     * Maneja la subida de audio
     */
    async handleAudioUpload(event, soundType) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validar tipo
        if (!file.type.startsWith('audio/')) {
            this.notifications.error('El archivo debe ser un audio válido');
            return;
        }
        
        // Validar tamaño (20MB)
        if (file.size > 20 * 1024 * 1024) {
            this.notifications.error('El archivo es muy grande. Máximo 20MB');
            return;
        }
        
        try {
            // Convertir a base64
            const reader = new FileReader();
            reader.onload = (e) => {
                this.saveCustomAudio(soundType, e.target.result, file.name);
                const label = soundType === 'alarm' ? 'Alarma' : this.getMusicLabel(soundType);
                this.notifications.success(`Audio de ${label} guardado`);
                
                // Recargar modal
                this.closeAudioConfigModal();
                setTimeout(() => this.showAudioConfigModal(), 100);
            };
            reader.onerror = () => {
                this.notifications.error('Error al cargar el archivo');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error al subir audio:', error);
            this.notifications.error('Error al guardar el audio');
        }
    }
    
    /**
     * Maneja la eliminación de audio
     */
    handleAudioDelete(soundType) {
        const label = soundType === 'alarm' ? 'Alarma' : this.getMusicLabel(soundType);
        if (confirm(`¿Eliminar el audio de ${label}?`)) {
            this.deleteCustomAudio(soundType);
            this.notifications.success('Audio eliminado');
            
            // Recargar modal
            this.closeAudioConfigModal();
            setTimeout(() => this.showAudioConfigModal(), 100);
        }
    }
    
    /**
     * Cierra el modal de configuración de audios
     */
    closeAudioConfigModal() {
        const modal = document.getElementById('audio-config-modal');
        if (modal) modal.remove();
    }
}

export default PomodoroManager;
