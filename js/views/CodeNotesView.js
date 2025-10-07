/**
 * CodeNotesView - Grid modular para apuntes de programación
 * Sistema de tablero visual con drag & drop y bloques redimensionables
 */

class CodeNotesView {
    constructor(container, notifications, onContentChange = null) {
        this.container = container;
        this.notifications = notifications;
        this.onContentChange = onContentChange;
        this.blocks = [];
        this.monacoEditors = new Map();
        this.isMonacoLoaded = false;
        this.isMermaidLoaded = false;
        this.draggedBlockIndex = null;
        this.draggedElement = null;
        this.holdTimer = null;
        this.isDragging = false;
        this.dropZones = [];
        this.clickCount = 0;
        this.clickTimer = null;
        this.selectedBlockIndex = null;
        this.isRepositionMode = false;
        
        this.initializeMonaco();
        // Mermaid ya está cargado desde HTML
        this.isMermaidLoaded = !!window.mermaid;
        if (this.isMermaidLoaded) {
            console.log('✅ Mermaid detectado (cargado desde HTML)');
        }
    }
    
    /**
     * Carga Monaco Editor desde CDN
     */
    async initializeMonaco() {
        if (window.monaco) {
            this.isMonacoLoaded = true;
            return;
        }
        
        return new Promise((resolve, reject) => {
            // Cargar Monaco Editor
            const loaderScript = document.createElement('script');
            loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
            loaderScript.onload = () => {
                require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
                require(['vs/editor/editor.main'], () => {
                    this.isMonacoLoaded = true;
                    console.log('✅ Monaco Editor cargado correctamente');
                    resolve();
                });
            };
            loaderScript.onerror = reject;
            document.head.appendChild(loaderScript);
        });
    }
    
    /**
     * Carga Mermaid.js desde CDN
     */
    async initializeMermaid() {
        console.log('🚀 Iniciando carga de Mermaid.js...');
        
        if (window.mermaid) {
            console.log('✅ Mermaid ya estaba cargado');
            this.isMermaidLoaded = true;
            return Promise.resolve();
        }
        
        try {
            console.log('📥 Descargando Mermaid.js desde CDN (versión UMD)...');
            
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                // Usar versión UMD que expone window.mermaid
                script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
                
                script.onload = () => {
                    console.log('📦 Script de Mermaid cargado');
                    
                    // Verificar inmediatamente
                    if (window.mermaid) {
                        console.log('✅ window.mermaid está disponible!');
                        resolve();
                    } else {
                        console.error('❌ window.mermaid NO está disponible después de cargar');
                        setTimeout(() => {
                            if (window.mermaid) {
                                console.log('✅ window.mermaid disponible después de esperar');
                                resolve();
                            } else {
                                reject(new Error('Mermaid no se expuso a window'));
                            }
                        }, 100);
                    }
                };
                
                script.onerror = (error) => {
                    console.error('❌ Error al cargar script desde CDN:', error);
                    reject(new Error('Error cargando Mermaid.js desde CDN'));
                };
                
                document.head.appendChild(script);
                console.log('Script tag agregado al DOM');
            });
            
            console.log('⚙️ Configurando Mermaid...');
            
            // Configurar Mermaid
            window.mermaid.initialize({ 
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                themeVariables: {
                    primaryColor: '#007acc',
                    primaryTextColor: '#fff',
                    primaryBorderColor: '#007acc',
                    lineColor: '#6e7681',
                    secondaryColor: '#30363d',
                    tertiaryColor: '#161b22',
                    background: '#0d1117',
                    mainBkg: '#161b22',
                    secondBkg: '#21262d',
                    note: '#0d1117',
                    text: '#c9d1d9',
                    critical: '#f85149',
                    done: '#3fb950',
                    activeText: '#c9d1d9'
                }
            });
            
            this.isMermaidLoaded = true;
            console.log('✅✅✅ Mermaid.js cargado y configurado EXITOSAMENTE');
            console.log('Tipo de mermaid:', typeof window.mermaid);
            console.log('Métodos disponibles:', Object.keys(window.mermaid));
            
        } catch (error) {
            console.error('❌❌❌ ERROR FATAL inicializando Mermaid:', error);
            console.error('Stack:', error.stack);
            this.isMermaidLoaded = false;
            throw error;
        }
    }
    
    /**
     * Renderiza la vista completa
     */
    render(content = null) {
        try {
            const parsed = content ? JSON.parse(content) : {};
            this.blocks = parsed.blocks || [];
            
            // Asegurar que cada bloque tenga propiedades de grid
            this.blocks.forEach((block, index) => {
                if (!block.gridWidth) block.gridWidth = 1; // 1, 2 o 3 columnas
                if (!block.gridHeight) block.gridHeight = 1; // 1, 2 o 3 filas
                
                // Limitar tamaños a máximo 3x3
                if (block.gridWidth > 3) block.gridWidth = 3;
                if (block.gridHeight > 3) block.gridHeight = 3;
                
                // Asignar posición si no tiene (bloques antiguos)
                if (block.gridColumn === undefined || block.gridRow === undefined) {
                    // Buscar primera posición libre
                    let foundPosition = false;
                    for (let row = 1; row <= 20 && !foundPosition; row++) {
                        for (let col = 1; col <= 3 && !foundPosition; col++) {
                            // Verificar si esta posición está libre
                            const isOccupied = this.blocks.some((b, idx) => {
                                if (idx >= index) return false; // Solo verificar bloques ya procesados
                                const bCol = b.gridColumn || 1;
                                const bRow = b.gridRow || 1;
                                const bWidth = b.gridWidth || 1;
                                const bHeight = b.gridHeight || 1;
                                
                                // Verificar overlap
                                return (col < bCol + bWidth) && (col + block.gridWidth > bCol) &&
                                       (row < bRow + bHeight) && (row + block.gridHeight > bRow);
                            });
                            
                            if (!isOccupied && col + block.gridWidth <= 4) {
                                block.gridColumn = col;
                                block.gridRow = row;
                                foundPosition = true;
                            }
                        }
                    }
                    
                    // Si no encontró posición, poner al final
                    if (!foundPosition) {
                        block.gridColumn = 1;
                        block.gridRow = Math.floor(index / 3) + 1;
                    }
                }
            });
        } catch (e) {
            console.error('Error parseando contenido:', e);
            this.blocks = [{
                id: Date.now(),
                type: 'markdown',
                content: '# Mi Apunte\n\nEscribe aquí...',
                gridWidth: 1,
                gridHeight: 1
            }];
        }
        
        this.container.innerHTML = `
            <div class="code-notes-container">
                <div class="code-notes-toolbar">
                    <button class="btn-add-markdown" title="Agregar bloque de texto">
                        <i data-lucide="type" class="w-4 h-4"></i>
                        Texto
                    </button>
                    <button class="btn-add-code" title="Agregar bloque de código">
                        <i data-lucide="code" class="w-4 h-4"></i>
                        Código
                    </button>
                    <button class="btn-add-image" title="Agregar imagen">
                        <i data-lucide="image" class="w-4 h-4"></i>
                        Imagen
                    </button>
                    <button class="btn-add-mermaid" title="Agregar diagrama Mermaid">
                        <i data-lucide="workflow" class="w-4 h-4"></i>
                        Diagrama
                    </button>
                    <button class="btn-add-youtube" title="Agregar video de YouTube">
                        <i data-lucide="youtube" class="w-4 h-4"></i>
                        YouTube
                    </button>
                </div>
                <div class="code-notes-grid" id="code-blocks-container"></div>
            </div>
        `;
        
        this.injectStyles();
        this.renderBlocks();
        this.attachToolbarListeners();
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Renderiza todos los bloques
     */
    renderBlocks() {
        const blocksContainer = document.getElementById('code-blocks-container');
        blocksContainer.innerHTML = '';
        
        this.blocks.forEach((block, index) => {
            const blockEl = this.createBlockElement(block, index);
            blocksContainer.appendChild(blockEl);
        });
        
        // Listener para crear placeholder en espacios vacíos
        this.attachGridListeners(blocksContainer);
    }
    
    /**
     * Crea un placeholder visual para drag & drop
     */
    createDragPlaceholder(block) {
        const gridContainer = document.getElementById('code-blocks-container');
        
        // Remover placeholders existentes
        document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
        
        // Crear nuevo placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        placeholder.classList.add(`grid-width-${block.gridWidth || 1}`);
        placeholder.classList.add(`grid-height-${block.gridHeight || 1}`);
        placeholder.innerHTML = '<span class="placeholder-text">📍 Suelta aquí</span>';
        
        // Agregar al grid
        gridContainer.appendChild(placeholder);
    }
    
    /**
     * Adjunta listeners al grid para drag & drop en espacios vacíos
     */
    attachGridListeners(gridContainer) {
        let placeholderCreated = false;
        
        // Drag over en el grid
        gridContainer.addEventListener('dragover', (e) => {
            if (!this.isDragging || this.draggedBlockIndex === null) return;
            
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            
            // Si arrastramos sobre el grid vacío (no sobre un bloque)
            const isOverBlock = e.target.closest('.code-note-block');
            
            if (!isOverBlock && e.target === gridContainer) {
                // Crear placeholder si no existe
                if (!placeholderCreated && !gridContainer.querySelector('.drop-placeholder')) {
                    const draggedBlock = this.blocks[this.draggedBlockIndex];
                    this.createDragPlaceholder(draggedBlock);
                    placeholderCreated = true;
                }
            }
        });
        
        // Drag enter en el grid
        gridContainer.addEventListener('dragenter', (e) => {
            if (!this.isDragging || this.draggedBlockIndex === null) return;
            e.preventDefault();
        });
        
        // Drop en el grid vacío
        gridContainer.addEventListener('drop', (e) => {
            if (!this.isDragging || this.draggedBlockIndex === null) return;
            
            const isOverBlock = e.target.closest('.code-note-block');
            const isOverPlaceholder = e.target.classList.contains('drop-placeholder') || 
                                     e.target.closest('.drop-placeholder');
            
            // Solo procesar si es en el grid vacío o placeholder
            if (!isOverBlock && (e.target === gridContainer || isOverPlaceholder)) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`📍 Moviendo bloque ${this.draggedBlockIndex} al final`);
                
                // Mover al final
                const draggedItem = this.blocks[this.draggedBlockIndex];
                this.blocks.splice(this.draggedBlockIndex, 1);
                this.blocks.push(draggedItem);
                
                // Re-renderizar
                this.renderBlocks();
                
                // Notificar cambio
                if (this.onContentChange) {
                    this.onContentChange();
                }
                
                this.notifications.success('✅ Bloque movido al final');
                placeholderCreated = false;
            }
        });
        
        // Drag leave del grid
        gridContainer.addEventListener('dragleave', (e) => {
            // Solo remover placeholder si salimos completamente del grid
            const relatedTarget = e.relatedTarget;
            if (!relatedTarget || !gridContainer.contains(relatedTarget)) {
                document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
                placeholderCreated = false;
            }
        });
        
        // Limpiar placeholder al finalizar drag
        document.addEventListener('dragend', () => {
            document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
            placeholderCreated = false;
        });
    }
    
    /**
     * Obtiene la etiqueta del lenguaje
     */
    getLanguageLabel(lang) {
        const labels = {
            javascript: 'JS',
            typescript: 'TS',
            python: 'Py',
            java: 'Java',
            cpp: 'C++',
            c: 'C',
            csharp: 'C#',
            html: 'HTML',
            css: 'CSS',
            php: 'PHP',
            sql: 'SQL'
        };
        return labels[lang] || lang;
    }
    
    /**
     * Crea el elemento HTML de un bloque
     */
    createBlockElement(block, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-note-block';
        wrapper.classList.add(`grid-width-${block.gridWidth || 1}`);
        wrapper.classList.add(`grid-height-${block.gridHeight || 1}`);
        wrapper.dataset.blockId = block.id;
        wrapper.dataset.index = index;
        wrapper.draggable = false; // Inicialmente no draggable
        
        // Asignar posición en el grid si existe
        if (block.gridColumn !== undefined && block.gridRow !== undefined) {
            wrapper.style.gridColumn = `${block.gridColumn} / span ${block.gridWidth || 1}`;
            wrapper.style.gridRow = `${block.gridRow} / span ${block.gridHeight || 1}`;
        }
        
        let contentHtml = '';
        
        if (block.type === 'markdown') {
            contentHtml = `
                <textarea class="markdown-editor" placeholder="Escribe tus notas aquí...">${block.content || ''}</textarea>
            `;
        } else if (block.type === 'code') {
            contentHtml = `
                <div class="monaco-editor-container" id="monaco-${block.id}"></div>
            `;
        } else if (block.type === 'image') {
            contentHtml = `
                <div class="image-block">
                    ${block.imageUrl ? 
                        `<img src="${block.imageUrl}" alt="Imagen" class="block-image" />` : 
                        `<div class="image-placeholder">
                            <i data-lucide="image" class="w-12 h-12"></i>
                            <p class="text-sm text-gray-400 mt-2">Haz clic para agregar imagen</p>
                        </div>`
                    }
                    <input type="file" accept="image/*" class="image-upload-input" style="display: none;" />
                </div>
            `;
        } else if (block.type === 'youtube') {
            const videoId = block.youtubeId || '';
            contentHtml = `
                <div class="youtube-block">
                    ${videoId ? 
                        `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` : 
                        `<div class="youtube-placeholder">
                            <i data-lucide="youtube" class="w-12 h-12"></i>
                            <p class="text-sm text-gray-400 mt-2">Haz clic para agregar video de YouTube</p>
                            <input type="text" class="youtube-url-input" placeholder="Pega la URL del video aquí..." style="display: none;" />
                        </div>`
                    }
                </div>
            `;
        } else if (block.type === 'mermaid') {
            const viewMode = block.mermaidViewMode || 'preview'; // Por defecto mostrar diagrama
            contentHtml = `
                <div class="mermaid-block">
                    <!-- Botón toggle en esquina superior derecha -->
                    <button class="mermaid-toggle-corner btn-mermaid-toggle" title="${viewMode === 'preview' ? 'Editar código' : 'Ver diagrama'}">
                        <i data-lucide="${viewMode === 'preview' ? 'code-2' : 'eye'}"></i>
                    </button>
                    <div class="mermaid-content">
                        <div class="mermaid-editor-section ${viewMode === 'preview' ? 'hidden' : ''}">
                            <textarea class="mermaid-editor" placeholder="Escribe tu diagrama Mermaid...">${block.content || 'graph TD\n    A[Inicio] --> B[Proceso]\n    B --> C[Fin]'}</textarea>
                        </div>
                        <div class="mermaid-preview-section ${viewMode === 'editor' ? 'hidden' : ''}">
                            <div class="mermaid-diagram" id="mermaid-${block.id}"></div>
                            <div class="mermaid-error hidden"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        wrapper.innerHTML = `
            <!-- Área de doble clic (esquina inferior izquierda) -->
            <div class="triple-click-area" title="Doble clic para mover"></div>
            
            <!-- Botones de control minimalistas -->
            <div class="resize-buttons">
                ${block.type === 'code' ? `
                <button class="resize-btn btn-copy-code" title="Copiar código">
                    <i data-lucide="copy"></i>
                </button>
                ` : ''}
                <button class="resize-btn btn-delete-block" title="Eliminar">
                    <i data-lucide="trash-2"></i>
                </button>
                <button class="resize-btn resize-btn-up" title="Reducir abajo">▲</button>
                <button class="resize-btn resize-btn-down" title="Reducir arriba">▼</button>
                <button class="resize-btn resize-btn-left" title="Reducir derecha">◀</button>
                <button class="resize-btn resize-btn-right" title="Reducir izquierda">▶</button>
                <button class="resize-btn resize-btn-expand" title="Modo agrandar">⊕</button>
            </div>
            
            <div class="block-content">
                ${contentHtml}
            </div>
            
            ${block.type === 'code' ? `
            <!-- Selector de lenguaje en esquina inferior derecha -->
            <div class="language-selector-corner">
                <span class="language-display">${this.getLanguageLabel(block.language || 'javascript')}</span>
                <select class="language-selector-hidden">
                    <option value="javascript" ${block.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
                    <option value="typescript" ${block.language === 'typescript' ? 'selected' : ''}>TypeScript</option>
                    <option value="python" ${block.language === 'python' ? 'selected' : ''}>Python</option>
                    <option value="java" ${block.language === 'java' ? 'selected' : ''}>Java</option>
                    <option value="cpp" ${block.language === 'cpp' ? 'selected' : ''}>C++</option>
                    <option value="c" ${block.language === 'c' ? 'selected' : ''}>C</option>
                    <option value="csharp" ${block.language === 'csharp' ? 'selected' : ''}>C#</option>
                    <option value="html" ${block.language === 'html' ? 'selected' : ''}>HTML</option>
                    <option value="css" ${block.language === 'css' ? 'selected' : ''}>CSS</option>
                    <option value="php" ${block.language === 'php' ? 'selected' : ''}>PHP</option>
                    <option value="sql" ${block.language === 'sql' ? 'selected' : ''}>SQL</option>
                </select>
            </div>
            ` : ''}
        `;
        
        // Inicializar según el tipo
        if (block.type === 'markdown') {
            setTimeout(() => {
                const textarea = wrapper.querySelector('.markdown-editor');
                if (textarea) this.setupAutoResize(textarea);
            }, 10);
        } else if (block.type === 'code') {
            setTimeout(() => this.initializeMonacoEditor(block), 100);
        } else if (block.type === 'mermaid') {
            setTimeout(() => this.initializeMermaidDiagram(block, wrapper), 100);
        }
        
        this.attachBlockListeners(wrapper, block, index);
        
        // Renderizar iconos de Lucide después de crear el elemento
        setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 10);
        
        return wrapper;
    }
    
    /**
     * Inicializa un editor Monaco para un bloque de código
     */
    async initializeMonacoEditor(block) {
        if (!this.isMonacoLoaded) {
            await this.initializeMonaco();
        }
        
        const containerId = `monaco-${block.id}`;
        const container = document.getElementById(containerId);
        
        if (!container || !window.monaco) {
            console.error('Monaco container o Monaco no disponible');
            return;
        }
        
        // Tamaño fijo - 100% del contenedor
        container.style.height = '100%';
        
        const editor = monaco.editor.create(container, {
            value: block.content || '// Escribe tu código aquí...',
            language: block.language || 'javascript',
            theme: 'vs-dark',
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 20,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            wordWrapColumn: 80,
            wrappingStrategy: 'advanced',
            lineDecorationsWidth: 5,
            lineNumbersMinChars: 3,
            folding: false,
            glyphMargin: false,
            renderLineHighlight: 'gutter',
            renderLineHighlightOnlyWhenFocus: true,
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            padding: { top: 8, bottom: 8, left: 8, right: 8 },
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
                arrowSize: 0
            }
        });
        
        // Guardar referencia al editor
        this.monacoEditors.set(block.id, editor);
        
        // Actualizar contenido cuando cambie
        editor.onDidChangeModelContent(() => {
            block.content = editor.getValue();
            if (this.onContentChange) {
                this.onContentChange();
            }
        });
        
        console.log(`✅ Monaco Editor inicializado para bloque ${block.id}`);
    }
    
    /**
     * Configura textarea - Sin auto-resize, tamaño fijo
     */
    setupAutoResize(textarea) {
        // No hacer nada - el tamaño es fijo ahora
        // Método mantenido por compatibilidad
    }
    
    /**
     * Inicializa un bloque de diagrama Mermaid
     */
    async initializeMermaidDiagram(block, wrapper) {
        try {
            console.log('🔵 Inicializando bloque Mermaid:', block.id);
            
            // Verificar que Mermaid esté disponible (cargado desde HTML)
            if (!window.mermaid) {
                console.error('❌ Mermaid no está disponible. Debe cargarse desde index.html');
                return;
            }
            
            console.log('✅ Mermaid disponible, continuando...');
            
            const diagramContainer = wrapper.querySelector(`#mermaid-${block.id}`);
            const editor = wrapper.querySelector('.mermaid-editor');
            const errorDiv = wrapper.querySelector('.mermaid-error');
            const toggleBtn = wrapper.querySelector('.btn-mermaid-toggle');
            const editorSection = wrapper.querySelector('.mermaid-editor-section');
            const previewSection = wrapper.querySelector('.mermaid-preview-section');
            
            if (!diagramContainer || !editor || !toggleBtn) {
                console.error('❌ Mermaid containers no encontrados');
                return;
            }
            
            console.log('✅ Containers encontrados, configurando listeners...');
            
            // Renderizar diagrama por defecto si estamos en modo preview
            const currentMode = block.mermaidViewMode || 'preview';
            if (currentMode === 'preview' && block.content) {
                console.log('🎨 Renderizando diagrama inicial...');
                await this.renderMermaidDiagram(block.content, diagramContainer, errorDiv);
            }
            
            // Listener para guardar cambios al escribir
            editor.addEventListener('input', (e) => {
                block.content = e.target.value;
                if (this.onContentChange) {
                    this.onContentChange();
                }
            });
            
            // Listener para el botón toggle
            toggleBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const currentMode = block.mermaidViewMode || 'preview';
                const newMode = currentMode === 'preview' ? 'editor' : 'preview';
                
                console.log(`🔄 Cambiando de ${currentMode} a ${newMode}`);
                
                if (newMode === 'preview') {
                    // Cambiar a vista de diagrama
                    editorSection.classList.add('hidden');
                    previewSection.classList.remove('hidden');
                    
                    // Renderizar el diagrama
                    console.log('👁️ Renderizando diagrama...');
                    await this.renderMermaidDiagram(block.content || '', diagramContainer, errorDiv);
                    
                    // Actualizar ícono del botón
                    const icon = toggleBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'code-2');
                    }
                    toggleBtn.title = 'Editar código';
                } else {
                    // Cambiar a vista de código
                    editorSection.classList.remove('hidden');
                    previewSection.classList.add('hidden');
                    
                    // Actualizar ícono del botón
                    const icon = toggleBtn.querySelector('i');
                    if (icon) {
                        icon.setAttribute('data-lucide', 'eye');
                    }
                    toggleBtn.title = 'Ver diagrama';
                }
                
                // Re-renderizar iconos de Lucide
                if (window.lucide) {
                    window.lucide.createIcons();
                }
                
                // Guardar preferencia
                block.mermaidViewMode = newMode;
                if (this.onContentChange) {
                    this.onContentChange();
                }
            });
            
            console.log('✅ Mermaid diagram inicializado para bloque', block.id);
        } catch (error) {
            console.error('❌ Error inicializando Mermaid diagram:', error);
        }
    }
    
    /**
     * Renderiza un diagrama Mermaid
     */
    async renderMermaidDiagram(code, container, errorDiv) {
        console.log('🎨 Iniciando renderizado de Mermaid...');
        
        if (!window.mermaid) {
            console.error('❌ Mermaid no está cargado');
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = 'Error: Mermaid.js no está cargado';
            return;
        }
        
        if (!code || !code.trim()) {
            container.innerHTML = '<div style="color: #6a6a6a; text-align: center; padding: 40px;">No hay código para renderizar</div>';
            container.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            return;
        }
        
        try {
            console.log('Código a renderizar:', code);
            
            // Limpiar contenedor
            container.innerHTML = '';
            container.classList.remove('hidden');
            errorDiv.classList.add('hidden');
            
            // Generar ID único para este render
            const id = `mermaid-svg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log('ID generado:', id);
            
            // Renderizar diagrama
            const result = await window.mermaid.render(id, code);
            console.log('Resultado del render:', result);
            
            if (result && result.svg) {
                container.innerHTML = result.svg;
                console.log('✅ Diagrama Mermaid renderizado correctamente');
            } else {
                throw new Error('No se pudo generar el SVG');
            }
            
        } catch (error) {
            console.error('❌ Error renderizando Mermaid:', error);
            container.innerHTML = '';
            container.classList.add('hidden');
            errorDiv.classList.remove('hidden');
            errorDiv.textContent = `Error de sintaxis: ${error.message || 'Revisa tu código Mermaid'}`;
        }
    }
    
    /**
     * Sistema de Drag & Drop Profesional + Triple Clic
     */
    setupDragAndDrop(wrapper, block, index) {
        let holdStartTime = 0;
        let isHolding = false;
        
        // SISTEMA DE DOBLE CLIC - Solo en el área específica
        const tripleClickArea = wrapper.querySelector('.triple-click-area');
        if (tripleClickArea) {
            tripleClickArea.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                console.log('🎯 ¡DOBLE CLIC DETECTADO en bloque', index, '!');
                this.activateRepositionMode(index, block);
            });
        } else {
            console.warn('⚠️ Área de doble clic no encontrada para bloque', index);
        }
        
        // PASO 1: Detectar hold de 1 segundo
        wrapper.addEventListener('mousedown', (e) => {
            // Ignorar si es el selector de lenguaje o elementos interactivos
            if (e.target.closest('.resize-buttons') ||
                e.target.closest('.language-selector-corner') ||
                e.target.closest('.markdown-editor') ||
                e.target.closest('.monaco-editor') ||
                e.target.closest('.image-block') ||
                e.target.closest('.mermaid-block')) {
                return;
            }
            
            holdStartTime = Date.now();
            isHolding = true;
            
            // Timer de 1 segundo
            this.holdTimer = setTimeout(() => {
                if (isHolding) {
                    wrapper.draggable = true;
                    wrapper.classList.add('ready-to-drag');
                    this.notifications.success('🎯 Listo para arrastrar');
                    
                    // Vibración en dispositivos móviles
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }
            }, 1000);
        });
        
        // Cancelar hold si se suelta antes de 1 segundo
        wrapper.addEventListener('mouseup', () => {
            isHolding = false;
            if (this.holdTimer) {
                clearTimeout(this.holdTimer);
                this.holdTimer = null;
            }
        });
        
        wrapper.addEventListener('mouseleave', () => {
            isHolding = false;
            if (this.holdTimer) {
                clearTimeout(this.holdTimer);
                this.holdTimer = null;
            }
        });
        
        // PASO 2: Iniciar arrastre
        wrapper.addEventListener('dragstart', (e) => {
            if (!wrapper.draggable) {
                e.preventDefault();
                return;
            }
            
            this.isDragging = true;
            this.draggedBlockIndex = index;
            this.draggedElement = wrapper;
            
            // Configurar datos de transferencia
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', wrapper.innerHTML);
            e.dataTransfer.setData('application/json', JSON.stringify({
                index: index,
                blockId: block.id
            }));
            
            // Estilos visuales
            wrapper.classList.add('dragging');
            wrapper.classList.remove('ready-to-drag');
            
            // Crear imagen de arrastre personalizada
            const dragImage = wrapper.cloneNode(true);
            dragImage.style.opacity = '0.8';
            dragImage.style.transform = 'rotate(3deg)';
            document.body.appendChild(dragImage);
            e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);
            setTimeout(() => document.body.removeChild(dragImage), 0);
            
            console.log('🚀 Drag iniciado:', index);
        });
        
        // PASO 3: Drag over - Permitir drop
        wrapper.addEventListener('dragover', (e) => {
            if (!this.isDragging || this.draggedBlockIndex === null) return;
            
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            
            // Highlight visual solo si es diferente
            if (this.draggedBlockIndex !== index) {
                wrapper.classList.add('drag-over');
            }
        });
        
        // PASO 4: Drag enter
        wrapper.addEventListener('dragenter', (e) => {
            if (!this.isDragging || this.draggedBlockIndex === null) return;
            
            e.preventDefault();
            if (this.draggedBlockIndex !== index) {
                wrapper.classList.add('drag-over');
            }
        });
        
        // PASO 5: Drag leave
        wrapper.addEventListener('dragleave', (e) => {
            // Solo remover si realmente salimos del elemento
            if (e.target === wrapper) {
                wrapper.classList.remove('drag-over');
            }
        });
        
        // PASO 6: Drop - Intercambiar posiciones
        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            wrapper.classList.remove('drag-over');
            
            if (this.draggedBlockIndex !== null && this.draggedBlockIndex !== index) {
                console.log(`🔄 Intercambiando: ${this.draggedBlockIndex} ↔ ${index}`);
                
                // Intercambiar bloques en el array
                const temp = this.blocks[this.draggedBlockIndex];
                this.blocks[this.draggedBlockIndex] = this.blocks[index];
                this.blocks[index] = temp;
                
                // Re-renderizar
                this.renderBlocks();
                
                // Notificar cambio
                if (this.onContentChange) {
                    this.onContentChange();
                }
                
                this.notifications.success('✅ Bloques intercambiados');
            }
        });
        
        // PASO 7: Drag end - Limpiar
        wrapper.addEventListener('dragend', (e) => {
            console.log('🏁 Drag finalizado');
            
            // Limpiar estados
            wrapper.classList.remove('dragging', 'ready-to-drag', 'drag-over');
            wrapper.draggable = false;
            
            this.isDragging = false;
            this.draggedBlockIndex = null;
            this.draggedElement = null;
            
            // Limpiar todos los highlights
            document.querySelectorAll('.code-note-block').forEach(el => {
                el.classList.remove('drag-over', 'ready-to-drag');
            });
            
            // Limpiar placeholders
            document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
        });
    }
    
    /**
     * Sistema de redimensionamiento con botones de flechas
     */
    setupResize(wrapper, block, blockIndex) {
        const btnUp = wrapper.querySelector('.resize-btn-up');
        const btnDown = wrapper.querySelector('.resize-btn-down');
        const btnLeft = wrapper.querySelector('.resize-btn-left');
        const btnRight = wrapper.querySelector('.resize-btn-right');
        
        let isResizing = false;
        let resizeDirection = null;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;
        let currentWidth = 0;
        let currentHeight = 0;
        
        // Función para verificar si hay colisión al redimensionar
        const wouldCollide = (newWidth, newHeight) => {
            const col = block.gridColumn;
            const row = block.gridRow;
            
            // Verificar que no exceda el grid (máximo 3x3)
            if (col + newWidth > 4 || row + newHeight > 21) {
                return true;
            }
            
            // Verificar colisión con otros bloques
            return this.blocks.some((b, idx) => {
                if (idx === blockIndex) return false;
                
                const bCol = b.gridColumn || 1;
                const bRow = b.gridRow || 1;
                const bWidth = b.gridWidth || 1;
                const bHeight = b.gridHeight || 1;
                
                // Verificar si hay overlap
                const horizontalOverlap = (col < bCol + bWidth) && (col + newWidth > bCol);
                const verticalOverlap = (row < bRow + bHeight) && (row + newHeight > bRow);
                
                return horizontalOverlap && verticalOverlap;
            });
        };
        
        // Función para empujar bloques hacia abajo
        const pushBlocksDown = (newHeight) => {
            const col = block.gridColumn;
            const row = block.gridRow;
            const bottomRow = row + newHeight;
            
            this.blocks.forEach((b, idx) => {
                if (idx === blockIndex) return;
                
                const bCol = b.gridColumn || 1;
                const bRow = b.gridRow || 1;
                const bWidth = b.gridWidth || 1;
                
                // Si el bloque está en la misma columna o se superpone horizontalmente
                const horizontalOverlap = (col < bCol + bWidth) && (col + block.gridWidth > bCol);
                
                // Si el bloque está justo debajo o se superpone
                if (horizontalOverlap && bRow < bottomRow && bRow >= row) {
                    const pushDistance = bottomRow - bRow;
                    b.gridRow = bRow + pushDistance;
                    console.log(`📦 Empujando bloque ${idx} de fila ${bRow} a ${b.gridRow}`);
                }
            });
        };
        
        const startResize = (e, direction) => {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            resizeDirection = direction;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = block.gridWidth || 1;
            startHeight = block.gridHeight || 1;
            currentWidth = startWidth;
            currentHeight = startHeight;
            
            document.body.style.cursor = direction === 'right' ? 'ew-resize' : 
                                        direction === 'bottom' ? 'ns-resize' : 'nwse-resize';
            document.body.style.userSelect = 'none';
            
            console.log(`🔧 Iniciando resize ${direction} desde ${startWidth}x${startHeight}`);
        };
        
        const doResize = (e) => {
            if (!isResizing) return;
            
            e.preventDefault();
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // Calcular nuevo tamaño basado en el movimiento del mouse
            // Cada 200px de movimiento = 1 unidad de grid
            const gridCellWidth = 200;
            const gridCellHeight = 220;
            
            if (resizeDirection === 'right' || resizeDirection === 'corner') {
                const widthChange = Math.floor(deltaX / gridCellWidth);
                const newWidth = Math.min(3, Math.max(1, startWidth + widthChange));
                
                if (newWidth !== currentWidth) {
                    if (!wouldCollide(newWidth, currentHeight)) {
                        currentWidth = newWidth;
                        block.gridWidth = newWidth;
                        wrapper.classList.remove('grid-width-1', 'grid-width-2', 'grid-width-3');
                        wrapper.classList.add(`grid-width-${newWidth}`);
                        wrapper.style.gridColumn = `${block.gridColumn} / span ${newWidth}`;
                        console.log(`↔️ Ancho: ${newWidth}`);
                    }
                }
            }
            
            if (resizeDirection === 'bottom' || resizeDirection === 'corner') {
                const heightChange = Math.floor(deltaY / gridCellHeight);
                const newHeight = Math.min(3, Math.max(1, startHeight + heightChange));
                
                if (newHeight !== currentHeight) {
                    // Empujar bloques si hay colisión
                    if (wouldCollide(currentWidth, newHeight)) {
                        pushBlocksDown(newHeight);
                    }
                    
                    currentHeight = newHeight;
                    block.gridHeight = newHeight;
                    wrapper.classList.remove('grid-height-1', 'grid-height-2', 'grid-height-3');
                    wrapper.classList.add(`grid-height-${newHeight}`);
                    wrapper.style.gridRow = `${block.gridRow} / span ${newHeight}`;
                    console.log(`↕️ Alto: ${newHeight}`);
                }
            }
        };
        
        const stopResize = () => {
            if (!isResizing) return;
            
            isResizing = false;
            resizeDirection = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Re-renderizar para actualizar posiciones
            this.renderBlocks();
            
            // Guardar cambios
            if (this.onContentChange) {
                this.onContentChange();
            }
            
            console.log('✅ Resize completado');
        };
        
        // Event listeners para botones de reducción
        if (btnUp) {
            btnUp.addEventListener('click', (e) => {
                e.stopPropagation();
                shrinkWithButton('up');
            });
        }
        
        if (btnDown) {
            btnDown.addEventListener('click', (e) => {
                e.stopPropagation();
                shrinkWithButton('down');
            });
        }
        
        if (btnLeft) {
            btnLeft.addEventListener('click', (e) => {
                e.stopPropagation();
                shrinkWithButton('left');
            });
        }
        
        if (btnRight) {
            btnRight.addEventListener('click', (e) => {
                e.stopPropagation();
                shrinkWithButton('right');
            });
        }
        
        // Botón de modo expansión
        const btnExpand = wrapper.querySelector('.resize-btn-expand');
        if (btnExpand) {
            btnExpand.addEventListener('click', (e) => {
                e.stopPropagation();
                this.activateExpandMode(wrapper, block, blockIndex);
            });
        }
        
        // Función para reducir con botones (SOLO ACHICAR)
        const shrinkWithButton = (direction) => {
            const currentWidth = block.gridWidth || 1;
            const currentHeight = block.gridHeight || 1;
            const currentCol = block.gridColumn || 1;
            const currentRow = block.gridRow || 1;
            
            switch(direction) {
                case 'right':
                    // Reducir izquierda (mover columna a la derecha)
                    if (currentWidth > 1) {
                        block.gridColumn = currentCol + 1;
                        block.gridWidth = currentWidth - 1;
                        this.notifications.success(`↔️ Ancho: ${currentWidth - 1}`);
                    } else {
                        this.notifications.warning('No se puede reducir más');
                        return;
                    }
                    break;
                    
                case 'left':
                    // Reducir derecha (solo reducir ancho)
                    if (currentWidth > 1) {
                        block.gridWidth = currentWidth - 1;
                        this.notifications.success(`↔️ Ancho: ${currentWidth - 1}`);
                    } else {
                        this.notifications.warning('No se puede reducir más');
                        return;
                    }
                    break;
                    
                case 'down':
                    // Reducir arriba (mover fila hacia abajo)
                    if (currentHeight > 1) {
                        block.gridRow = currentRow + 1;
                        block.gridHeight = currentHeight - 1;
                        this.notifications.success(`↕️ Alto: ${currentHeight - 1}`);
                    } else {
                        this.notifications.warning('No se puede reducir más');
                        return;
                    }
                    break;
                    
                case 'up':
                    // Reducir abajo (solo reducir alto)
                    if (currentHeight > 1) {
                        block.gridHeight = currentHeight - 1;
                        this.notifications.success(`↕️ Alto: ${currentHeight - 1}`);
                    } else {
                        this.notifications.warning('No se puede reducir más');
                        return;
                    }
                    break;
            }
            
            // Re-renderizar
            this.renderBlocks();
            
            // Guardar cambios
            if (this.onContentChange) {
                this.onContentChange();
            }
        };
    }
    
    /**
     * Activa el modo de reposición con doble clic
     */
    activateRepositionMode(blockIndex, block) {
        try {
            console.log('🎯 Modo reposición activado para bloque:', blockIndex);
            
            // Validar parámetros
            if (blockIndex === null || blockIndex === undefined) {
                console.error('Índice de bloque es null o undefined');
                return;
            }
            
            if (!block) {
                console.error('Bloque es null o undefined');
                return;
            }
            
            // Validar índice
            if (blockIndex < 0 || blockIndex >= this.blocks.length) {
                console.error('Índice de bloque inválido:', blockIndex);
                return;
            }
            
            this.isRepositionMode = true;
            this.selectedBlockIndex = blockIndex;
            
            // Marcar bloque seleccionado
            const selectedBlock = document.querySelector(`[data-index="${blockIndex}"]`);
            if (selectedBlock) {
                selectedBlock.classList.add('reposition-selected');
            } else {
                console.warn('Bloque seleccionado no encontrado en DOM');
            }
            
            // Calcular posiciones válidas (sin crear fantasmas aún)
            this.calculateValidPositions(block);
            
            // Crear una sola caja fantasma que seguirá al cursor
            this.createFollowingGhost(block);
            
            // Notificación
            this.notifications.success('🎯 Mueve el cursor para ver dónde puedes colocar el bloque');
            
            // Listener para cancelar con ESC
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.cancelRepositionMode();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        } catch (error) {
            console.error('Error activando modo reposición:', error);
            this.cancelRepositionMode();
        }
    }
    
    /**
     * Calcula las posiciones válidas sin crear fantasmas
     */
    calculateValidPositions(block) {
        const blockWidth = block.gridWidth || 1;
        const blockHeight = block.gridHeight || 1;
        
        console.log(`📦 Calculando posiciones para bloque ${blockWidth}x${blockHeight}`);
        
        // Función para verificar si un bloque cabe completamente en una posición
        const canFitAt = (col, row) => {
            if (col + blockWidth > 4 || row + blockHeight > 21) {
                return false;
            }
            
            for (let r = row; r < row + blockHeight; r++) {
                for (let c = col; c < col + blockWidth; c++) {
                    const isOccupied = this.blocks.some((b, idx) => {
                        if (idx === this.selectedBlockIndex) return false;
                        
                        const bCol = b.gridColumn || 1;
                        const bRow = b.gridRow || 1;
                        const bWidth = b.gridWidth || 1;
                        const bHeight = b.gridHeight || 1;
                        
                        return c >= bCol && c < bCol + bWidth &&
                               r >= bRow && r < bRow + bHeight;
                    });
                    
                    if (isOccupied) return false;
                }
            }
            
            return true;
        };
        
        // Verificar si una fila está completamente libre
        const isRowCompletelyFree = (row) => {
            for (let col = 1; col <= 3; col++) {
                const isOccupied = this.blocks.some((b, idx) => {
                    if (idx === this.selectedBlockIndex) return false;
                    
                    const bCol = b.gridColumn || 1;
                    const bRow = b.gridRow || 1;
                    const bWidth = b.gridWidth || 1;
                    const bHeight = b.gridHeight || 1;
                    
                    return col >= bCol && col < bCol + bWidth &&
                           row >= bRow && row < bRow + bHeight;
                });
                
                if (isOccupied) return false;
            }
            return true;
        };
        
        // Encontrar la fila más baja ocupada
        let maxOccupiedRow = 0;
        this.blocks.forEach((b, idx) => {
            if (idx !== this.selectedBlockIndex) {
                const bRow = b.gridRow || 1;
                const bHeight = b.gridHeight || 1;
                const bottomRow = bRow + bHeight - 1;
                if (bottomRow > maxOccupiedRow) {
                    maxOccupiedRow = bottomRow;
                }
            }
        });
        
        this.validPositions = [];
        
        // CASO 1: Caja 3x3 completa
        if (blockWidth === 3 && blockHeight === 3) {
            let foundPosition = false;
            for (let row = 1; row <= maxOccupiedRow && !foundPosition; row++) {
                if (canFitAt(1, row)) {
                    this.validPositions.push({ col: 1, row });
                    foundPosition = true;
                }
            }
            
            const finalRow = maxOccupiedRow + 1;
            if (canFitAt(1, finalRow)) {
                this.validPositions.push({ col: 1, row: finalRow });
            }
        }
        // CASO 2: Cajas rectangulares anchas
        else if (blockWidth === 3 && blockHeight < 3) {
            for (let row = 1; row <= maxOccupiedRow; row++) {
                let allRowsFree = true;
                for (let r = row; r < row + blockHeight; r++) {
                    if (!isRowCompletelyFree(r)) {
                        allRowsFree = false;
                        break;
                    }
                }
                
                if (allRowsFree && canFitAt(1, row)) {
                    this.validPositions.push({ col: 1, row });
                }
            }
            
            const finalRow = maxOccupiedRow + 1;
            if (canFitAt(1, finalRow)) {
                this.validPositions.push({ col: 1, row: finalRow });
            }
        }
        // CASO 3: Cajas normales
        else {
            const maxRows = maxOccupiedRow + 2;
            
            for (let row = 1; row <= maxRows; row++) {
                for (let col = 1; col <= 3; col++) {
                    if (canFitAt(col, row)) {
                        this.validPositions.push({ col, row });
                    }
                }
            }
        }
        
        console.log(`✅ ${this.validPositions.length} posiciones válidas calculadas`);
    }
    
    /**
     * Crea una caja fantasma que sigue al cursor
     */
    createFollowingGhost(block) {
        const gridContainer = document.getElementById('code-blocks-container');
        if (!gridContainer) return;
        
        const blockWidth = block.gridWidth || 1;
        const blockHeight = block.gridHeight || 1;
        
        // Crear la caja fantasma
        const ghost = document.createElement('div');
        ghost.className = 'ghost-box following-ghost';
        ghost.classList.add(`grid-width-${blockWidth}`);
        ghost.classList.add(`grid-height-${blockHeight}`);
        ghost.style.opacity = '0'; // Invisible al inicio
        
        gridContainer.appendChild(ghost);
        
        // Listener de movimiento del mouse - MEJORADO
        const mouseMoveHandler = (e) => {
            if (!this.isRepositionMode) return;
            
            try {
                // Si no hay posiciones válidas, salir
                if (!this.validPositions || this.validPositions.length === 0) {
                    ghost.style.opacity = '0';
                    return;
                }
                
                // Obtener posición del mouse
                const gridRect = gridContainer.getBoundingClientRect();
                const mouseX = e.clientX - gridRect.left;
                const mouseY = e.clientY - gridRect.top + gridContainer.scrollTop;
                
                // Calcular columna y fila con mayor precisión
                const cellWidth = gridRect.width / 3;
                const cellHeight = 220;
                
                // Usar el centro de cada celda para mejor detección
                const colFloat = mouseX / cellWidth;
                const rowFloat = mouseY / cellHeight;
                
                // Redondear al más cercano en lugar de floor
                const approxCol = Math.max(1, Math.min(3, Math.round(colFloat + 0.5)));
                const approxRow = Math.max(1, Math.round(rowFloat + 0.5));
                
                // Buscar la posición válida más cercana usando distancia euclidiana
                let closestPos = null;
                let minDistance = Infinity;
                
                this.validPositions.forEach(pos => {
                    // Calcular el centro de cada posición válida en píxeles
                    const posCenterX = (pos.col - 0.5) * cellWidth;
                    const posCenterY = (pos.row - 0.5) * cellHeight;
                    
                    // Distancia euclidiana desde el mouse al centro de la posición
                    const dx = mouseX - posCenterX;
                    const dy = mouseY - posCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPos = pos;
                    }
                });
                
                // Alternativa: buscar por zona directa si el mouse está dentro de una celda válida
                const directMatch = this.validPositions.find(pos => {
                    const colMatch = Math.floor(mouseX / cellWidth) + 1 === pos.col;
                    const rowMatch = Math.floor(mouseY / cellHeight) + 1 === pos.row;
                    return colMatch && rowMatch;
                });
                
                // Preferir match directo si existe
                if (directMatch) {
                    closestPos = directMatch;
                }
                
                if (closestPos) {
                    // Solo actualizar si cambió la posición (evita re-renders innecesarios)
                    const currentCol = parseInt(ghost.dataset.targetColumn);
                    const currentRow = parseInt(ghost.dataset.targetRow);
                    
                    if (currentCol !== closestPos.col || currentRow !== closestPos.row) {
                        ghost.style.gridColumn = `${closestPos.col} / span ${blockWidth}`;
                        ghost.style.gridRow = `${closestPos.row} / span ${blockHeight}`;
                        ghost.dataset.targetColumn = closestPos.col;
                        ghost.dataset.targetRow = closestPos.row;
                        console.log(`📍 Fantasma en col ${closestPos.col}, row ${closestPos.row}`);
                    }
                    
                    ghost.style.opacity = '1';
                } else {
                    ghost.style.opacity = '0';
                }
            } catch (error) {
                console.error('Error en mouseMoveHandler:', error);
            }
        };
        
        // Listener de clic para colocar
        const clickHandler = (e) => {
            if (!this.isRepositionMode) return;
            
            try {
                // Prevenir que se cierre si hacemos clic en un bloque
                if (e.target.closest('.code-note-block')) {
                    return;
                }
                
                const targetCol = parseInt(ghost.dataset.targetColumn);
                const targetRow = parseInt(ghost.dataset.targetRow);
                
                if (targetCol && targetRow && !isNaN(targetCol) && !isNaN(targetRow)) {
                    console.log(`✅ Colocando bloque en col ${targetCol}, row ${targetRow}`);
                    this.moveBlockToGridPosition(this.selectedBlockIndex, targetCol, targetRow);
                } else {
                    console.warn('⚠️ No hay posición válida para colocar');
                }
            } catch (error) {
                console.error('Error en clickHandler:', error);
            }
        };
        
        gridContainer.addEventListener('mousemove', mouseMoveHandler);
        gridContainer.addEventListener('click', clickHandler);
        
        // Guardar referencias para limpiar después
        this.ghostMouseMoveHandler = mouseMoveHandler;
        this.ghostClickHandler = clickHandler;
    }
    
    /**
     * Crea cajas fantasmas inteligentes según el tamaño del bloque (MÉTODO ANTIGUO - NO USADO)
     */
    createGhostBoxes(block) {
        const gridContainer = document.getElementById('code-blocks-container');
        if (!gridContainer) {
            console.error('Grid container no encontrado');
            return;
        }
        
        try {
            const blockWidth = block.gridWidth || 1;
            const blockHeight = block.gridHeight || 1;
            
            console.log(`📦 Buscando posiciones para bloque ${blockWidth}x${blockHeight}`);
            
            // Función para verificar si un bloque cabe completamente en una posición
            const canFitAt = (col, row) => {
                // Verificar límites del grid
                if (col + blockWidth > 4 || row + blockHeight > 21) {
                    return false;
                }
                
                // Verificar cada celda que ocuparía el bloque
                for (let r = row; r < row + blockHeight; r++) {
                    for (let c = col; c < col + blockWidth; c++) {
                        // Verificar si esta celda está ocupada por otro bloque
                        const isOccupied = this.blocks.some((b, idx) => {
                            if (idx === this.selectedBlockIndex) return false;
                            
                            const bCol = b.gridColumn || 1;
                            const bRow = b.gridRow || 1;
                            const bWidth = b.gridWidth || 1;
                            const bHeight = b.gridHeight || 1;
                            
                            // Verificar si la celda (c, r) está dentro del bloque b
                            return c >= bCol && c < bCol + bWidth &&
                                   r >= bRow && r < bRow + bHeight;
                        });
                        
                        if (isOccupied) return false;
                    }
                }
                
                return true;
            };
            
            // Verificar si una fila está completamente libre
            const isRowCompletelyFree = (row) => {
                for (let col = 1; col <= 3; col++) {
                    const isOccupied = this.blocks.some((b, idx) => {
                        if (idx === this.selectedBlockIndex) return false;
                        
                        const bCol = b.gridColumn || 1;
                        const bRow = b.gridRow || 1;
                        const bWidth = b.gridWidth || 1;
                        const bHeight = b.gridHeight || 1;
                        
                        return col >= bCol && col < bCol + bWidth &&
                               row >= bRow && row < bRow + bHeight;
                    });
                    
                    if (isOccupied) return false;
                }
                return true;
            };
            
            // Encontrar la fila más baja ocupada
            let maxOccupiedRow = 0;
            this.blocks.forEach((b, idx) => {
                if (idx !== this.selectedBlockIndex) {
                    const bRow = b.gridRow || 1;
                    const bHeight = b.gridHeight || 1;
                    const bottomRow = bRow + bHeight - 1;
                    if (bottomRow > maxOccupiedRow) {
                        maxOccupiedRow = bottomRow;
                    }
                }
            });
            
            const validPositions = [];
            
            // CASO 1: Caja 3x3 completa
            if (blockWidth === 3 && blockHeight === 3) {
                console.log('📦 Caso: Caja 3x3 completa');
                
                // Buscar si cabe en algún lado
                let foundPosition = false;
                for (let row = 1; row <= maxOccupiedRow && !foundPosition; row++) {
                    if (canFitAt(1, row)) {
                        validPositions.push({ col: 1, row });
                        foundPosition = true;
                    }
                }
                
                // Siempre crear una al final
                const finalRow = maxOccupiedRow + 1;
                if (canFitAt(1, finalRow)) {
                    validPositions.push({ col: 1, row: finalRow });
                }
            }
            // CASO 2: Cajas rectangulares anchas (3 de ancho × 1-2 de alto)
            else if (blockWidth === 3 && blockHeight < 3) {
                console.log('📦 Caso: Caja rectangular ancha 3x' + blockHeight);
                
                // Solo crear fantasmas en filas completamente libres
                for (let row = 1; row <= maxOccupiedRow; row++) {
                    let allRowsFree = true;
                    for (let r = row; r < row + blockHeight; r++) {
                        if (!isRowCompletelyFree(r)) {
                            allRowsFree = false;
                            break;
                        }
                    }
                    
                    if (allRowsFree && canFitAt(1, row)) {
                        validPositions.push({ col: 1, row });
                    }
                }
                
                // Siempre una al final
                const finalRow = maxOccupiedRow + 1;
                if (canFitAt(1, finalRow)) {
                    validPositions.push({ col: 1, row: finalRow });
                }
            }
            // CASO 3: Cajas normales (1x1, 2x2, 2x1, 1x2, etc.)
            else {
                console.log('📦 Caso: Caja normal ' + blockWidth + 'x' + blockHeight);
                
                // Buscar todas las posiciones válidas hasta 2 filas después
                const maxRows = maxOccupiedRow + 2;
                
                for (let row = 1; row <= maxRows; row++) {
                    for (let col = 1; col <= 3; col++) {
                        if (canFitAt(col, row)) {
                            validPositions.push({ col, row });
                        }
                    }
                }
            }
            
            console.log(`✅ Encontradas ${validPositions.length} posiciones válidas`);
            
            // Crear fantasmas solo en posiciones válidas - SIEMPRE del tamaño del bloque
            validPositions.forEach(pos => {
                const ghost = document.createElement('div');
                ghost.className = 'ghost-box';
                ghost.classList.add(`grid-width-${blockWidth}`);
                ghost.classList.add(`grid-height-${blockHeight}`);
                
                // Posicionar en el grid con el tamaño REAL del bloque
                ghost.style.gridColumn = `${pos.col} / span ${blockWidth}`;
                ghost.style.gridRow = `${pos.row} / span ${blockHeight}`;
                
                ghost.dataset.targetColumn = pos.col;
                ghost.dataset.targetRow = pos.row;
                
                // Solo icono
                const ghostIcon = document.createElement('div');
                ghostIcon.className = 'ghost-icon';
                ghostIcon.textContent = '📍';
                ghost.appendChild(ghostIcon);
                
                // Listener para mover
                ghost.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveBlockToGridPosition(this.selectedBlockIndex, pos.col, pos.row);
                });
                
                gridContainer.appendChild(ghost);
            });
            
        } catch (error) {
            console.error('Error creando cajas fantasmas:', error);
            this.cancelRepositionMode();
        }
    }
    
    /**
     * Mueve un bloque a una posición específica del grid
     */
    moveBlockToGridPosition(blockIndex, targetCol, targetRow) {
        try {
            console.log(`📦 Moviendo bloque ${blockIndex} a columna ${targetCol}, fila ${targetRow}`);
            
            if (blockIndex < 0 || blockIndex >= this.blocks.length) {
                console.error('Índice de bloque inválido:', blockIndex);
                return;
            }
            
            // Actualizar posición del bloque
            this.blocks[blockIndex].gridColumn = targetCol;
            this.blocks[blockIndex].gridRow = targetRow;
            
            console.log('Bloque actualizado:', this.blocks[blockIndex]);
            
            // Cancelar modo reposición
            this.cancelRepositionMode();
            
            // Re-renderizar
            this.renderBlocks();
            
            // Notificar cambio
            if (this.onContentChange) {
                this.onContentChange();
            }
            
            this.notifications.success('✅ Bloque movido correctamente');
        } catch (error) {
            console.error('Error moviendo bloque:', error);
            this.cancelRepositionMode();
            this.notifications.error('Error al mover el bloque');
        }
    }
    
    /**
     * Mueve un bloque a una nueva posición (método antiguo - mantener por compatibilidad)
     */
    moveBlockToPosition(fromIndex, toIndex) {
        try {
            console.log(`📦 Moviendo bloque de posición ${fromIndex} a posición ${toIndex}`);
            console.log('Bloques antes:', this.blocks.map((b, i) => `${i}: ${b.type}`));
            
            // Validar índices
            if (fromIndex < 0 || fromIndex >= this.blocks.length) {
                console.error('Índice origen inválido:', fromIndex);
                return;
            }
            
            if (toIndex < 0) {
                console.error('Índice destino inválido:', toIndex);
                return;
            }
            
            // Extraer el bloque
            const movedBlock = this.blocks.splice(fromIndex, 1)[0];
            console.log('Bloque extraído:', movedBlock.type);
            
            if (!movedBlock) {
                console.error('No se pudo extraer el bloque');
                return;
            }
            
            // Ajustar índice de destino si es necesario
            // Si movemos hacia adelante, el índice se reduce en 1 después del splice
            let adjustedToIndex = toIndex;
            if (toIndex > fromIndex) {
                adjustedToIndex = toIndex - 1;
            }
            
            // Insertar en la nueva posición
            if (adjustedToIndex >= this.blocks.length) {
                this.blocks.push(movedBlock);
                console.log('Bloque agregado al final');
            } else {
                this.blocks.splice(adjustedToIndex, 0, movedBlock);
                console.log(`Bloque insertado en posición ${adjustedToIndex}`);
            }
            
            console.log('Bloques después:', this.blocks.map((b, i) => `${i}: ${b.type}`));
            
            // Cancelar modo reposición
            this.cancelRepositionMode();
            
            // Re-renderizar
            this.renderBlocks();
            
            // Notificar cambio
            if (this.onContentChange) {
                this.onContentChange();
            }
            
            this.notifications.success('✅ Bloque movido correctamente');
        } catch (error) {
            console.error('Error moviendo bloque:', error);
            this.cancelRepositionMode();
            this.notifications.error('Error al mover el bloque');
        }
    }
    
    /**
     * Cancela el modo de reposición
     */
    cancelRepositionMode() {
        try {
            console.log('❌ Modo reposición cancelado');
            
            this.isRepositionMode = false;
            this.selectedBlockIndex = null;
            this.validPositions = [];
            
            // Remover event listeners
            const gridContainer = document.getElementById('code-blocks-container');
            if (gridContainer) {
                if (this.ghostMouseMoveHandler) {
                    gridContainer.removeEventListener('mousemove', this.ghostMouseMoveHandler);
                    this.ghostMouseMoveHandler = null;
                }
                if (this.ghostClickHandler) {
                    gridContainer.removeEventListener('click', this.ghostClickHandler);
                    this.ghostClickHandler = null;
                }
            }
            
            // Remover cajas fantasmas
            const ghostBoxes = document.querySelectorAll('.ghost-box');
            ghostBoxes.forEach(el => {
                try {
                    el.remove();
                } catch (e) {
                    console.warn('Error removiendo ghost box:', e);
                }
            });
            
            // Remover clase de selección
            const selectedBlocks = document.querySelectorAll('.reposition-selected');
            selectedBlocks.forEach(el => {
                try {
                    el.classList.remove('reposition-selected');
                } catch (e) {
                    console.warn('Error removiendo clase:', e);
                }
            });
        } catch (error) {
            console.error('Error cancelando modo reposición:', error);
        }
    }
    
    /**
     * Activa el modo de expansión interactivo
     */
    activateExpandMode(wrapper, block, blockIndex) {
        try {
            console.log('🔍 Modo expansión activado para bloque:', blockIndex);
            
            // Marcar que estamos en modo expansión
            this.isExpandMode = true;
            this.expandingBlockIndex = blockIndex;
            this.expandingBlock = block;
            this.expandingWrapper = wrapper;
            
            // Marcar visualmente el bloque
            wrapper.classList.add('expand-mode-active');
            
            // Crear cajas fantasmas en las 4 direcciones
            this.createExpandGhosts(wrapper, block, blockIndex);
            
            this.notifications.success('🔍 Mueve el cursor a los lados para expandir');
            
            // Listener para cancelar con ESC o clic fuera
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.cancelExpandMode();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            // Cancelar al hacer clic fuera
            const clickOutsideHandler = (e) => {
                if (!e.target.closest('.expand-ghost') && !e.target.closest('.code-note-block')) {
                    this.cancelExpandMode();
                    document.removeEventListener('click', clickOutsideHandler);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', clickOutsideHandler);
            }, 100);
            
        } catch (error) {
            console.error('Error activando modo expansión:', error);
            this.cancelExpandMode();
        }
    }
    
    /**
     * Crea cajas fantasmas para expansión en las 4 direcciones
     */
    createExpandGhosts(wrapper, block, blockIndex) {
        const gridContainer = document.getElementById('code-blocks-container');
        if (!gridContainer) return;
        
        const currentCol = block.gridColumn || 1;
        const currentRow = block.gridRow || 1;
        const currentWidth = block.gridWidth || 1;
        const currentHeight = block.gridHeight || 1;
        
        // Función para verificar si hay colisión
        const wouldCollide = (col, row, width, height) => {
            if (col < 1 || row < 1 || col + width > 4 || row + height > 21) {
                return true;
            }
            
            return this.blocks.some((b, idx) => {
                if (idx === blockIndex) return false;
                
                const bCol = b.gridColumn || 1;
                const bRow = b.gridRow || 1;
                const bWidth = b.gridWidth || 1;
                const bHeight = b.gridHeight || 1;
                
                const horizontalOverlap = (col < bCol + bWidth) && (col + width > bCol);
                const verticalOverlap = (row < bRow + bHeight) && (row + height > bRow);
                
                return horizontalOverlap && verticalOverlap;
            });
        };
        
        // DERECHA: expandir hacia la derecha
        if (currentWidth < 3 && currentCol + currentWidth <= 3) {
            const newWidth = currentWidth + 1;
            if (!wouldCollide(currentCol, currentRow, newWidth, currentHeight)) {
                this.createSingleExpandGhost(gridContainer, currentCol, currentRow, newWidth, currentHeight, 'right', block, blockIndex);
            }
        }
        
        // IZQUIERDA: expandir hacia la izquierda
        if (currentWidth < 3 && currentCol > 1) {
            const newCol = currentCol - 1;
            const newWidth = currentWidth + 1;
            if (!wouldCollide(newCol, currentRow, newWidth, currentHeight)) {
                this.createSingleExpandGhost(gridContainer, newCol, currentRow, newWidth, currentHeight, 'left', block, blockIndex);
            }
        }
        
        // ABAJO: expandir hacia abajo
        if (currentHeight < 3) {
            const newHeight = currentHeight + 1;
            if (!wouldCollide(currentCol, currentRow, currentWidth, newHeight)) {
                this.createSingleExpandGhost(gridContainer, currentCol, currentRow, currentWidth, newHeight, 'down', block, blockIndex);
            }
        }
        
        // ARRIBA: expandir hacia arriba
        if (currentHeight < 3 && currentRow > 1) {
            const newRow = currentRow - 1;
            const newHeight = currentHeight + 1;
            if (!wouldCollide(currentCol, newRow, currentWidth, newHeight)) {
                this.createSingleExpandGhost(gridContainer, currentCol, newRow, currentWidth, newHeight, 'up', block, blockIndex);
            }
        }
    }
    
    /**
     * Crea una caja fantasma individual para expansión
     */
    createSingleExpandGhost(gridContainer, col, row, width, height, direction, block, blockIndex) {
        const ghost = document.createElement('div');
        ghost.className = 'expand-ghost';
        ghost.classList.add(`expand-ghost-${direction}`);
        ghost.classList.add(`grid-width-${width}`);
        ghost.classList.add(`grid-height-${height}`);
        
        ghost.style.gridColumn = `${col} / span ${width}`;
        ghost.style.gridRow = `${row} / span ${height}`;
        
        ghost.dataset.direction = direction;
        ghost.dataset.targetColumn = col;
        ghost.dataset.targetRow = row;
        ghost.dataset.targetWidth = width;
        ghost.dataset.targetHeight = height;
        
        // Icono según dirección
        const icons = {
            'right': '→',
            'left': '←',
            'up': '↑',
            'down': '↓'
        };
        
        ghost.innerHTML = `<div class="expand-ghost-icon">${icons[direction]}</div>`;
        
        // Click para expandir
        ghost.addEventListener('click', (e) => {
            e.stopPropagation();
            this.expandBlock(blockIndex, direction, col, row, width, height);
        });
        
        gridContainer.appendChild(ghost);
    }
    
    /**
     * Expande un bloque en la dirección especificada
     */
    expandBlock(blockIndex, direction, newCol, newRow, newWidth, newHeight) {
        try {
            console.log(`📦 Expandiendo bloque ${blockIndex} hacia ${direction}`);
            
            const block = this.blocks[blockIndex];
            
            // Actualizar dimensiones
            block.gridColumn = newCol;
            block.gridRow = newRow;
            block.gridWidth = newWidth;
            block.gridHeight = newHeight;
            
            // Cancelar modo expansión
            this.cancelExpandMode();
            
            // Re-renderizar
            this.renderBlocks();
            
            // Notificar
            if (this.onContentChange) {
                this.onContentChange();
            }
            
            this.notifications.success(`✅ Bloque expandido hacia ${direction}`);
        } catch (error) {
            console.error('Error expandiendo bloque:', error);
            this.cancelExpandMode();
        }
    }
    
    /**
     * Cancela el modo de expansión
     */
    cancelExpandMode() {
        try {
            console.log('❌ Modo expansión cancelado');
            
            this.isExpandMode = false;
            this.expandingBlockIndex = null;
            this.expandingBlock = null;
            this.expandingWrapper = null;
            
            // Remover cajas fantasmas
            document.querySelectorAll('.expand-ghost').forEach(el => el.remove());
            
            // Remover clase de selección
            document.querySelectorAll('.expand-mode-active').forEach(el => {
                el.classList.remove('expand-mode-active');
            });
        } catch (error) {
            console.error('Error cancelando modo expansión:', error);
        }
    }
    
    /**
     * Adjunta listeners al toolbar
     */
    attachToolbarListeners() {
        const addMarkdownBtn = this.container.querySelector('.btn-add-markdown');
        const addCodeBtn = this.container.querySelector('.btn-add-code');
        const addImageBtn = this.container.querySelector('.btn-add-image');
        const addMermaidBtn = this.container.querySelector('.btn-add-mermaid');
        const addYoutubeBtn = this.container.querySelector('.btn-add-youtube');
        const renderAllBtn = this.container.querySelector('.btn-render-all-diagrams');
        
        addMarkdownBtn?.addEventListener('click', () => this.addBlock('markdown'));
        addCodeBtn?.addEventListener('click', () => this.addBlock('code'));
        addImageBtn?.addEventListener('click', () => this.addBlock('image'));
        addMermaidBtn?.addEventListener('click', () => this.addBlock('mermaid'));
        addYoutubeBtn?.addEventListener('click', () => this.addBlock('youtube'));
        renderAllBtn?.addEventListener('click', () => this.renderAllDiagrams());
    }
    
    /**
     * Renderiza todos los diagramas Mermaid que no estén ya renderizados
     */
    async renderAllDiagrams() {
        console.log('🎨 Renderizando todos los diagramas...');
        
        const mermaidBlocks = this.blocks.filter(b => b.type === 'mermaid');
        
        if (mermaidBlocks.length === 0) {
            if (this.notifications) {
                this.notifications.info('No hay diagramas para renderizar');
            }
            console.log('⚠️ No hay bloques de tipo mermaid');
            return;
        }
        
        console.log(`📊 Encontrados ${mermaidBlocks.length} bloques Mermaid`);
        
        let rendered = 0;
        let skipped = 0;
        
        for (const block of mermaidBlocks) {
            console.log(`🔍 Procesando bloque ${block.id}, modo actual: ${block.mermaidViewMode}, tiene contenido: ${!!block.content}`);
            
            // Buscar el wrapper del bloque
            const wrapper = document.querySelector(`[data-block-id="${block.id}"]`);
            if (!wrapper) {
                console.warn(`⚠️ No se encontró wrapper para bloque ${block.id}`);
                continue;
            }
            
            const editorSection = wrapper.querySelector('.mermaid-editor-section');
            const previewSection = wrapper.querySelector('.mermaid-preview-section');
            const toggleBtn = wrapper.querySelector('.btn-mermaid-toggle');
            const diagramContainer = wrapper.querySelector(`#mermaid-${block.id}`);
            const errorDiv = wrapper.querySelector('.mermaid-error');
            
            if (!editorSection || !previewSection || !diagramContainer) {
                console.warn(`⚠️ Faltan elementos en bloque ${block.id}`);
                continue;
            }
            
            // Si ya está en preview y ya tiene contenido renderizado, skip
            if (block.mermaidViewMode === 'preview' && diagramContainer.innerHTML.trim() !== '') {
                console.log(`⏭️ Bloque ${block.id} ya está renderizado`);
                skipped++;
                continue;
            }
            
            // Cambiar a modo preview
            block.mermaidViewMode = 'preview';
            editorSection.classList.add('hidden');
            previewSection.classList.remove('hidden');
            
            // Actualizar botón
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'code-2');
                }
                toggleBtn.title = 'Editar código';
            }
            
            // Renderizar diagrama si tiene contenido
            if (block.content && block.content.trim()) {
                console.log(`🎨 Renderizando diagrama ${block.id}...`);
                await this.renderMermaidDiagram(block.content, diagramContainer, errorDiv);
                rendered++;
            } else {
                console.log(`⚠️ Bloque ${block.id} no tiene contenido`);
                diagramContainer.innerHTML = '<div style="color: #6a6a6a; text-align: center; padding: 40px;">No hay código para renderizar</div>';
            }
        }
        
        // Re-renderizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Guardar cambios
        if (this.onContentChange) {
            this.onContentChange();
        }
        
        const message = `${rendered} renderizado(s), ${skipped} ya estaban listos`;
        if (this.notifications) {
            this.notifications.success(message);
        }
        console.log(`✅ ${message}`);
    }
    
    /**
     * Adjunta listeners a un bloque
     */
    attachBlockListeners(wrapper, block, index) {
        const deleteBtn = wrapper.querySelector('.btn-delete-block');
        const copyBtn = wrapper.querySelector('.btn-copy-code');
        const langSelectorHidden = wrapper.querySelector('.language-selector-hidden');
        const langDisplay = wrapper.querySelector('.language-display');
        const markdownEditor = wrapper.querySelector('.markdown-editor');
        const imageInput = wrapper.querySelector('.image-upload-input');
        const imagePlaceholder = wrapper.querySelector('.image-placeholder');
        const blockImage = wrapper.querySelector('.block-image');
        
        // Sistema de Drag & Drop Profesional
        this.setupDragAndDrop(wrapper, block, index);
        
        // Sistema de Redimensionamiento
        this.setupResize(wrapper, block, index);
        
        // Eliminar bloque con confirmación
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteConfirmation(block, index);
            });
        }
        
        // Copiar código
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const editor = this.monacoEditors.get(block.id);
                if (editor) {
                    const code = editor.getValue();
                    navigator.clipboard.writeText(code).then(() => {
                        this.notifications.success('✅ Código copiado');
                    }).catch((error) => {
                        console.error('Error al copiar código:', error);
                    });
                }
            });
        }
        
        // Selector de lenguaje en esquina
        if (langDisplay && langSelectorHidden) {
            langDisplay.addEventListener('click', (e) => {
                e.stopPropagation();
                // Hacer el select visible temporalmente y abrirlo
                langSelectorHidden.style.opacity = '1';
                langSelectorHidden.style.pointerEvents = 'auto';
                langSelectorHidden.style.width = 'auto';
                langSelectorHidden.style.height = 'auto';
                langSelectorHidden.focus();
                
                // Simular clic para abrir el dropdown
                const event = new MouseEvent('mousedown', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                langSelectorHidden.dispatchEvent(event);
            });
            
            langSelectorHidden.addEventListener('change', (e) => {
                e.stopPropagation();
                const newLang = e.target.value;
                block.language = newLang;
                
                // Actualizar display
                langDisplay.textContent = this.getLanguageLabel(newLang);
                
                // Actualizar Monaco
                const editor = this.monacoEditors.get(block.id);
                if (editor) {
                    monaco.editor.setModelLanguage(editor.getModel(), newLang);
                }
                
                // Ocultar select de nuevo
                langSelectorHidden.style.opacity = '0';
                langSelectorHidden.style.pointerEvents = 'none';
                langSelectorHidden.style.width = '1px';
                langSelectorHidden.style.height = '1px';
                
                if (this.onContentChange) {
                    this.onContentChange();
                }
            });
            
            langSelectorHidden.addEventListener('blur', () => {
                // Ocultar select si pierde foco
                langSelectorHidden.style.opacity = '0';
                langSelectorHidden.style.pointerEvents = 'none';
                langSelectorHidden.style.width = '1px';
                langSelectorHidden.style.height = '1px';
            });
        }
        
        // Editor de texto
        if (markdownEditor) {
            markdownEditor.addEventListener('input', (e) => {
                block.content = e.target.value;
                if (this.onContentChange) {
                    this.onContentChange();
                }
            });
        }
        
        // Upload de imagen
        if (imagePlaceholder) {
            imagePlaceholder.addEventListener('click', () => {
                imageInput?.click();
            });
        }
        
        if (blockImage) {
            blockImage.addEventListener('click', () => {
                imageInput?.click();
            });
        }
        
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        block.imageUrl = event.target.result;
                        this.renderBlocks();
                        this.notifications.success('Imagen cargada');
                        if (this.onContentChange) {
                            this.onContentChange();
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // YouTube block listeners
        const youtubePlaceholder = wrapper.querySelector('.youtube-placeholder');
        const youtubeUrlInput = wrapper.querySelector('.youtube-url-input');
        
        if (youtubePlaceholder && !block.youtubeId) {
            youtubePlaceholder.addEventListener('click', () => {
                if (youtubeUrlInput) {
                    youtubeUrlInput.style.display = 'block';
                    youtubeUrlInput.focus();
                }
            });
        }
        
        if (youtubeUrlInput) {
            youtubeUrlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const url = e.target.value.trim();
                    if (url) {
                        // Extraer ID del video
                        let videoId = '';
                        if (url.includes('youtu.be/')) {
                            videoId = url.split('youtu.be/')[1].split('?')[0];
                        } else if (url.includes('youtube.com/watch?v=')) {
                            videoId = url.split('v=')[1].split('&')[0];
                        } else if (url.includes('youtube.com/embed/')) {
                            videoId = url.split('embed/')[1].split('?')[0];
                        }
                        
                        if (videoId) {
                            block.youtubeId = videoId;
                            this.renderBlocks();
                            this.notifications.success('✅ Video de YouTube agregado');
                            if (this.onContentChange) {
                                this.onContentChange();
                            }
                        } else {
                            this.notifications.error('URL de YouTube inválida');
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Agrega un nuevo bloque
     */
    addBlock(type) {
        // Encontrar la primera posición libre en el grid
        let foundPosition = false;
        let targetCol = 1;
        let targetRow = 1;
        const newBlockWidth = 1;
        const newBlockHeight = 1;
        
        for (let row = 1; row <= 50 && !foundPosition; row++) {
            for (let col = 1; col <= 3 && !foundPosition; col++) {
                // Verificar si esta posición está completamente libre
                const isOccupied = this.blocks.some(b => {
                    const bCol = b.gridColumn || 1;
                    const bRow = b.gridRow || 1;
                    const bWidth = b.gridWidth || 1;
                    const bHeight = b.gridHeight || 1;
                    
                    // Verificar si hay overlap entre el nuevo bloque y el bloque existente
                    const horizontalOverlap = (col < bCol + bWidth) && (col + newBlockWidth > bCol);
                    const verticalOverlap = (row < bRow + bHeight) && (row + newBlockHeight > bRow);
                    
                    return horizontalOverlap && verticalOverlap;
                });
                
                // Verificar que el bloque no se salga del grid (máximo 3 columnas)
                const fitsInGrid = (col + newBlockWidth) <= 4;
                
                if (!isOccupied && fitsInGrid) {
                    targetCol = col;
                    targetRow = row;
                    foundPosition = true;
                }
            }
        }
        
        const newBlock = {
            id: Date.now(),
            type,
            gridWidth: 1,
            gridHeight: 1,
            gridColumn: targetCol,
            gridRow: targetRow,
            content: type === 'markdown' ? '' : type === 'code' ? '// Escribe tu código aquí...' : type === 'mermaid' ? 'graph TD\n    A[Inicio] --> B[Proceso]\n    B --> C[Fin]' : '',
            language: type === 'code' ? 'javascript' : undefined,
            imageUrl: type === 'image' ? null : undefined,
            mermaidViewMode: type === 'mermaid' ? 'preview' : undefined
        };
        
        this.blocks.push(newBlock);
        this.renderBlocks();
        
        if (this.onContentChange) {
            this.onContentChange();
        }
    }
    
    /**
     * Mueve un bloque arriba o abajo
     */
    moveBlock(index, direction) {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex < 0 || newIndex >= this.blocks.length) return;
        
        [this.blocks[index], this.blocks[newIndex]] = [this.blocks[newIndex], this.blocks[index]];
        this.renderBlocks();
    }
    
    /**
     * Muestra confirmación antes de eliminar
     */
    showDeleteConfirmation(block, index) {
        const typeNames = {
            'markdown': 'texto',
            'code': 'código',
            'image': 'imagen',
            'mermaid': 'diagrama',
            'youtube': 'video de YouTube'
        };
        
        const typeName = typeNames[block.type] || 'bloque';
        
        // Crear modal de confirmación
        const modal = document.createElement('div');
        modal.className = 'delete-confirmation-modal';
        modal.innerHTML = `
            <div class="delete-confirmation-content">
                <div class="delete-confirmation-icon">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <h3>¿Eliminar ${typeName}?</h3>
                <p>Esta acción no se puede deshacer</p>
                <div class="delete-confirmation-buttons">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-confirm-delete">Eliminar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Renderizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Listeners
        const btnCancel = modal.querySelector('.btn-cancel');
        const btnConfirm = modal.querySelector('.btn-confirm-delete');
        
        btnCancel.addEventListener('click', () => {
            modal.remove();
        });
        
        btnConfirm.addEventListener('click', () => {
            modal.remove();
            this.deleteBlock(index);
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    /**
     * Elimina un bloque
     */
    deleteBlock(index) {
        if (index < 0 || index >= this.blocks.length) return;
        
        // Limpiar editor Monaco si existe
        const block = this.blocks[index];
        if (block.type === 'code' && this.monacoEditors.has(block.id)) {
            const editor = this.monacoEditors.get(block.id);
            editor.dispose();
            this.monacoEditors.delete(block.id);
        }
        
        this.blocks.splice(index, 1);
        this.renderBlocks();
        
        if (this.onContentChange) {
            this.onContentChange();
        }
    }
    
    /**
     * Obtiene el contenido serializado
     */
    getContent() {
        return JSON.stringify({ blocks: this.blocks });
    }
    
    /**
     * Destruye todos los editores Monaco
     */
    destroy() {
        this.monacoEditors.forEach(editor => editor.dispose());
        this.monacoEditors.clear();
    }
    
    /**
     * Inyecta estilos CSS
     */
    injectStyles() {
        if (document.getElementById('code-notes-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'code-notes-styles';
        style.textContent = `
            .code-notes-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: #0d1117;
                color: #c9d1d9;
            }
            
            .code-notes-toolbar {
                display: flex;
                gap: 0;
                background: #161b22;
                border-bottom: 1px solid #30363d;
                flex-shrink: 0;
                padding: 0 20px;
            }
            
            .code-notes-toolbar button {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 16px 28px;
                background: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                color: #969696;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .code-notes-toolbar button:hover {
                color: #ffffff;
                background: rgba(0, 122, 204, 0.1);
                border-bottom-color: #007acc;
            }
            
            .code-notes-toolbar button svg,
            .code-notes-toolbar button i {
                width: 20px;
                height: 20px;
            }
            
            /* GRID MODULAR - 3 columnas con filas fijas */
            .code-notes-grid {
                flex: 1;
                overflow-y: auto;
            }
            
            /* Grid de 3 columnas con posicionamiento manual */
            .code-notes-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-auto-rows: 220px;
                gap: 16px;
                padding: 20px;
                min-height: calc(100vh - 200px);
                overflow-y: auto;
                grid-auto-flow: dense;
            }
            
            /* Tamaños de bloques - Dark mode mejorado */
            .code-note-block {
                position: relative;
                border: 1px solid transparent;
                border-radius: 8px;
                background: #161b22;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
                overflow: hidden;
                cursor: move;
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .code-note-block:hover {
                border-color: #30363d;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
            }
            
            /* Ancho (columnas) */
            .code-note-block.grid-width-1 {
                grid-column: span 1;
            }
            
            .code-note-block.grid-width-2 {
                grid-column: span 2;
            }
{{ ... }}
            
            .code-note-block.grid-width-3 {
                grid-column: span 3;
            }
            
            /* Alto (filas) */
            .code-note-block.grid-height-1 {
                grid-row: span 1;
            }
            
            .code-note-block.grid-height-2 {
                grid-row: span 2;
            }
            
            .code-note-block.grid-height-3 {
                grid-row: span 3;
            }
            
            /* Efecto sutil al hover */
            .code-note-block:hover {
                border-color: #3d4451;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
                transform: translateY(-1px);
            }
            
            .code-note-block.ready-to-drag {
                cursor: grab;
                border-color: #007acc;
                box-shadow: 0 0 16px rgba(0, 122, 204, 0.5);
                animation: pulse-ready 1s ease-in-out infinite;
            }
            
            @keyframes pulse-ready {
                0%, 100% {
                    box-shadow: 0 0 16px rgba(0, 122, 204, 0.5);
                }
                50% {
                    box-shadow: 0 0 24px rgba(0, 122, 204, 0.7);
                }
            }
            
            .code-note-block.dragging {
                opacity: 0.4;
                transform: scale(0.95);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                cursor: grabbing;
            }
            
            .code-note-block.drag-over {
                border-color: #4caf50;
                box-shadow: 0 0 20px rgba(76, 175, 80, 0.6),
                            0 0 40px rgba(76, 175, 80, 0.4);
                transform: scale(1.02);
            }
            
            /* Área de doble clic - Solo visible al hover del bloque */
            .triple-click-area {
                position: absolute;
                bottom: 8px;
                left: 8px;
                width: 30px;
                height: 30px;
                z-index: 50;
                cursor: pointer;
                background: transparent;
                transition: all 0.2s;
                border-radius: 4px;
                opacity: 0;
            }
            
            .code-note-block:hover .triple-click-area {
                opacity: 1;
            }
            
            .triple-click-area::before {
                content: '⋮';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 14px;
                color: rgba(255, 255, 255, 0.3);
                transition: color 0.2s;
            }
            
            .triple-click-area:hover::before {
                color: rgba(255, 255, 255, 0.6);
            }
            
            /* Botones de redimensionamiento minimalistas */
            .resize-buttons {
                position: absolute;
                right: 4px;
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 100;
            }
            
            .code-note-block:hover .resize-buttons {
                opacity: 1;
            }
            
            .resize-btn {
                width: 16px;
                height: 16px;
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.3);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
                padding: 0;
                font-size: 10px;
                line-height: 1;
            }
            
            .resize-btn:hover {
                color: rgba(255, 255, 255, 0.8);
                transform: scale(1.2);
            }
            
            .resize-btn:active {
                color: rgba(255, 255, 255, 1);
                transform: scale(1);
            }
            
            /* Botón de expansión - Mismo tamaño que flechas */
            .resize-btn-expand {
                width: 16px;
                height: 16px;
                background: transparent;
                border: none;
                color: rgba(76, 175, 80, 0.5);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s;
                padding: 0;
                font-size: 12px;
                line-height: 1;
                margin-top: 4px;
            }
            
            .resize-btn-expand:hover {
                color: rgba(76, 175, 80, 0.9);
                transform: scale(1.3);
            }
            
            .resize-btn-expand:active {
                color: rgba(76, 175, 80, 1);
                transform: scale(1.1);
            }
            
            /* Bloque en modo expansión */
            .code-note-block.expand-mode-active {
                border-color: #4caf50;
                box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
                z-index: 999;
            }
            
            /* Cajas fantasmas de expansión */
            .expand-ghost {
                border: 2px dashed #4caf50;
                border-radius: 8px;
                background: rgba(76, 175, 80, 0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                animation: pulse-expand 2s ease-in-out infinite;
                backdrop-filter: blur(3px);
                position: relative;
            }
            
            .expand-ghost:hover {
                background: rgba(76, 175, 80, 0.3);
                border-color: #4caf50;
                border-width: 3px;
                transform: scale(1.02);
                animation: none;
            }
            
            .expand-ghost-icon {
                font-size: 32px;
                color: #4caf50;
                opacity: 0.7;
                transition: all 0.2s;
                pointer-events: none;
            }
            
            .expand-ghost:hover .expand-ghost-icon {
                opacity: 1;
                transform: scale(1.2);
            }
            
            @keyframes pulse-expand {
                0%, 100% {
                    border-color: rgba(76, 175, 80, 0.5);
                    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
                }
                50% {
                    border-color: rgba(76, 175, 80, 0.8);
                    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
                }
            }
            
            /* Tamaños para cajas fantasmas */
            .expand-ghost.grid-width-1 { grid-column: span 1; }
            .expand-ghost.grid-width-2 { grid-column: span 2; }
            .expand-ghost.grid-width-3 { grid-column: span 3; }
            .expand-ghost.grid-height-1 { grid-row: span 1; }
            .expand-ghost.grid-height-2 { grid-row: span 2; }
            .expand-ghost.grid-height-3 { grid-row: span 3; }
            
            /* Bloque seleccionado para reposición - Sutil */
            .code-note-block.reposition-selected {
                border-color: #007acc;
                opacity: 0.6;
                z-index: 1000;
            }
            
            /* Botones de copiar y eliminar - mismo color que flechas */
            .btn-copy-code,
            .btn-delete-block {
                color: rgba(255, 255, 255, 0.3);
            }
            
            .btn-copy-code:hover,
            .btn-delete-block:hover {
                color: rgba(255, 255, 255, 0.8);
            }
            
            .btn-copy-code i,
            .btn-delete-block i {
                width: 10px;
                height: 10px;
            }
            
            /* Contenido del bloque - SIN PADDING */
            .block-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 0;
                overflow: hidden;
                height: 100%;
                width: 100%;
                position: relative;
            }
            
            /* Editor de texto - TAMAÑO FIJO, SIN BORDES */
            .markdown-editor {
                width: 100%;
                height: 100%;
                padding: 12px;
                border: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
                font-size: 15px;
                line-height: 1.7;
                resize: none;
                outline: none;
                background: transparent;
                color: #e0e0e0;
                overflow-y: auto;
                overflow-x: hidden;
                box-sizing: border-box;
            }
            
            .markdown-editor::placeholder {
                color: #6a6a6a;
                font-style: italic;
            }
            
            .markdown-editor::-webkit-scrollbar {
                width: 8px;
            }
            
            .markdown-editor::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
            }
            
            .markdown-editor::-webkit-scrollbar-thumb {
                background: rgba(100, 116, 139, 0.4);
                border-radius: 4px;
            }
            
            .markdown-editor::-webkit-scrollbar-thumb:hover {
                background: rgba(100, 116, 139, 0.6);
            }
            
            /* Selector de lenguaje en esquina inferior derecha */
            .language-selector-corner {
                position: absolute;
                bottom: 8px;
                right: 8px;
                z-index: 50;
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            .code-note-block:hover .language-selector-corner {
                opacity: 1;
            }
            
            .language-display {
                display: inline-block;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: 600;
                color: #e0e0e0;
                background: rgba(0, 0, 0, 0.8);
                cursor: pointer;
                transition: all 0.2s;
                border-radius: 4px;
                user-select: none;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .language-display:hover {
                color: #ffffff;
                background: rgba(0, 0, 0, 0.95);
                border-color: #007acc;
            }
            
            .language-selector-hidden {
                position: absolute;
                bottom: 8px;
                right: 8px;
                opacity: 0;
                pointer-events: none;
                width: 1px;
                height: 1px;
                z-index: 100;
                font-size: 12px;
                padding: 4px 8px;
                background: rgba(30, 30, 30, 0.95);
                border: 1px solid #007acc;
                border-radius: 4px;
                color: #ffffff;
                transition: opacity 0.2s;
            }
            
            /* Monaco editor - TAMAÑO FIJO, SIN BORDES */
            .monaco-editor-container {
                border: none;
                width: 100%;
                height: 100%;
                flex: 1;
                overflow: hidden;
                box-sizing: border-box;
            }
            
            .monaco-editor-container .monaco-editor {
                border-radius: 0 !important;
            }
            
            .monaco-editor-container .monaco-editor .overflow-guard {
                border-radius: 0 !important;
            }
            
            /* Highlight de línea sutil - solo gutter */
            .monaco-editor .current-line {
                background: rgba(100, 116, 139, 0.15) !important;
                border: none !important;
            }
            
            .monaco-editor .margin-view-overlays .current-line {
                background: rgba(100, 116, 139, 0.2) !important;
                border: none !important;
            }
            
            /* Bloque de imagen - OCUPA TODO EL ESPACIO */
            .image-block {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.2);
            }
            
            .block-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            
            .image-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #6a6a6a;
                padding: 40px;
            }
            
            .image-placeholder i {
                opacity: 0.5;
            }
            
            /* Bloque YouTube */
            .youtube-block {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #0d1117;
            }
            
            .youtube-block iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
            
            .youtube-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #6a6a6a;
                padding: 40px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .youtube-placeholder:hover {
                color: #ff0000;
            }
            
            .youtube-placeholder i {
                opacity: 0.5;
                transition: all 0.2s ease;
            }
            
            .youtube-placeholder:hover i {
                opacity: 1;
                transform: scale(1.1);
            }
            
            .youtube-url-input {
                margin-top: 16px;
                padding: 8px 12px;
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 6px;
                color: #c9d1d9;
                font-size: 14px;
                width: 300px;
                max-width: 100%;
            }
            
            .youtube-url-input:focus {
                outline: none;
                border-color: #ff0000;
            }
            
            /* Bloque Mermaid */
            .mermaid-block {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: #0d1117;
                position: relative;
            }
            
            .mermaid-toggle-corner {
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 10;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                background: transparent;
                border: 1px solid transparent;
                color: #6e7681;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                opacity: 0;
                pointer-events: none;
            }
            
            .mermaid-block:hover .mermaid-toggle-corner {
                opacity: 1;
                pointer-events: auto;
            }
            
            .mermaid-toggle-corner:hover {
                background: #30363d;
                color: #c9d1d9;
                border-color: #484f58;
            }
            
            .mermaid-toggle-corner i {
                width: 16px;
                height: 16px;
            }
            
            .mermaid-content {
                flex: 1;
                display: flex;
                overflow: hidden;
                position: relative;
            }
            
            .mermaid-editor-section,
            .mermaid-preview-section {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
            }
            
            .mermaid-editor-section {
                display: flex;
                flex-direction: column;
            }
            
            .mermaid-editor {
                width: 100%;
                height: 100%;
                padding: 12px;
                background: #0d1117;
                color: #c9d1d9;
                border: none;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
                resize: none;
                outline: none;
            }
            
            .mermaid-editor::-webkit-scrollbar {
                width: 8px;
            }
            
            .mermaid-editor::-webkit-scrollbar-track {
                background: #0d1117;
            }
            
            .mermaid-editor::-webkit-scrollbar-thumb {
                background: #30363d;
                border-radius: 4px;
            }
            
            .mermaid-preview-section {
                display: flex;
                flex-direction: column;
                overflow: auto;
                background: #0d1117;
                padding: 20px;
            }
            
            .mermaid-diagram {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: auto;
            }
            
            .mermaid-diagram svg {
                max-width: 100%;
                max-height: 100%;
                height: auto !important;
                width: auto !important;
            }
            
            .mermaid-preview-section::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            
            .mermaid-preview-section::-webkit-scrollbar-track {
                background: #0d1117;
            }
            
            .mermaid-preview-section::-webkit-scrollbar-thumb {
                background: #30363d;
                border-radius: 5px;
            }
            
            .mermaid-preview-section::-webkit-scrollbar-thumb:hover {
                background: #484f58;
            }
            
            .mermaid-error {
                padding: 12px;
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.3);
                border-radius: 6px;
                color: #fca5a5;
                font-size: 12px;
                font-family: monospace;
            }
            
            .hidden {
                display: none !important;
            }
            
            /* Placeholder para drop - Respeta el grid y tamaño del bloque */
            .drop-placeholder {
                border: 3px dashed #007acc;
                border-radius: 12px;
                background: rgba(0, 122, 204, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse-border 1.5s ease-in-out infinite;
                backdrop-filter: blur(5px);
                position: relative;
                min-height: 220px;
            }
            
            .drop-placeholder.grid-width-1 { grid-column: span 1; }
            .drop-placeholder.grid-width-2 { grid-column: span 2; }
            .drop-placeholder.grid-width-3 { grid-column: span 3; }
            .drop-placeholder.grid-height-1 { grid-row: span 1; }
            .drop-placeholder.grid-height-2 { grid-row: span 2; }
            .drop-placeholder.grid-height-3 { grid-row: span 3; }
            
            .placeholder-text {
                color: #007acc;
                font-size: 16px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                text-shadow: 0 2px 8px rgba(0, 122, 204, 0.5);
                pointer-events: none;
            }
            
            @keyframes pulse-border {
                0%, 100% {
                    border-color: #007acc;
                    box-shadow: 0 0 20px rgba(0, 122, 204, 0.4),
                                inset 0 0 20px rgba(0, 122, 204, 0.2);
                }
                50% {
                    border-color: #4caf50;
                    box-shadow: 0 0 30px rgba(76, 175, 80, 0.6),
                                inset 0 0 30px rgba(76, 175, 80, 0.3);
                }
            }
            
            /* Caja fantasma que sigue al cursor - Gris simple */
            .ghost-box.following-ghost {
                border: 2px solid rgba(128, 128, 128, 0.5);
                border-radius: 12px;
                background: rgba(128, 128, 128, 0.3);
                cursor: pointer;
                transition: opacity 0.15s ease;
                position: relative;
                pointer-events: none;
            }
            
            .ghost-box.following-ghost:hover {
                background: rgba(128, 128, 128, 0.4);
                border-color: rgba(128, 128, 128, 0.7);
            }
            
            /* Modal de confirmación de eliminación */
            .delete-confirmation-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(2px);
            }
            
            .delete-confirmation-content {
                background: #161b22;
                border: 1px solid #30363d;
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                text-align: center;
            }
            
            .delete-confirmation-icon {
                width: 48px;
                height: 48px;
                margin: 0 auto 16px;
                background: rgba(248, 81, 73, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .delete-confirmation-icon i {
                width: 28px;
                height: 28px;
                color: #f85149;
            }
            
            .delete-confirmation-content h3 {
                color: #c9d1d9;
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 8px 0;
            }
            
            .delete-confirmation-content p {
                color: #8b949e;
                font-size: 14px;
                margin: 0 0 24px 0;
            }
            
            .delete-confirmation-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            
            .delete-confirmation-buttons button {
                padding: 10px 24px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }
            
            .btn-cancel {
                background: #21262d;
                color: #c9d1d9;
            }
            
            .btn-cancel:hover {
                background: #30363d;
            }
            
            .btn-confirm-delete {
                background: #f85149;
                color: white;
            }
            
            .btn-confirm-delete:hover {
                background: #da3633;
            }
            
            /* Scrollbar styling */
            .code-notes-grid::-webkit-scrollbar {
                width: 12px;
            }
            
            .code-notes-grid::-webkit-scrollbar-track {
                background: #1e1e1e;
            }
            
            .code-notes-grid::-webkit-scrollbar-thumb {
                background: #424242;
                border-radius: 6px;
            }
            
            .code-notes-grid::-webkit-scrollbar-thumb:hover {
                background: #4e4e4e;
            }
        `;
        
        document.head.appendChild(style);
    }
}

export default CodeNotesView;
