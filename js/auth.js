// Sistema de autenticación simple para un solo usuario
class AuthManager {
    constructor() {
        this.CREDENTIALS_KEY = 'cuaderno_credentials';
        this.SESSION_KEY = 'cuaderno_auth_session';
        this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas
        
        // Inicializa credenciales por defecto si no existen
        this.initializeCredentials();
    }
    
    // Inicializa credenciales por defecto
    initializeCredentials() {
        const stored = localStorage.getItem(this.CREDENTIALS_KEY);
        if (!stored) {
            // Credenciales iniciales únicas generadas
            const defaultCredentials = {
                username: 'admin',
                // Hash SHA-256 de "Cuaderno2024!"
                passwordHash: '48c364a8e930835fe06f5b27117ebd1aa00cca52f8b74e530f827fc5b4adbd8f'
            };
            localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(defaultCredentials));
        }
    }
    
    // Obtiene las credenciales almacenadas
    getStoredCredentials() {
        const stored = localStorage.getItem(this.CREDENTIALS_KEY);
        return stored ? JSON.parse(stored) : null;
    }
    
    // Genera hash SHA-256 de una cadena
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    // Verifica si el usuario está autenticado
    isAuthenticated() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (!session) return false;
        
        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            // Verifica si la sesión no ha expirado
            if (sessionData.expiresAt > now) {
                return true;
            } else {
                // Sesión expirada, limpia
                this.logout();
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    
    // Intenta autenticar con usuario y contraseña
    async login(username, password) {
        const credentials = this.getStoredCredentials();
        if (!credentials) {
            return { success: false, error: 'Error de configuración' };
        }
        
        // Verifica usuario
        if (username !== credentials.username) {
            return { success: false, error: 'Usuario o contraseña incorrectos' };
        }
        
        // Hashea la contraseña ingresada
        const passwordHash = await this.hashPassword(password);
        
        // Verifica contraseña
        if (passwordHash !== credentials.passwordHash) {
            return { success: false, error: 'Usuario o contraseña incorrectos' };
        }
        
        // Crea sesión
        const sessionData = {
            username: username,
            loginTime: Date.now(),
            expiresAt: Date.now() + this.SESSION_DURATION
        };
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        
        return { success: true };
    }
    
    // Cambia las credenciales (requiere contraseña actual)
    async changeCredentials(currentPassword, newUsername, newPassword) {
        const credentials = this.getStoredCredentials();
        if (!credentials) {
            return { success: false, error: 'Error de configuración' };
        }
        
        // Verifica contraseña actual
        const currentHash = await this.hashPassword(currentPassword);
        if (currentHash !== credentials.passwordHash) {
            return { success: false, error: 'Contraseña actual incorrecta' };
        }
        
        // Valida nuevo usuario
        if (!newUsername || newUsername.trim().length < 3) {
            return { success: false, error: 'El usuario debe tener al menos 3 caracteres' };
        }
        
        // Valida nueva contraseña
        if (!newPassword || newPassword.length < 8) {
            return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
        }
        
        // Genera hash de nueva contraseña
        const newPasswordHash = await this.hashPassword(newPassword);
        
        // Guarda nuevas credenciales
        const newCredentials = {
            username: newUsername.trim(),
            passwordHash: newPasswordHash
        };
        
        localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(newCredentials));
        
        return { success: true };
    }
    
    // Cierra sesión
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.reload();
    }
    
    // Obtiene información de la sesión actual
    getSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (!session) return null;
        
        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    }
    
    // Renueva la sesión (extiende el tiempo de expiración)
    renewSession() {
        const session = this.getSession();
        if (session) {
            session.expiresAt = Date.now() + this.SESSION_DURATION;
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        }
    }
}

// Instancia global
window.authManager = new AuthManager();

// Protege la aplicación al cargar
document.addEventListener('DOMContentLoaded', () => {
    if (!window.authManager.isAuthenticated()) {
        showLoginScreen();
    } else {
        showApp();
        // Renueva la sesión cada 10 minutos
        setInterval(() => {
            window.authManager.renewSession();
        }, 10 * 60 * 1000);
    }
});

// Muestra la pantalla de login
function showLoginScreen() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
        <div id="login-screen" class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
            <!-- Fondo animado minimalista -->
            <div class="absolute inset-0 overflow-hidden">
                <div class="absolute w-96 h-96 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl -top-48 -left-48 animate-blob"></div>
                <div class="absolute w-96 h-96 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-blob animation-delay-2000"></div>
                <div class="absolute w-96 h-96 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000"></div>
            </div>
            
            <div class="w-full max-w-md relative z-10">
                <!-- Logo y título minimalista -->
                <div class="text-center mb-10">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-xl mb-4 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-700 dark:text-slate-300">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-1">Cuaderno Inteligente</h1>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Acceso privado</p>
                </div>
                
                <!-- Formulario de login minimalista -->
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 border border-slate-200 dark:border-slate-700">
                    <form id="login-form" class="space-y-5">
                        <!-- Usuario -->
                        <div>
                            <label for="username" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Usuario
                            </label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username"
                                autocomplete="username"
                                required
                                class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Ingresa tu usuario"
                            >
                        </div>
                        
                        <!-- Contraseña -->
                        <div>
                            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Contraseña
                            </label>
                            <div class="relative">
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password"
                                    autocomplete="current-password"
                                    required
                                    class="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Ingresa tu contraseña"
                                >
                                <button 
                                    type="button" 
                                    id="toggle-password"
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="eye-icon">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Mensaje de error -->
                        <div id="login-error" class="hidden bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-400 text-sm">
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" x2="12" y1="8" y2="12"></line>
                                    <line x1="12" x2="12.01" y1="16" y2="16"></line>
                                </svg>
                                <span id="login-error-message"></span>
                            </div>
                        </div>
                        
                        <!-- Botón de login -->
                        <button 
                            type="submit" 
                            id="login-btn"
                            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 shadow-sm"
                        >
                            Iniciar Sesión
                        </button>
                    </form>
                    
                    <!-- Información adicional -->
                    <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <p class="text-xs text-slate-500 dark:text-slate-400 text-center">
                            🔒 Acceso privado y seguro
                        </p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="text-center mt-8 text-slate-400 dark:text-slate-500 text-sm">
                    <p>Cuaderno Inteligente © 2024</p>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners
    setupLoginListeners();
}

// Configura los event listeners del login
function setupLoginListeners() {
    const form = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');
    const errorMessage = document.getElementById('login-error-message');
    
    // Toggle mostrar/ocultar contraseña
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const eyeIcon = document.getElementById('eye-icon');
            if (type === 'text') {
                eyeIcon.innerHTML = `
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                    <line x1="2" x2="22" y1="2" y2="22"></line>
                `;
            } else {
                eyeIcon.innerHTML = `
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    }
    
    // Submit del formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('login-btn');
            
            // Deshabilita el botón durante el login
            loginBtn.disabled = true;
            loginBtn.innerHTML = `
                <div class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verificando...</span>
                </div>
            `;
            
            // Oculta error previo
            errorDiv.classList.add('hidden');
            
            // Intenta autenticar
            const result = await window.authManager.login(username, password);
            
            if (result.success) {
                // Login exitoso
                loginBtn.innerHTML = `
                    <div class="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>¡Bienvenido!</span>
                    </div>
                `;
                
                // Espera un momento y recarga
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Login fallido
                errorMessage.textContent = result.error;
                errorDiv.classList.remove('hidden');
                
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Iniciar Sesión';
                
                // Limpia la contraseña
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
}

// Muestra la aplicación principal
function showApp() {
    // NO HACER NADA - El HTML ya existe en index.html
    // Solo inicializar la aplicación si no está inicializada
    if (window.app && window.app.init) {
        window.app.init();
    }
}

// Muestra el modal de configuración
function showSettingsModal() {
    // Crea el modal
    const modalHTML = `
        <div id="settings-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <!-- Header -->
                <div class="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </div>
                            <h2 class="text-2xl font-bold text-white">Configuración</h2>
                        </div>
                        <button id="close-settings-modal" class="text-white/80 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" x2="6" y1="6" y2="18"></line>
                                <line x1="6" x2="18" y1="6" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Body -->
                <div class="p-6">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Cambia tu usuario y contraseña de acceso. Necesitas tu contraseña actual para confirmar los cambios.
                    </p>
                    
                    <form id="settings-form" class="space-y-4">
                        <!-- Contraseña actual -->
                        <div>
                            <label for="current-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contraseña Actual *
                            </label>
                            <input 
                                type="password" 
                                id="current-password" 
                                required
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Tu contraseña actual"
                            >
                        </div>
                        
                        <div class="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                        
                        <!-- Nuevo usuario -->
                        <div>
                            <label for="new-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nuevo Usuario *
                            </label>
                            <input 
                                type="text" 
                                id="new-username" 
                                required
                                minlength="3"
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Mínimo 3 caracteres"
                            >
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Este será tu nuevo nombre de usuario para iniciar sesión
                            </p>
                        </div>
                        
                        <!-- Nueva contraseña -->
                        <div>
                            <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nueva Contraseña *
                            </label>
                            <input 
                                type="password" 
                                id="new-password" 
                                required
                                minlength="8"
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Mínimo 8 caracteres"
                            >
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Usa una contraseña segura con letras, números y símbolos
                            </p>
                        </div>
                        
                        <!-- Confirmar contraseña -->
                        <div>
                            <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirmar Nueva Contraseña *
                            </label>
                            <input 
                                type="password" 
                                id="confirm-password" 
                                required
                                minlength="8"
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Repite la nueva contraseña"
                            >
                        </div>
                        
                        <!-- Mensaje de error -->
                        <div id="settings-error" class="hidden bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" x2="12" y1="8" y2="12"></line>
                                    <line x1="12" x2="12.01" y1="16" y2="16"></line>
                                </svg>
                                <span id="settings-error-message"></span>
                            </div>
                        </div>
                        
                        <!-- Mensaje de éxito -->
                        <div id="settings-success" class="hidden bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg p-3 text-green-700 dark:text-green-300 text-sm">
                            <div class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>¡Credenciales actualizadas! Usa tus nuevas credenciales en el próximo inicio de sesión.</span>
                            </div>
                        </div>
                        
                        <!-- Botones -->
                        <div class="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                id="cancel-settings-btn"
                                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                id="save-settings-btn"
                                class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Inserta el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event listeners del modal
    setupSettingsModalListeners();
}

// Configura los event listeners del modal de configuración
function setupSettingsModalListeners() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('close-settings-modal');
    const cancelBtn = document.getElementById('cancel-settings-btn');
    const form = document.getElementById('settings-form');
    const errorDiv = document.getElementById('settings-error');
    const errorMessage = document.getElementById('settings-error-message');
    const successDiv = document.getElementById('settings-success');
    
    // Cerrar modal
    const closeModal = () => {
        modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Click fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Submit del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newUsername = document.getElementById('new-username').value.trim();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const saveBtn = document.getElementById('save-settings-btn');
        
        // Oculta mensajes previos
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        // Valida que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            errorMessage.textContent = 'Las contraseñas nuevas no coinciden';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Deshabilita el botón
        saveBtn.disabled = true;
        saveBtn.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Guardando...</span>
            </div>
        `;
        
        // Intenta cambiar las credenciales
        const result = await window.authManager.changeCredentials(currentPassword, newUsername, newPassword);
        
        if (result.success) {
            // Éxito
            successDiv.classList.remove('hidden');
            form.reset();
            
            saveBtn.innerHTML = `
                <div class="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>¡Guardado!</span>
                </div>
            `;
            
            // Cierra el modal después de 2 segundos
            setTimeout(() => {
                closeModal();
            }, 2000);
        } else {
            // Error
            errorMessage.textContent = result.error;
            errorDiv.classList.remove('hidden');
            
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Guardar Cambios';
        }
    });
}
