/**
 * Vista de Login - Diseño minimalista y hermoso
 */
class LoginView {
    constructor(authManager, router, notifications) {
        this.authManager = authManager;
        this.router = router;
        this.notifications = notifications;
        this.container = document.getElementById('login-view');
        this.isSignUpMode = false;
        
        if (!this.container) {
            this.createContainer();
        }
    }

    /**
     * Crea el contenedor de la vista de login
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'login-view';
        this.container.className = 'hidden';
        document.getElementById('app').appendChild(this.container);
    }

    /**
     * Renderiza la vista de login
     */
    render() {
        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
                <!-- Partículas de fondo animadas -->
                <div class="absolute inset-0 overflow-hidden pointer-events-none">
                    <div class="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
                    <div class="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style="animation-delay: 2s;"></div>
                </div>

                <!-- Contenedor principal -->
                <div class="relative w-full max-w-md">
                    <!-- Logo y título -->
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/50">
                            <i data-lucide="book-open" class="w-8 h-8 text-white"></i>
                        </div>
                        <h1 class="text-3xl font-bold text-white mb-2">Cuaderno Inteligente</h1>
                        <p class="text-slate-400 text-sm">Tu espacio personal de estudio</p>
                    </div>

                    <!-- Card de login -->
                    <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
                        <!-- Tabs -->
                        <div class="flex gap-2 mb-6 bg-slate-900/50 rounded-lg p-1">
                            <button id="login-tab" class="flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 text-white bg-indigo-600">
                                Iniciar Sesión
                            </button>
                            <button id="signup-tab" class="flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 text-slate-400 hover:text-white">
                                Registrarse
                            </button>
                        </div>

                        <!-- Formulario de Login -->
                        <form id="login-form" class="space-y-4">
                            <!-- Campo de email/usuario -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Email o Usuario
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i data-lucide="user" class="w-5 h-5 text-slate-500"></i>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="login-identifier"
                                        class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="tu@email.com"
                                        required
                                    >
                                </div>
                            </div>

                            <!-- Campo de contraseña -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Contraseña
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i data-lucide="lock" class="w-5 h-5 text-slate-500"></i>
                                    </div>
                                    <input 
                                        type="password" 
                                        id="login-password"
                                        class="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    >
                                    <button 
                                        type="button"
                                        id="toggle-password"
                                        class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <i data-lucide="eye" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Recordar y olvidé contraseña -->
                            <div class="flex items-center justify-between text-sm">
                                <label class="flex items-center text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                                    <input type="checkbox" id="remember-me" class="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 mr-2">
                                    Recordarme
                                </label>
                                <button type="button" id="forgot-password" class="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <!-- Botón de submit -->
                            <button 
                                type="submit"
                                class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Iniciar Sesión</span>
                                <i data-lucide="arrow-right" class="w-5 h-5"></i>
                            </button>
                        </form>

                        <!-- Formulario de Registro (oculto por defecto) -->
                        <form id="signup-form" class="space-y-4 hidden">
                            <!-- Campo de nombre de usuario -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Nombre de Usuario
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i data-lucide="user" class="w-5 h-5 text-slate-500"></i>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="signup-username"
                                        class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="usuario123"
                                        required
                                    >
                                </div>
                            </div>

                            <!-- Campo de email -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Email
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i data-lucide="mail" class="w-5 h-5 text-slate-500"></i>
                                    </div>
                                    <input 
                                        type="email" 
                                        id="signup-email"
                                        class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="tu@email.com"
                                        required
                                    >
                                </div>
                            </div>

                            <!-- Campo de contraseña -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Contraseña
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i data-lucide="lock" class="w-5 h-5 text-slate-500"></i>
                                    </div>
                                    <input 
                                        type="password" 
                                        id="signup-password"
                                        class="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                        minlength="6"
                                    >
                                    <button 
                                        type="button"
                                        id="toggle-signup-password"
                                        class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        <i data-lucide="eye" class="w-5 h-5"></i>
                                    </button>
                                </div>
                                <p class="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
                            </div>

                            <!-- Campo de confirmar contraseña -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">
                                    Confirmar Contraseña
                                </label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i data-lucide="lock" class="w-5 h-5 text-slate-500"></i>
                                    </div>
                                    <input 
                                        type="password" 
                                        id="signup-confirm-password"
                                        class="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    >
                                </div>
                            </div>

                            <!-- Términos y condiciones -->
                            <label class="flex items-start text-sm text-slate-400 cursor-pointer">
                                <input type="checkbox" id="accept-terms" class="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 mr-2 mt-0.5" required>
                                <span>Acepto los <button type="button" class="text-indigo-400 hover:text-indigo-300 transition-colors">términos y condiciones</button></span>
                            </label>

                            <!-- Botón de submit -->
                            <button 
                                type="submit"
                                class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span>Crear Cuenta</span>
                                <i data-lucide="user-plus" class="w-5 h-5"></i>
                            </button>
                        </form>

                        <!-- Divider -->
                        <div class="relative my-6">
                            <div class="absolute inset-0 flex items-center">
                                <div class="w-full border-t border-slate-700"></div>
                            </div>
                            <div class="relative flex justify-center text-sm">
                                <span class="px-4 bg-slate-800/50 text-slate-500">o continúa sin cuenta</span>
                            </div>
                        </div>

                        <!-- Botón de modo offline -->
                        <button 
                            id="offline-mode-btn"
                            class="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-600 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <i data-lucide="wifi-off" class="w-5 h-5"></i>
                            <span>Usar sin cuenta (Offline)</span>
                        </button>
                    </div>

                    <!-- Footer -->
                    <p class="text-center text-slate-500 text-sm mt-6">
                        © 2025 Cuaderno Inteligente. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        `;

        this.attachEventListeners();
        
        // Inicializar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Adjunta event listeners
     */
    attachEventListeners() {
        // Tabs
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        loginTab?.addEventListener('click', () => {
            this.isSignUpMode = false;
            loginTab.classList.add('bg-indigo-600', 'text-white');
            loginTab.classList.remove('text-slate-400');
            signupTab.classList.remove('bg-indigo-600', 'text-white');
            signupTab.classList.add('text-slate-400');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        });

        signupTab?.addEventListener('click', () => {
            this.isSignUpMode = true;
            signupTab.classList.add('bg-indigo-600', 'text-white');
            signupTab.classList.remove('text-slate-400');
            loginTab.classList.remove('bg-indigo-600', 'text-white');
            loginTab.classList.add('text-slate-400');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        });

        // Toggle password visibility
        document.getElementById('toggle-password')?.addEventListener('click', (e) => {
            this.togglePasswordVisibility('login-password', e.currentTarget);
        });

        document.getElementById('toggle-signup-password')?.addEventListener('click', (e) => {
            this.togglePasswordVisibility('signup-password', e.currentTarget);
        });

        // Formularios
        loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        signupForm?.addEventListener('submit', (e) => this.handleSignUp(e));

        // Forgot password
        document.getElementById('forgot-password')?.addEventListener('click', () => {
            this.showForgotPasswordModal();
        });

        // Offline mode
        document.getElementById('offline-mode-btn')?.addEventListener('click', () => {
            this.router.navigate('dashboard');
        });
    }

    /**
     * Toggle visibilidad de contraseña
     */
    togglePasswordVisibility(inputId, button) {
        const input = document.getElementById(inputId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            input.type = 'password';
            icon.setAttribute('data-lucide', 'eye');
        }
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Maneja el login
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;

        if (!identifier || !password) {
            this.notifications.warning('Por favor completa todos los campos');
            return;
        }

        // Determinar si es email o username
        const isEmail = identifier.includes('@');
        
        let result;
        if (isEmail) {
            result = await this.authManager.signInWithEmail(identifier, password);
        } else {
            result = await this.authManager.signInWithUsername(identifier, password);
        }

        if (result.success) {
            this.router.navigate('dashboard');
        }
    }

    /**
     * Maneja el registro
     */
    async handleSignUp(e) {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const acceptTerms = document.getElementById('accept-terms').checked;

        if (!username || !email || !password || !confirmPassword) {
            this.notifications.warning('Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            this.notifications.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            this.notifications.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!acceptTerms) {
            this.notifications.warning('Debes aceptar los términos y condiciones');
            return;
        }

        const result = await this.authManager.signUpWithEmail(email, password, username);

        if (result.success) {
            // Cambiar a tab de login
            document.getElementById('login-tab').click();
        }
    }

    /**
     * Muestra modal de recuperar contraseña
     */
    showForgotPasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700">
                <div class="p-6">
                    <h3 class="text-xl font-semibold text-white mb-2">Recuperar Contraseña</h3>
                    <p class="text-sm text-slate-400 mb-6">Te enviaremos un enlace para restablecer tu contraseña</p>
                    
                    <form id="reset-password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <input 
                                type="email" 
                                id="reset-email"
                                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="tu@email.com"
                                required
                            >
                        </div>
                        
                        <div class="flex justify-end gap-3 mt-6">
                            <button type="button" class="cancel-btn px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                                Enviar Enlace
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const form = modal.querySelector('#reset-password-form');
        const cancelBtn = modal.querySelector('.cancel-btn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value.trim();
            
            if (email) {
                await this.authManager.resetPassword(email);
                document.body.removeChild(modal);
            }
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Muestra la vista
     */
    show() {
        this.container.classList.remove('hidden');
        this.render();
    }

    /**
     * Oculta la vista
     */
    hide() {
        this.container.classList.add('hidden');
    }
}

export default LoginView;
