// Aplicación principal - Cuaderno Inteligente
import DataManager from './core/DataManager.js';
import Router from './core/Router.js';
import NotificationManager from './components/NotificationManager.js';
import AuthManager from './core/AuthManager.js';
import LoginView from './views/LoginView.js';
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
        this.authManager = null;
        this.supabaseClient = null;
        this.views = {};
        
        this.init();
    }
    
    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            // Mostrar indicador de carga
            this.showLoadingState();
            
            // Inicializar componentes core
            this.dataManager = new DataManager();
            this.router = new Router();
            this.notifications = new NotificationManager();
            
            // Inicializar Supabase (opcional)
            this.supabaseClient = createSupabaseClient();
            
            // Inicializar AuthManager
            if (this.supabaseClient) {
                this.authManager = new AuthManager(this.supabaseClient, this.notifications);
                await this.authManager.initialize();
            }
            
            // Inicializar QuizManager
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
            
            // Verificar autenticación y mostrar vista apropiada
            if (this.authManager && !this.authManager.isAuthenticated()) {
                // Mostrar login si Supabase está configurado y no hay sesión
                this.router.navigate('login');
            } else {
                // Inicializar router normalmente
                this.router.initialize();
            }
            
            // Inicializar iconos de Lucide
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            // Ocultar indicador de carga
            this.hideLoadingState();
            
            // Mostrar notificación de bienvenida si está autenticado
            if (!this.authManager || this.authManager.isAuthenticated()) {
                this.showWelcomeMessage();
            }
            
        } catch (error) {
            console.error('Error inicializando aplicación:', error);
            this.notifications.error('Error al inicializar la aplicación');
        }
    }
    
    /**
     * Inicializa todas las vistas
     */
    initializeViews() {
        // Vista de login (solo si hay authManager)
        if (this.authManager) {
            this.views.login = new LoginView(
                this.authManager,
                this.router,
                this.notifications
            );
        }
        
        this.views.subjects = new SubjectsView(
            this.dataManager, 
            this.router, 
            this.notifications
        );
        
        this.views.topics = new TopicsView(
            this.dataManager, 
            this.router, 
            this.notifications
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
            console.error('Error global:', event.error);
            this.notifications.error('Ha ocurrido un error inesperado');
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
        // Ctrl/Cmd + S - Guardar
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.dataManager.save();
            this.notifications.success('Datos guardados');
        }
        
        // Escape - Cerrar modales o salir de modo presentación
        if (e.key === 'Escape') {
            this.closeModals();
            if (this.router.getCurrentView().name === 'presentation') {
                this.router.goBack();
            }
        }
        
        // F11 - Modo presentación (si estamos en estudio)
        if (e.key === 'F11' && this.router.getCurrentView().name === 'study') {
            e.preventDefault();
            this.views.presentation.enter();
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
     * Muestra estado de carga
     */
    showLoadingState() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="h-full flex items-center justify-center">
                    <div class="text-center">
                        <div class="spinner w-8 h-8 mx-auto mb-4"></div>
                        <p class="text-gray-600 dark:text-gray-400">Cargando Cuaderno Inteligente...</p>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Oculta estado de carga
     */
    hideLoadingState() {
        // El contenido se restaurará cuando se renderice la primera vista
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
