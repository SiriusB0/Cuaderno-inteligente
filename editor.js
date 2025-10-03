// --- EDITOR MEJORADO ---
class EditorManager {
    constructor() {
        this.activeFormats = new Set();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }
    
    setupEventListeners() {
        // Toolbar buttons
        document.querySelectorAll('.editor-btn').forEach(button => {
            button.addEventListener('click', (e) => this.handleToolbarClick(e));
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleToolbarClick(e);
                }
            });
        });
        
        // Editor content events
        editorContent.addEventListener('input', () => this.updateToolbarState());
        editorContent.addEventListener('selectionchange', () => this.updateToolbarState());
        editorContent.addEventListener('blur', () => this.saveCurrentPage());
        
        // Save button
        document.getElementById('save-btn').addEventListener('click', () => this.saveCurrentPage());
    }
    
    setupKeyboardShortcuts() {
        editorContent.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCurrentPage();
                        break;
                }
            }
        });
    }
    
    handleToolbarClick(e) {
        const button = e.currentTarget;
        const command = button.dataset.command;
        const value = button.dataset.value || null;
        
        if (command) {
            this.executeCommand(command, value);
        } else if (button.id === 'highlight-btn') {
            this.executeCommand('hiliteColor', '#fef08a');
        }
        
        editorContent.focus();
    }
    
    executeCommand(command, value = null) {
        try {
            // Sanitizar valores de entrada
            if (value && typeof value === 'string') {
                value = DataValidator.sanitizeHTML(value);
            }
            
            document.execCommand(command, false, value);
            this.updateToolbarState();
            this.updateSaveStatus('unsaved');
        } catch (error) {
            console.error('Error ejecutando comando del editor:', error);
            NotificationManager.show('Error en el editor', 'error');
        }
    }
    
    updateToolbarState() {
        document.querySelectorAll('.editor-btn[data-command]').forEach(button => {
            const command = button.dataset.command;
            const isActive = document.queryCommandState(command);
            button.classList.toggle('active', isActive);
        });
    }
    
    updateSaveStatus(status) {
        const saveStatus = document.getElementById('save-status');
        switch(status) {
            case 'saving':
                saveStatus.textContent = 'Guardando...';
                saveStatus.className = 'text-sm text-yellow-500';
                break;
            case 'saved':
                saveStatus.textContent = 'Guardado';
                saveStatus.className = 'text-sm text-green-500';
                break;
            case 'unsaved':
                saveStatus.textContent = 'Sin guardar';
                saveStatus.className = 'text-sm text-gray-500';
                break;
            case 'error':
                saveStatus.textContent = 'Error al guardar';
                saveStatus.className = 'text-sm text-red-500';
                break;
        }
    }
    
    saveCurrentPage() {
        try {
            this.updateSaveStatus('saving');
            
            if (activeTopicId && db.pages[activeTopicId]) {
                // Sanitizar contenido antes de guardar
                const content = this.sanitizeContent(editorContent.innerHTML);
                db.pages[activeTopicId][activePageIndex].content = content;
                
                setTimeout(() => {
                    this.updateSaveStatus('saved');
                    NotificationManager.show('Página guardada correctamente');
                }, 500);
            }
        } catch (error) {
            console.error('Error guardando página:', error);
            this.updateSaveStatus('error');
            NotificationManager.show('Error al guardar la página', 'error');
        }
    }
    
    sanitizeContent(html) {
        // Básica protección XSS - remover scripts y eventos
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remover elementos script
        temp.querySelectorAll('script').forEach(el => el.remove());
        
        // Remover atributos de eventos
        temp.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        return temp.innerHTML;
    }
}

// Instanciar el editor cuando el DOM esté listo
let editorManager;
