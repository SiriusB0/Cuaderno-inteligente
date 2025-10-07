/**
 * Sistema de validación y sanitización de datos
 */
class Validator {
    /**
     * Sanitiza contenido HTML para prevenir XSS
     */
    static sanitizeHTML(html) {
        if (!html || typeof html !== 'string') return '';
        
        // Crear elemento temporal
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remover elementos peligrosos
        const dangerousElements = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
        dangerousElements.forEach(tag => {
            temp.querySelectorAll(tag).forEach(el => el.remove());
        });
        
        // Remover atributos peligrosos
        temp.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                // Remover eventos onclick, onload, etc.
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
                
                // Remover javascript: en href y src
                if (['href', 'src'].includes(attr.name) && 
                    attr.value.toLowerCase().includes('javascript:')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        return temp.innerHTML;
    }
    
    /**
     * Valida nombre de materia
     */
    static validateSubjectName(name) {
        if (!name || typeof name !== 'string') return false;
        
        const trimmed = name.trim();
        return trimmed.length > 0 && 
               trimmed.length <= 100 && 
               /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_.()+]+$/.test(trimmed);
    }
    
    /**
     * Valida nombre de tema
     */
    static validateTopicName(name) {
        if (!name || typeof name !== 'string') return false;
        
        const trimmed = name.trim();
        return trimmed.length > 0 && 
               trimmed.length <= 100 && 
               /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_.()+]+$/.test(trimmed);
    }
    
    /**
     * Valida descripción
     */
    static validateDescription(description) {
        if (!description) return true; // Opcional
        if (typeof description !== 'string') return false;
        
        return description.trim().length <= 500;
    }
    
    /**
     * Valida color hexadecimal
     */
    static validateColor(color) {
        if (!color || typeof color !== 'string') return false;
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }
    
    /**
     * Valida título de página
     */
    static validatePageTitle(title) {
        if (!title || typeof title !== 'string') return false;
        
        const trimmed = title.trim();
        return trimmed.length > 0 && trimmed.length <= 200;
    }
    
    /**
     * Valida tipo de página
     */
    static validatePageType(type) {
        const validTypes = ['text', 'excalidraw', 'code'];
        return validTypes.includes(type);
    }
    
    /**
     * Valida estructura de datos completa
     */
    static validateDataStructure(data) {
        if (!data || typeof data !== 'object') return false;
        
        const requiredFields = ['subjects', 'topics', 'pages', 'resources'];
        
        // Verificar campos requeridos
        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) return false;
        }
        
        // Validar subjects
        if (!Array.isArray(data.subjects)) return false;
        for (const subject of data.subjects) {
            if (!this.validateSubject(subject)) return false;
        }
        
        // Validar topics
        if (!Array.isArray(data.topics)) return false;
        for (const topic of data.topics) {
            if (!this.validateTopic(topic)) return false;
        }
        
        // Validar pages
        if (typeof data.pages !== 'object') return false;
        for (const [topicId, pages] of Object.entries(data.pages)) {
            if (!Array.isArray(pages)) return false;
            for (const page of pages) {
                if (!this.validatePage(page)) return false;
            }
        }
        
        // Validar resources
        if (typeof data.resources !== 'object') return false;
        
        return true;
    }
    
    /**
     * Valida estructura de materia
     */
    static validateSubject(subject) {
        if (!subject || typeof subject !== 'object') return false;
        
        return subject.hasOwnProperty('id') &&
               subject.hasOwnProperty('name') &&
               subject.hasOwnProperty('createdAt') &&
               this.validateSubjectName(subject.name) &&
               this.validateDescription(subject.description) &&
               (subject.color ? this.validateColor(subject.color) : true);
    }
    
    /**
     * Valida estructura de tema
     */
    static validateTopic(topic) {
        if (!topic || typeof topic !== 'object') return false;
        
        return topic.hasOwnProperty('id') &&
               topic.hasOwnProperty('name') &&
               topic.hasOwnProperty('subjectId') &&
               topic.hasOwnProperty('createdAt') &&
               this.validateTopicName(topic.name) &&
               this.validateDescription(topic.description);
    }
    
    /**
     * Valida estructura de página
     */
    static validatePage(page) {
        if (!page || typeof page !== 'object') return false;
        
        return page.hasOwnProperty('id') &&
               page.hasOwnProperty('type') &&
               page.hasOwnProperty('content') &&
               page.hasOwnProperty('createdAt') &&
               this.validatePageType(page.type) &&
               (page.title ? this.validatePageTitle(page.title) : true);
    }
    
    /**
     * Sanitiza y valida datos de entrada
     */
    static sanitizeAndValidate(data, type) {
        switch (type) {
            case 'subject':
                return this.sanitizeSubject(data);
            case 'topic':
                return this.sanitizeTopic(data);
            case 'page':
                return this.sanitizePage(data);
            default:
                throw new Error(`Tipo de datos no soportado: ${type}`);
        }
    }
    
    /**
     * Sanitiza datos de materia
     */
    static sanitizeSubject(data) {
        const sanitized = {
            name: data.name ? data.name.trim() : '',
            description: data.description ? data.description.trim() : '',
            color: data.color || '#6366f1'
        };
        
        // Validar después de sanitizar
        if (!this.validateSubjectName(sanitized.name)) {
            throw new Error('Nombre de materia inválido');
        }
        
        if (!this.validateDescription(sanitized.description)) {
            throw new Error('Descripción de materia inválida');
        }
        
        if (!this.validateColor(sanitized.color)) {
            sanitized.color = '#6366f1'; // Color por defecto
        }
        
        return sanitized;
    }
    
    /**
     * Sanitiza datos de tema
     */
    static sanitizeTopic(data) {
        const sanitized = {
            name: data.name ? data.name.trim() : '',
            description: data.description ? data.description.trim() : '',
            subjectId: data.subjectId
        };
        
        // Validar después de sanitizar
        if (!this.validateTopicName(sanitized.name)) {
            throw new Error('Nombre de tema inválido');
        }
        
        if (!this.validateDescription(sanitized.description)) {
            throw new Error('Descripción de tema inválida');
        }
        
        if (!sanitized.subjectId) {
            throw new Error('ID de materia requerido');
        }
        
        return sanitized;
    }
    
    /**
     * Sanitiza datos de página
     */
    static sanitizePage(data) {
        const sanitized = {
            type: data.type || 'text',
            title: data.title ? data.title.trim() : '',
            content: data.content || ''
        };
        
        // Validar tipo
        if (!this.validatePageType(sanitized.type)) {
            console.warn('⚠️ Tipo de página inválido:', sanitized.type, '- Usando "text" por defecto');
            sanitized.type = 'text';
        }
        
        // Sanitizar contenido HTML solo para páginas de texto
        // Para 'code' y 'excalidraw', el contenido es JSON y no debe sanitizarse
        if (sanitized.type === 'text') {
            sanitized.content = this.sanitizeHTML(sanitized.content);
        }
        
        // Validar título si se proporciona
        if (sanitized.title && !this.validatePageTitle(sanitized.title)) {
            throw new Error('Título de página inválido');
        }
        
        return sanitized;
    }
    
    /**
     * Escapa texto para prevenir XSS en atributos
     */
    static escapeAttribute(text) {
        if (!text) return '';
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    
    /**
     * Valida tamaño de archivo
     */
    static validateFileSize(size, maxSize = 10 * 1024 * 1024) { // 10MB por defecto
        return typeof size === 'number' && size > 0 && size <= maxSize;
    }
    
    /**
     * Valida tipo MIME de archivo
     */
    static validateMimeType(mimeType, allowedTypes = []) {
        if (!mimeType || typeof mimeType !== 'string') return false;
        
        const defaultAllowed = [
            'application/pdf',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];
        
        const allowed = allowedTypes.length > 0 ? allowedTypes : defaultAllowed;
        return allowed.includes(mimeType);
    }
    
    /**
     * Valida nombre de archivo
     */
    static validateFileName(fileName) {
        if (!fileName || typeof fileName !== 'string') return false;
        
        const trimmed = fileName.trim();
        
        // Verificar longitud
        if (trimmed.length === 0 || trimmed.length > 255) return false;
        
        // Verificar caracteres peligrosos
        const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (dangerousChars.test(trimmed)) return false;
        
        // Verificar nombres reservados en Windows
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
        if (reservedNames.test(trimmed)) return false;
        
        return true;
    }
}

export default Validator;
