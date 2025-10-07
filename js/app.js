// Aplicación principal - Cuaderno Inteligente
import DataManager from './core/DataManager.js';
import Router from './core/Router.js';
import NotificationManager from './components/NotificationManager.js';
import PomodoroManager from './components/PomodoroManager.js';
import DashboardView from './views/DashboardView.js';
import QuizManager from './components/QuizManager.js';
import QuizCreatorModal from './views/QuizCreatorModal.js';
import QuizStudyModal from './views/QuizStudyModal.js';
import SubjectsView from './views/SubjectsView.js';
import TopicsView from './views/TopicsView.js';
import StudyView from './views/StudyView.js';
import PresentationView from './views/PresentationView.js';
import { createSupabaseClient } from '../supabase-config.js';

/**
 * Clase principal de la aplicación
 */
class CuadernoInteligente {
    constructor() {
        this.dataManager = null;
        this.router = null;
        this.notifications = null;
        this.views = {};
        this.supabase = createSupabaseClient();
        
        this.init();
    }
    
    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            // auth.js ya maneja la autenticación, solo inicializar componentes
            
            // Inicializar componentes core
            this.dataManager = new DataManager();
            this.router = new Router();
            this.notifications = new NotificationManager();
            
            // Inicializar managers
            this.pomodoroManager = new PomodoroManager(this.dataManager, this.notifications);
            this.quizManager = new QuizManager(this.dataManager, this.notifications);
            
            // Hacer disponibles globalmente para los modales
            window.QuizCreatorModal = QuizCreatorModal;
            window.QuizStudyModal = QuizStudyModal;
            
            // Inicializar vistas
            this.initializeViews();
            
            // Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            // Configurar listeners de datos
            this.setupDataListeners();
            
            // Inicializar router
            this.router.initialize();
            
            // Inicializar iconos de Lucide
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            // Mostrar notificación de bienvenida
            this.showWelcomeMessage();
            
            // Hacer funciones disponibles globalmente (auth.js ya las tiene)
            window.showSettingsModal = window.showSettingsModal || function() {
                console.warn('showSettingsModal no disponible');
            };
            window.logout = () => {
                if (window.authManager) {
                    window.authManager.logout();
                }
            };
            
            console.log('✅ Aplicación inicializada');
            
        } catch (error) {
            console.error('Error inicializando aplicación:', error);
            alert('Error al inicializar la aplicación: ' + error.message);
        }
    }
    
    /**
     * Inicializa todas las vistas
     */
    initializeViews() {
        // Vista de dashboard
        this.views.dashboard = new DashboardView(
            this.dataManager,
            this.router,
            this.notifications,
            this.pomodoroManager,
            this.quizManager
        );
        
        this.views.subjects = new SubjectsView(
            this.dataManager, 
            this.router, 
            this.notifications
        );
        
        this.views.topics = new TopicsView(
            this.dataManager, 
            this.router, 
            this.notifications,
            this.quizManager
        );
        
        this.views.study = new StudyView(
            this.dataManager, 
            this.router, 
            this.notifications
        );
        
        this.views.presentation = new PresentationView(
            this.dataManager, 
            this.router, 
            this.notifications
        );
    }
    
    /**
     * Configura event listeners globales
     */
    setupGlobalEventListeners() {
        // Manejo de errores globales
        window.addEventListener('error', (event) => {
            // Ignorar errores de recursos (imágenes, scripts externos)
            if (event.target !== window) {
                return;
            }
            
            // Solo mostrar si hay un error real
            if (event.error) {
                console.error('Error global:', event.error);
                this.notifications.error('Ha ocurrido un error inesperado');
            }
        });
        
        // Manejo de promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada:', event.reason);
            this.notifications.error('Error en operación asíncrona');
        });
        
        // Auto-guardado antes de cerrar
        window.addEventListener('beforeunload', () => {
            this.dataManager.save();
        });
        
        // Atajos de teclado globales
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });
        
        // Manejo de cambios de tema
        this.setupThemeToggle();
    }
    
    /**
     * Configura listeners para cambios de datos
     */
    setupDataListeners() {
        // Escuchar cambios en el router
        this.router.on('navigationChanged', (event) => {
            this.handleNavigation(event);
        });
        
        // Escuchar eventos de datos
        this.dataManager.on('dataSaved', () => {
            console.log('Datos guardados correctamente');
        });
        
        this.dataManager.on('saveError', (error) => {
            console.error('Error guardando datos:', error);
            this.notifications.error('Error al guardar datos');
        });
    }
    
    /**
     * Maneja la navegación entre vistas
     */
    handleNavigation(event) {
        const { to, data } = event;
        
        // Renderizar vista correspondiente
        switch (to) {
            case 'dashboard':
                this.views.dashboard.render();
                break;
            case 'subjects':
                this.views.subjects.render();
                break;
            case 'topics':
                this.views.topics.render(data);
                break;
            case 'study':
                this.views.study.render(data);
                break;
            case 'presentation':
                this.views.presentation.render(data);
                break;
        }
        
        // Actualizar iconos después de renderizar
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Maneja atajos de teclado globales
     */
    handleGlobalKeyboard(e) {
        // === LAYOUT ===
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            this.toggleLeftSidebar();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
            e.preventDefault();
            this.toggleRightSidebar();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            this.toggleHeader();
            return;
        }
    }
    
    /**
     * Configura el toggle de tema
     */
    setupThemeToggle() {
        // Detectar preferencia del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else {
            document.documentElement.classList.toggle('dark', prefersDark);
        }
        
        // Escuchar cambios en preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.classList.toggle('dark', e.matches);
            }
        });
    }
    
    /**
     * Oculta/muestra el sidebar izquierdo
     */
    toggleLeftSidebar() {
        const grid = document.getElementById('study-content-grid');
        if (!grid) return;

        if (grid.classList.contains('hide-left')) {
            grid.classList.remove('hide-left');
            this.notifications.info('Sidebar izquierdo visible');
        } else {
            grid.classList.add('hide-left');
            this.notifications.info('Sidebar izquierdo oculto');
        }
    }

    /**
     * Oculta/muestra el sidebar derecho
     */
    toggleRightSidebar() {
        const grid = document.getElementById('study-content-grid');
        if (!grid) return;

        if (grid.classList.contains('hide-right')) {
            grid.classList.remove('hide-right');
            this.notifications.info('Sidebar derecho visible');
        } else {
            grid.classList.add('hide-right');
            this.notifications.info('Sidebar derecho oculto');
        }
    }

    /**
     * Oculta/muestra el header
     */
    toggleHeader() {
        const header = document.querySelector('#study-view header');
        if (!header) return;

        if (header.classList.contains('header-hidden')) {
            header.classList.remove('header-hidden');
            this.notifications.info('Header visible');
        } else {
            header.classList.add('header-hidden');
            this.notifications.info('Header oculto');
        }
    }
    
    /**
     * Cierra todos los modales abiertos
     */
    closeModals() {
        const modals = document.querySelectorAll('[id$="-modal"]');
        modals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }
    
    
    /**
     * Muestra mensaje de bienvenida
     */
    showWelcomeMessage() {
        const stats = this.dataManager.getStats();
        
        if (stats && stats.subjects > 0) {
            this.notifications.success(
                `¡Bienvenido de vuelta! Tienes ${stats.subjects} materias y ${stats.pages} páginas.`,
                3000
            );
        } else {
            this.notifications.info(
                '¡Bienvenido al Cuaderno Inteligente! Comienza creando tu primera materia.',
                5000
            );
        }
    }
    
    /**
     * Obtiene la instancia del data manager
     */
    getDataManager() {
        return this.dataManager;
    }
    
    /**
     * Obtiene la instancia del router
     */
    getRouter() {
        return this.router;
    }
    
    /**
     * Obtiene la instancia del notification manager
     */
    getNotifications() {
        return this.notifications;
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global de la aplicación
    window.cuadernoApp = new CuadernoInteligente();
});

// Exportar para uso en otros módulos
export default CuadernoInteligente;
