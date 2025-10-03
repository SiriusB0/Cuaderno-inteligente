/**
 * Sistema de notificaciones mejorado
 */
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
        this.notifications = new Map();
        this.defaultDuration = 4000;
    }
    
    /**
     * Crea el contenedor de notificaciones (centrado en la parte superior)
     */
    createContainer() {
        let container = document.getElementById('notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'fixed top-4 left-4 z-50 space-y-2 w-full max-w-[280px]';
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    /**
     * Muestra una notificación
     */
    show(message, type = 'info', duration = null, actions = null) {
        const id = `notification_${Date.now()}`;
        const notification = this.createNotification(id, message, type, actions);
        
        // Agregar al DOM
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Animación de entrada (desde arriba)
        requestAnimationFrame(() => {
            notification.classList.remove('-translate-y-full', 'opacity-0');
            notification.classList.add('translate-y-0', 'opacity-100');
        });
        
        // Auto-ocultar si se especifica duración
        const finalDuration = duration !== null ? duration : this.defaultDuration;
        if (finalDuration > 0) {
            setTimeout(() => this.hide(id), finalDuration);
        }
        
        return id;
    }
    
    /**
     * Crea el elemento de notificación
     */
    createNotification(id, message, type, actions) {
        const notification = document.createElement('div');
        notification.id = id;
        
        // USAR ESTILOS INLINE PARA FORZAR EL DISEÑO (no pueden ser sobrescritos por cache)
        notification.style.cssText = `
            position: relative;
            width: 100%;
            max-width: 240px;
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(8px);
            border-radius: 8px;
            border-left: 3px solid rgba(156, 163, 175, 0.5);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            padding: 10px;
            font-size: 13px;
            color: #ffffff;
            opacity: 0.95;
            transition: opacity 0.2s, transform 0.3s;
            transform: translateY(-100%);
            animation: slideDown 0.3s forwards;
        `;
        
        notification.onmouseenter = () => notification.style.opacity = '1';
        notification.onmouseleave = () => notification.style.opacity = '0.95';
        
        const typeConfig = this.getTypeConfig(type);
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="${typeConfig.icon}" style="width: 16px; height: 16px; flex-shrink: 0; color: #ffffff;"></i>
                <p style="flex: 1; margin: 0; font-size: 13px; font-weight: 500; line-height: 1.4; color: #ffffff;">
                    ${message}
                </p>
                <button 
                    class="notification-close"
                    data-notification-id="${id}"
                    style="background: none; border: none; padding: 2px; cursor: pointer; color: #cbd5e1; width: 16px; height: 16px; transition: color 0.2s;"
                    onmouseover="this.style.color='#ffffff'"
                    onmouseout="this.style.color='#cbd5e1'"
                >
                    <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                </button>
            </div>
        `;
        
        // Event listeners
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hide(id));
        
        // Actualizar iconos de Lucide
        if (window.lucide) {
            window.lucide.createIcons({ nameAttr: 'data-lucide' });
        }
        
        return notification;
    }
    
    /**
     * Configuración por tipo de notificación
     */
    getTypeConfig(type) {
        const configs = {
            success: {
                icon: 'check-circle',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600'
            },
            error: {
                icon: 'alert-circle',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600'
            },
            warning: {
                icon: 'alert-triangle',
                iconBg: 'bg-yellow-100',
                iconColor: 'text-yellow-600'
            },
            info: {
                icon: 'info',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600'
            }
        };
        
        return configs[type] || configs.info;
    }
    
    /**
     * Obtiene el color del borde según el tipo
     */
    getTypeBorder(type) {
        const borders = {
            success: 'border-green-500',
            error: 'border-red-500',
            warning: 'border-yellow-500',
            info: 'border-blue-500'
        };
        
        return borders[type] || borders.info;
    }
    
    /**
     * Crea botones de acción para la notificación
     */
    createActions(notificationId, actions) {
        if (!actions || actions.length === 0) return '';
        
        const actionsHtml = actions.map(action => `
            <button 
                class="notification-action mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                data-notification-id="${notificationId}"
                data-action="${action.id}"
            >
                ${action.label}
            </button>
        `).join(' ');
        
        return `<div class="mt-2 flex space-x-4">${actionsHtml}</div>`;
    }
    
    /**
     * Oculta una notificación (desaparece hacia arriba)
     */
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Animación de salida (hacia arriba)
        notification.classList.remove('translate-y-0', 'opacity-100');
        notification.classList.add('-translate-y-full', 'opacity-0');
        
        // Remover del DOM después de la animación
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 500);
    }
    
    /**
     * Oculta todas las notificaciones
     */
    hideAll() {
        this.notifications.forEach((_, id) => this.hide(id));
    }
    
    /**
     * Métodos de conveniencia
     */
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = null) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }
}

export default NotificationManager;
