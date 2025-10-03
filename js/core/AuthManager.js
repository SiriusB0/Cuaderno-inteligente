/**
 * Gestor de autenticación con Supabase
 */
class AuthManager {
    constructor(supabaseClient, notificationManager) {
        this.supabase = supabaseClient;
        this.notifications = notificationManager;
        this.currentUser = null;
        this.onAuthStateChangeCallbacks = [];
    }

    /**
     * Inicializa el gestor de autenticación
     */
    async initialize() {
        // Verificar si hay una sesión activa
        const { data: { session } } = await this.supabase.auth.getSession();
        
        if (session) {
            this.currentUser = session.user;
            this.notifyAuthStateChange(true);
        }

        // Escuchar cambios en el estado de autenticación
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.notifyAuthStateChange(true);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.notifyAuthStateChange(false);
            }
        });
    }

    /**
     * Registra un callback para cambios en el estado de autenticación
     */
    onAuthStateChange(callback) {
        this.onAuthStateChangeCallbacks.push(callback);
    }

    /**
     * Notifica a todos los callbacks sobre cambios en el estado
     */
    notifyAuthStateChange(isAuthenticated) {
        this.onAuthStateChangeCallbacks.forEach(callback => {
            callback(isAuthenticated, this.currentUser);
        });
    }

    /**
     * Inicia sesión con email y contraseña
     */
    async signInWithEmail(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.notifications.success('¡Bienvenido de nuevo!');
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.notifications.error(error.message || 'Error al iniciar sesión');
            return { success: false, error: error.message };
        }
    }

    /**
     * Inicia sesión con nombre de usuario y contraseña
     * (Supabase no soporta username nativamente, usamos metadata)
     */
    async signInWithUsername(username, password) {
        try {
            // Buscar usuario por username en metadata
            // Esto requiere una función edge o tabla personalizada
            // Por ahora, asumimos que el username es el email
            this.notifications.warning('Usa tu email como nombre de usuario');
            return await this.signInWithEmail(username, password);
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.notifications.error('Error al iniciar sesión');
            return { success: false, error: error.message };
        }
    }

    /**
     * Registra un nuevo usuario con email
     */
    async signUpWithEmail(email, password, username = null) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username || email.split('@')[0]
                    }
                }
            });

            if (error) throw error;

            this.notifications.success('¡Cuenta creada! Revisa tu email para confirmar.');
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Error al registrarse:', error);
            this.notifications.error(error.message || 'Error al crear cuenta');
            return { success: false, error: error.message };
        }
    }

    /**
     * Cierra sesión
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) throw error;

            this.currentUser = null;
            this.notifications.success('Sesión cerrada correctamente');
            return { success: true };
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.notifications.error('Error al cerrar sesión');
            return { success: false, error: error.message };
        }
    }

    /**
     * Recupera contraseña
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
            });

            if (error) throw error;

            this.notifications.success('Revisa tu email para restablecer tu contraseña');
            return { success: true };
        } catch (error) {
            console.error('Error al recuperar contraseña:', error);
            this.notifications.error('Error al enviar email de recuperación');
            return { success: false, error: error.message };
        }
    }

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Obtiene el usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Obtiene el nombre de usuario
     */
    getUsername() {
        if (!this.currentUser) return null;
        return this.currentUser.user_metadata?.username || 
               this.currentUser.email?.split('@')[0] || 
               'Usuario';
    }
}

export default AuthManager;
