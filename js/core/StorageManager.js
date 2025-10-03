/**
 * Gestor de almacenamiento local con validación y backup
 */
class StorageManager {
    static STORAGE_KEY = 'cuaderno-inteligente-v2';
    static BACKUP_KEY = 'cuaderno-inteligente-backup';
    
    /**
     * Guarda datos en localStorage con validación
     */
    static save(data) {
        try {
            // Validar estructura de datos
            if (!this.validateData(data)) {
                throw new Error('Estructura de datos inválida');
            }
            
            // Crear backup antes de guardar
            const currentData = this.load();
            if (currentData) {
                localStorage.setItem(this.BACKUP_KEY, JSON.stringify(currentData));
            }
            
            // Guardar datos principales
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return { success: true };
        } catch (error) {
            console.error('Error guardando datos:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Carga datos desde localStorage
     */
    static load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error cargando datos:', error);
            return this.loadBackup();
        }
    }
    
    /**
     * Carga backup en caso de error
     */
    static loadBackup() {
        try {
            const backup = localStorage.getItem(this.BACKUP_KEY);
            return backup ? JSON.parse(backup) : null;
        } catch (error) {
            console.error('Error cargando backup:', error);
            return null;
        }
    }
    
    /**
     * Limpia todos los datos
     */
    static clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.BACKUP_KEY);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Exporta datos como JSON
     */
    static export() {
        const data = this.load();
        if (!data) return null;
        
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Valida estructura de datos
     */
    static validateData(data) {
        if (!data || typeof data !== 'object') return false;
        
        const requiredFields = ['subjects', 'topics', 'pages', 'resources'];
        return requiredFields.every(field => 
            data.hasOwnProperty(field) && Array.isArray(data[field]) || typeof data[field] === 'object'
        );
    }
    
    /**
     * Obtiene estadísticas de uso
     */
    static getStats() {
        const data = this.load();
        if (!data) return null;
        
        return {
            subjects: data.subjects?.length || 0,
            topics: data.topics?.length || 0,
            pages: Object.values(data.pages || {}).flat().length,
            resources: Object.values(data.resources || {}).flat().length,
            lastModified: data.lastModified || null
        };
    }
}

export default StorageManager;
