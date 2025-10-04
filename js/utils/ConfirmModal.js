// Sistema de modales de confirmación bonitos
class ConfirmModal {
    /**
     * Muestra un modal de confirmación bonito
     * @param {Object} options - Opciones del modal
     * @param {string} options.title - Título del modal
     * @param {string} options.message - Mensaje del modal
     * @param {string} options.confirmText - Texto del botón confirmar (default: "Confirmar")
     * @param {string} options.cancelText - Texto del botón cancelar (default: "Cancelar")
     * @param {string} options.type - Tipo: 'danger', 'warning', 'info' (default: 'info')
     * @returns {Promise<boolean>} - true si confirmó, false si canceló
     */
    static show(options = {}) {
        return new Promise((resolve) => {
            const {
                title = '¿Estás seguro?',
                message = 'Esta acción no se puede deshacer.',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                type = 'info'
            } = options;
            
            // Colores según el tipo
            const typeColors = {
                danger: {
                    icon: 'text-red-500',
                    button: 'bg-red-600 hover:bg-red-700',
                    border: 'border-red-200 dark:border-red-800'
                },
                warning: {
                    icon: 'text-yellow-500',
                    button: 'bg-yellow-600 hover:bg-yellow-700',
                    border: 'border-yellow-200 dark:border-yellow-800'
                },
                info: {
                    icon: 'text-blue-500',
                    button: 'bg-blue-600 hover:bg-blue-700',
                    border: 'border-blue-200 dark:border-blue-800'
                }
            };
            
            const colors = typeColors[type] || typeColors.info;
            
            // Iconos según el tipo
            const icons = {
                danger: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" x2="12" y1="8" y2="12"></line>
                        <line x1="12" x2="12.01" y1="16" y2="16"></line>
                    </svg>
                `,
                warning: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <line x1="12" x2="12" y1="9" y2="13"></line>
                        <line x1="12" x2="12.01" y1="17" y2="17"></line>
                    </svg>
                `,
                info: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" x2="12" y1="16" y2="12"></line>
                        <line x1="12" x2="12.01" y1="8" y2="8"></line>
                    </svg>
                `
            };
            
            // Crear el modal
            const modalHTML = `
                <div id="confirm-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
                    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
                        <!-- Icono y Título -->
                        <div class="p-6 text-center">
                            <div class="inline-flex items-center justify-center w-16 h-16 ${colors.icon} mb-4">
                                ${icons[type] || icons.info}
                            </div>
                            <h3 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                                ${title}
                            </h3>
                            <p class="text-slate-600 dark:text-slate-400">
                                ${message}
                            </p>
                        </div>
                        
                        <!-- Botones -->
                        <div class="flex gap-3 p-6 pt-0">
                            <button 
                                id="confirm-modal-cancel"
                                class="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                            >
                                ${cancelText}
                            </button>
                            <button 
                                id="confirm-modal-confirm"
                                class="flex-1 px-4 py-2.5 ${colors.button} text-white rounded-lg transition-colors font-medium shadow-sm"
                            >
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar estilos de animación si no existen
            if (!document.getElementById('confirm-modal-styles')) {
                const styles = document.createElement('style');
                styles.id = 'confirm-modal-styles';
                styles.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleIn {
                        from { transform: scale(0.9); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.2s ease-out;
                    }
                    .animate-scaleIn {
                        animation: scaleIn 0.2s ease-out;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            // Insertar en el DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById('confirm-modal');
            const confirmBtn = document.getElementById('confirm-modal-confirm');
            const cancelBtn = document.getElementById('confirm-modal-cancel');
            
            // Función para cerrar el modal
            const closeModal = (result) => {
                modal.classList.add('opacity-0');
                setTimeout(() => {
                    modal.remove();
                    resolve(result);
                }, 200);
            };
            
            // Event listeners
            confirmBtn.addEventListener('click', () => closeModal(true));
            cancelBtn.addEventListener('click', () => closeModal(false));
            
            // Cerrar con Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            // Click fuera del modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(false);
                }
            });
            
            // Focus en el botón de cancelar
            cancelBtn.focus();
        });
    }
}

// Exportar para uso global
window.ConfirmModal = ConfirmModal;
