/**
 * Modal de chat con IA integrada
 */
class AIChatModal {
    /**
     * Constructor
     */
    constructor(dataManager, notifications) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        
        // Cache del índice para optimizar rendimiento
        this.indexCache = null;
        this.indexCacheKey = null;
        this.lastIndexUpdate = 0;
        this.indexCacheTimeout = 1000 * 60 * 5; // 5 minutos
        
        this.messages = [];
        this.isLoading = false;
        this.currentSubject = null;
        this.currentTopic = null;
        this.currentTopicId = null;
        
        // URLs de Supabase (configurar con tus credenciales)
        this.SUPABASE_URL = 'https://xsumibufekrmfcenyqgq.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdW1pYnVmZWtybWZjZW55cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTExOTIsImV4cCI6MjA3NTA2NzE5Mn0.x-vdT-84cEOj-5SDOVfDbgZMVVWczj8iVM0P_VoEkBc';
    }
    
    /**
     * Muestra el modal de chat
     */
    show(subject, topic) {
        // Detectar si cambió el tema
        const topicChanged = this.currentTopic?.id !== topic?.id;
        
        this.currentSubject = subject;
        this.currentTopic = topic;
        this.currentTopicId = subject.id; // ID de la materia donde están los recursos
        
        if (!this.modal) {
            this.createModal();
        }
        
        this.isVisible = true;
        this.modal.classList.remove('hidden');
        this.modal.style.display = 'flex';
        
        // SIEMPRE recargar índice si cambió el tema o no existe
        if (topicChanged || !this.indexCache) {
            this.indexCache = null; // Limpiar cache anterior
            this.indexCacheKey = null; // Forzar recreación con configuración original
            this.lastIndexUpdate = 0;
            this.loadIndex();
        }
        
        // Actualizar contexto en la UI
        this.updateContextInfo();
        
        // Focus en el input
        setTimeout(() => {
            if (input) input.focus();
        }, 100);
    }
    
    /**
     * Limpia el chat
     */
    clearChat() {
        this.messages = [];
        this.renderMessages();
        this.hideThinkingIndicator(); // Limpiar indicadores de pensamiento
        this.notifications.success('Chat limpiado');
    }
    
    /**
     * Toggle de visibilidad
     */
    toggle(subject, topic) {
        if (!subject || !topic) {
            this.notifications.error('No hay tema seleccionado');
            return;
        }
        
        if (this.isVisible) {
            this.hide();
        } else {
            this.show(subject, topic);
        }
    }
    
    /**
     * Crea el modal en el DOM
     */
    createModal() {
        const modalHTML = `
        <div id="ai-chat-modal" class="fixed inset-0 z-50 hidden flex-col bg-slate-800 shadow-2xl" style="width: 70vw; margin: 0 auto; left: 15vw; right: 15vw;">
                <!-- Header compacto -->
                <div class="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900">
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <i data-lucide="graduation-cap" class="w-5 h-5 text-slate-400"></i>
                            <h2 class="text-base font-semibold text-slate-200">Profesor</h2>
                        </div>
                        
                        <!-- Contexto -->
                        <div class="flex items-center gap-2 text-xs text-slate-400">
                            <i data-lucide="book-open" class="w-3 h-3"></i>
                            <span id="ai-context-info">Cargando...</span>
                        </div>
                        
                        <!-- Opciones de búsqueda -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-slate-500">|</span>
                            <label class="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" id="ai-include-notes-toggle" class="w-3 h-3 rounded border-slate-600 bg-slate-800 text-purple-600" checked>
                                <span class="text-xs text-slate-400">Apuntes</span>
                            </label>
                            <label class="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" id="ai-include-resources-toggle" class="w-3 h-3 rounded border-slate-600 bg-slate-800 text-purple-600" checked>
                                <span class="text-xs text-slate-400">Recursos</span>
                            </label>
                            <label class="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" id="ai-include-web-toggle" class="w-3 h-3 rounded border-slate-600 bg-slate-800 text-purple-600">
                                <span class="text-xs text-slate-400">Web</span>
                            </label>
                        </div>
                        
                        <!-- Estado -->
                        <div id="ai-index-status" class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-500" id="ai-status-icon"></span>
                            <span class="text-xs text-slate-400" id="ai-status-text">Listo</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-1">
                        <button id="ai-clear-chat-btn" class="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Borrar">
                            <i data-lucide="trash-2" class="w-4 h-4 text-slate-400"></i>
                        </button>
                        <button id="ai-close-btn" class="p-1.5 hover:bg-slate-700 rounded transition-colors">
                            <i data-lucide="x" class="w-4 h-4 text-slate-400"></i>
                        </button>
                    </div>
                </div>
            
            <!-- Mensajes -->
            <div id="ai-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3">
                <div class="text-center text-sm text-slate-400 py-8">
                    <i data-lucide="message-circle" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>Hazme preguntas sobre tus apuntes y recursos</p>
                </div>
            </div>
            
            <!-- Input area -->
            <div class="p-3 border-t border-slate-700 bg-slate-900/50">
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        id="ai-chat-input" 
                        placeholder="Pregunta sobre este tema..." 
                        class="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder-slate-500"
                    >
                    <button 
                        id="ai-chat-send-btn" 
                        class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </div>
                
            </div>
        </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHTML;
        this.modal = tempDiv.firstElementChild;
        
        document.body.appendChild(this.modal);
        this.attachEventListeners();
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Adjunta event listeners al modal
     */
    attachEventListeners() {
        const closeBtn = this.modal.querySelector('#ai-close-btn');
        const clearBtn = this.modal.querySelector('#ai-clear-chat-btn');
        const sendBtn = this.modal.querySelector('#ai-chat-send-btn');
        const input = this.modal.querySelector('#ai-chat-input');
        
        closeBtn?.addEventListener('click', () => this.hide());
        clearBtn?.addEventListener('click', () => this.clearChat());
        sendBtn?.addEventListener('click', () => this.sendMessage());
        
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    /**
     * Carga el índice JSON del tema actual
     */
    async loadIndex() {
        if (!this.currentSubject || !this.currentTopic) {
            this.updateIndexStatus('❌ No hay tema seleccionado', 'error');
            return;
        }
        
        const subjectSlug = this.normalizeSlug(this.currentSubject.name);
        const topicSlug = this.normalizeSlug(this.currentTopic.name);
        
        console.log('[DEBUG] Cargando índice para:', subjectSlug, '/', topicSlug);
        
        this.updateIndexStatus('⏳ Cargando índice...', 'info');
        
        try {
            // Intentar cargar desde Supabase Storage primero
            const storageUrl = `${this.SUPABASE_URL}/storage/v1/object/public/ai-indices/indices/${subjectSlug}/${topicSlug}.json`;
            
            let response = await fetch(storageUrl);
            
            // Si no existe en Storage, intentar desde Vercel (índices estáticos)
            if (!response.ok) {
                const vercelUrl = `/indices/${subjectSlug}/${topicSlug}.json`;
                response = await fetch(vercelUrl);
            }
            
            if (!response.ok) {
                // Si no hay índices remotos, crear uno local simulado con los recursos disponibles
                console.log('[DEBUG] No se encontró índice remoto, creando simulación local');
                await this.createLocalIndex();
                return;
            }
            
            const index = await response.json();
            
            if (!Array.isArray(index) || index.length === 0) {
                throw new Error('Índice vacío o inválido');
            }
            
            console.log('[DEBUG] Índice cargado:', index.length, 'chunks');
            console.log('[DEBUG] Primer chunk del índice:', index[0]?.sourceName);
            
            // Filtrar chunks solo de recursos indexados
            const filteredIndex = this.filterIndexedChunks(index);
            
            this.indexCache = filteredIndex;
            this.updateIndexStatus(filteredIndex.length, 'success');
            this.updateContextInfo();
            
        } catch (error) {
            console.error('[DEBUG] Error cargando índice:', error);
            this.indexCache = null;
            this.updateIndexStatus('⚠️ Sin índice - usando solo apuntes', 'warning');
            this.updateContextInfo();
        }
    }
    
    /**
     * Crea un índice local simulado con los recursos disponibles (para demo sin backend)
     */
    async createLocalIndex() {
        console.log('[DEBUG] Creando índice local simulado...');
        
        // Obtener recursos indexados de la materia actual
        const topicResources = window.app.dataManager.data.resources[this.currentTopicId] || [];
        const indexedResources = topicResources.filter(r => r.indexed !== false);
        
        // Crear clave del caché basada en el estado de indexación
        const cacheKey = `${this.currentSubject.id}-${this.currentTopic.id}-${indexedResources.map(r => `${r.id}-${r.indexed}`).sort().join('-')}`;
        
        // Verificar si ya tenemos un caché válido
        if (this.indexCache && this.indexCacheKey === cacheKey && 
            (Date.now() - this.lastIndexUpdate) < this.indexCacheTimeout) {
            console.log('[DEBUG] Usando índice del caché - válido por', Math.round((this.indexCacheTimeout - (Date.now() - this.lastIndexUpdate)) / 1000), 'segundos');
            return;
        }
        
        console.log('[DEBUG] Recursos indexados encontrados:', indexedResources.length);
        
        if (indexedResources.length === 0) {
            console.log('[DEBUG] No hay recursos indexados, no se puede crear índice local');
            this.indexCache = null;
            this.updateIndexStatus('⚠️ Sin recursos indexados', 'warning');
            this.updateContextInfo();
            return;
        }
        
        // Crear chunks simulados de los recursos
        const chunks = [];
        
        for (const resource of indexedResources) {
            try {
                // Decodificar el contenido base64
                const base64Data = resource.data.split(',')[1];
                const text = atob(base64Data);
                
                // Solo procesar archivos de texto
                if (resource.type === 'text' || resource.mimeType === 'text/plain') {
                    // Dividir el texto en chunks de ~500 caracteres
                    const chunkSize = 500;
                    const words = text.split(/\s+/);
                    
                    for (let i = 0; i < words.length; i += Math.floor(chunkSize / 6)) { // ~6 chars por palabra promedio
                        const chunkWords = words.slice(i, i + Math.floor(chunkSize / 6));
                        const chunkText = chunkWords.join(' ');
                        
                        if (chunkText.trim().length > 50) { // Solo chunks con contenido significativo
                            chunks.push({
                                text: chunkText,
                                sourceName: resource.name,
                                sourceUrl: null,
                                embedding: await this.getQueryEmbedding(chunkText), // Simulado - esperar el Promise
                                topicSlug: this.normalizeSlug(this.currentTopic.name)
                            });
                        }
                    }
                    
                    console.log(`[DEBUG] Procesado ${resource.name}: ${Math.ceil(words.length / Math.floor(chunkSize / 6))} chunks`);
                }
            } catch (error) {
                console.warn(`[DEBUG] Error procesando recurso ${resource.name}:`, error);
            }
        }
        
        console.log(`[DEBUG] Índice local creado con ${chunks.length} chunks totales`);
        
        if (chunks.length === 0) {
            this.indexCache = null;
            this.updateIndexStatus('⚠️ No se pudieron procesar recursos', 'warning');
        } else {
            this.indexCache = chunks;
            this.indexCacheKey = cacheKey;
            this.lastIndexUpdate = Date.now();
            this.updateIndexStatus(chunks.length, 'success');
            console.log(`[DEBUG] Índice guardado en caché con clave: ${cacheKey}`);
        }
        
        this.updateContextInfo();
    }
    /**
     * Invalida el caché del índice cuando cambie el estado de indexación
     */
    invalidateIndexCache() {
        console.log('[DEBUG] Invalidando caché del índice por cambio en indexación');
        this.indexCache = null;
        this.indexCacheKey = null;
        this.lastIndexUpdate = 0;
    }
    /**
     * Filtra chunks del índice para incluir solo recursos indexados
     */
    filterIndexedChunks(index) {
        if (!this.currentTopicId || !window.app?.dataManager?.data?.resources) {
            console.log('[DEBUG] No hay datos para filtrar indexación');
            return index;
        }
        
        const topicResources = window.app.dataManager.data.resources[this.currentTopicId] || [];
        const indexedResourceNames = new Set();
        
        // Crear set de nombres de recursos indexados
        topicResources.forEach(resource => {
            if (resource.indexed !== false) { // Por defecto true si no está definido
                const fileName = resource.name.toLowerCase().replace(/\.[^/.]+$/, ''); // Sin extensión
                indexedResourceNames.add(fileName);
            }
        });
        
        console.log('[DEBUG] Recursos indexados encontrados:', indexedResourceNames.size);
        
        // Filtrar chunks que pertenezcan a recursos indexados
        const filteredIndex = index.filter(chunk => {
            if (!chunk.sourceName) return true; // Mantener chunks sin nombre de fuente
            
            const chunkFileName = chunk.sourceName.toLowerCase().replace(/\.[^/.]+$/, '');
            const isIndexed = indexedResourceNames.has(chunkFileName);
            
            if (!isIndexed) {
                console.log('[DEBUG] Excluyendo chunk de recurso no indexado:', chunk.sourceName);
            }
            
            return isIndexed;
        });
        
        console.log('[DEBUG] Chunks después de filtrar indexación:', filteredIndex.length, 'de', index.length);
        return filteredIndex;
    }
    
    /**
     * Actualiza el estado del índice en la UI
     */
    updateIndexStatus(fragmentCount, type = 'info') {
        const iconEl = this.modal?.querySelector('#ai-status-icon');
        const textEl = this.modal?.querySelector('#ai-status-text');
        
        if (!iconEl || !textEl) return;
        
        if (type === 'success' && typeof fragmentCount === 'number') {
            // Mostrar "Recursos" con círculo verde y tooltip
            iconEl.className = 'w-2 h-2 rounded-full bg-green-500';
            iconEl.classList.remove('hidden');
            iconEl.title = `${fragmentCount} fragmentos cargados`;
            textEl.textContent = 'Recursos';
            textEl.className = 'text-xs text-slate-400';
        } else if (type === 'warning') {
            // Sin recursos
            iconEl.className = 'w-2 h-2 rounded-full bg-yellow-500';
            iconEl.classList.remove('hidden');
            iconEl.title = 'Sin índice cargado';
            textEl.textContent = 'Solo apuntes';
            textEl.className = 'text-xs text-slate-400';
        } else if (type === 'error') {
            iconEl.className = 'w-2 h-2 rounded-full bg-red-500';
            iconEl.classList.remove('hidden');
            iconEl.title = 'Error cargando recursos';
            textEl.textContent = 'Sin recursos';
            textEl.className = 'text-xs text-slate-400';
        } else {
            // Cargando
            iconEl.classList.add('hidden');
            textEl.textContent = typeof fragmentCount === 'string' ? fragmentCount : 'Cargando...';
            textEl.className = 'text-xs text-slate-500';
        }
    }
    
    /**
     * Actualiza la información de contexto
     */
    updateContextInfo() {
        const contextEl = this.modal?.querySelector('#ai-context-info');
        if (contextEl && this.currentSubject && this.currentTopic) {
            const hasIndex = this.indexCache && this.indexCache.length > 0;
            contextEl.textContent = `${this.currentSubject.name} › ${this.currentTopic.name} ${hasIndex ? '(con recursos)' : ''}`;
        }
    }
    
    /**
     * Envía un mensaje
     */
    async sendMessage() {
        const input = this.modal.querySelector('#ai-chat-input');
        const query = input?.value.trim();

        if (!query || this.isLoading) return;

        // Limpiar input
        input.value = '';

        // Añadir mensaje del usuario con indicador de "pensando"
        this.addMessage('user', query);
        
        // Agregar indicador visual de "pensando" junto al mensaje del usuario
        this.showThinkingIndicator();

        // Marcar como cargando
        this.isLoading = true;
        this.updateSendButton(true);

        try {
            // Obtener respuesta de IA
            const response = await this.getAIResponse(query);

            // Añadir respuesta
            this.addMessage('assistant', response.answer, response.sources);
            
        } catch (error) {
            console.error('Error obteniendo respuesta:', error);
            this.addMessage('error', error.message);
            this.notifications.error('Error al consultar IA');
        } finally {
            this.isLoading = false;
            this.updateSendButton(false);
            
            // Ocultar indicador de pensamiento
            this.hideThinkingIndicator();
        }
    }
    
    /**
     * Obtiene respuesta de la IA
     */
    async getAIResponse(query) {
        // 1. Verificar qué fuentes están habilitadas
        const includeNotes = this.modal.querySelector('#ai-include-notes-toggle')?.checked;
        const includeResources = this.modal.querySelector('#ai-include-resources-toggle')?.checked;
        const includeWeb = this.modal.querySelector('#ai-include-web-toggle')?.checked;
        
        // 2. Obtener apuntes del editor si está activado
        let editorContext = '';
        if (includeNotes) {
            // Intentar múltiples selectores para encontrar el editor
            const editorSelectors = [
                '#text-editor',
                '[contenteditable="true"]',
                '.editor-content',
                '.ProseMirror'
            ];

            let editor = null;
            for (const selector of editorSelectors) {
                editor = document.querySelector(selector);
                if (editor) break;
            }

            if (editor) {
                // Obtener el texto de diferentes formas
                editorContext = editor.innerText || editor.textContent || '';

                // Si aún está vacío, intentar otros métodos
                if (!editorContext.trim()) {
                    // Para editores tipo ProseMirror o Quill
                    const textNodes = editor.querySelectorAll('p, div, span, h1, h2, h3, li');
                    editorContext = Array.from(textNodes)
                        .map(node => node.textContent || '')
                        .join(' ')
                        .trim();
                }

                console.log('[DEBUG] Editor encontrado, contenido:', editorContext.substring(0, 200));

                // Limitar a 3000 caracteres para no saturar
                if (editorContext.length > 3000) {
                    editorContext = editorContext.substring(0, 3000) + '...';
                }
            } else {
                console.warn('[DEBUG] No se encontró ningún elemento de editor');
            }
        }
        
        // 3. Si hay índice y recursos está habilitado, buscar chunks relevantes
        // FILTRAR SOLO RECURSOS DEL TEMA ACTUAL
        let topChunks = [];
        if (includeResources && this.indexCache && this.indexCache.length > 0) {
            // Verificar si el índice tiene información de temas
            const hasTopicInfo = this.indexCache.some(chunk => chunk.topicSlug);

            if (hasTopicInfo) {
                // Filtrar por tema actual si el índice tiene información de temas
                const currentTopicSlug = this.normalizeSlug(this.currentTopic.name);
                const filteredChunks = this.indexCache.filter(chunk => {
                    return chunk.topicSlug === currentTopicSlug;
                });

            // console.log('[DEBUG] Índice tiene info de temas - filtrando:', filteredChunks.length, 'chunks para tema', currentTopicSlug);

                if (filteredChunks.length > 0) {
                    topChunks = await this.findRelevantChunksInArray(query, filteredChunks, 5);
                }
            } else {
                // Índice antiguo sin info de temas - usar todos (riesgo de mezclar temas)
                console.log('[DEBUG] Índice antiguo sin info de temas - usando todos los chunks');
                topChunks = await this.findRelevantChunksInArray(query, this.indexCache, 5);
            }

            console.log('[DEBUG] Chunks finales encontrados:', topChunks.length);
            if (topChunks.length > 0) {
                console.log('[DEBUG] Primer chunk:', topChunks[0].sourceName);
            }
        }
        
        // 4. Validar que al menos una fuente esté habilitada
        if (!includeNotes && !includeResources && !includeWeb) {
            throw new Error('💭 Selecciona al menos una fuente para buscar');
        }
        
        // 5. Verificar si las fuentes habilitadas tienen contenido disponible
        if (!includeWeb) {
            let hasContent = false;
            let missingSources = [];
            
            // Verificar recursos si están habilitados
            if (includeResources) {
                if (topChunks.length === 0) {
                    // Verificar si hay recursos indexados disponibles
                    const topicResources = window.app.dataManager.data.resources[this.currentTopicId] || [];
                    const indexedResources = topicResources.filter(r => r.indexed !== false);
                    if (indexedResources.length === 0) {
                        missingSources.push('recursos indexados');
                    } else {
                        missingSources.push('contenido relevante');
                    }
                } else {
                    hasContent = true;
                }
            }
            
            // Verificar apuntes si están habilitados
            if (includeNotes) {
                if (!editorContext || editorContext.trim().length === 0) {
                    missingSources.push('apuntes en el editor');
                } else {
                    hasContent = true;
                }
            }
            
            // Si no hay contenido disponible, mostrar mensaje específico
            if (!hasContent && missingSources.length > 0) {
                if (missingSources.length === 1) {
                    throw new Error(`😔 No hay ${missingSources[0]} disponibles`);
                } else {
                    throw new Error(`😔 No hay ${missingSources.join(' ni ')} disponibles`);
                }
            }
        }
        
        // 6. Llamar a Edge Function (o fallback local si no está configurada)
        if (this.SUPABASE_URL.includes('your-project')) {
            // Modo demo sin backend - generar respuesta simulada
            return this.getDemoResponse(query, topChunks, editorContext);
        }
        
        // Llamada real a Supabase Edge Function
        const response = await fetch(`${this.SUPABASE_URL}/functions/v1/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                subjectId: this.currentSubject.id,
                topicId: this.currentTopic.id,
                query,
                topChunks: topChunks.map(c => ({
                    text: c.text,
                    source: c.sourceName,
                    url: c.sourceUrl
                })),
                extraContext: editorContext,
                allowWeb: includeWeb
            })
        });
        
        if (!response.ok) {
            throw new Error(`🤖 Problema técnico, intenta de nuevo en unos momentos`);
        }
        
        return await response.json();
    }
    
    /**
     * Encuentra chunks relevantes usando similitud coseno (versión que recibe array)
     */
    async findRelevantChunksInArray(query, chunksArray, topK = 5) {
        if (!chunksArray || chunksArray.length === 0) {
            return [];
        }

        // 1. Obtener embedding del query (simulado - en producción llamar a OpenAI)
        const queryEmbedding = await this.getQueryEmbedding(query);

        // 2. Calcular similitud con cada chunk
        const similarities = chunksArray.map(chunk => ({
            ...chunk,
            similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
        }));

        // 3. Ordenar y tomar top K
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, topK);
    }
    
    /**
     * Obtiene embedding del query
     * NOTA: En producción, esto debería llamar a OpenAI text-embedding-3-small
     * Por ahora, usamos un embedding simulado basado en palabras clave
     */
    async getQueryEmbedding(query) {
        // TODO: En producción, llamar a OpenAI:
        // const response = await fetch('https://api.openai.com/v1/embeddings', {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${OPENAI_API_KEY}`,
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         model: 'text-embedding-3-small',
        //         input: query
        //     })
        // });
        // return (await response.json()).data[0].embedding;
        
        // Embedding simulado (1536 dimensiones como text-embedding-3-small)
        // En demo, usamos un vector aleatorio normalizado
        const dim = 1536;
        const vec = new Array(dim).fill(0).map(() => Math.random() - 0.5);
        return this.normalizeVector(vec);
    }
    
    /**
     * Calcula similitud coseno entre dos vectores
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            return 0;
        }
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    /**
     * Normaliza un vector
     */
    normalizeVector(vec) {
        const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
        return vec.map(val => val / norm);
    }
    
    /**
     * Genera una respuesta demo (sin backend configurado)
     */
    getDemoResponse(query, topChunks, editorContext) {
        const sources = topChunks.map((chunk, idx) => ({
            id: `chunk-${idx}`,
            name: chunk.sourceName || 'Recurso',
            snippet: chunk.text.substring(0, 100) + '...',
            url: chunk.sourceUrl
        }));
        
        return {
            answer: `**Modo Demo** - Pregunta recibida: "${query}"\n\n` +
                    `📚 Encontré ${topChunks.length} fragmentos relevantes en tus recursos.\n` +
                    `📝 Apuntes del editor: ${editorContext ? 'incluidos' : 'no incluidos'}.\n\n` +
                    `Para obtener respuestas reales, configura la Edge Function de Supabase con tu API Key de OpenAI.\n\n` +
                    `**Próximos pasos:**\n` +
                    `1. Configura SUPABASE_URL y SUPABASE_ANON_KEY en AIChatModal.js\n` +
                    `2. Despliega la Edge Function 'ask' en Supabase\n` +
                    `3. Genera índices JSON con el script de ingesta`,
            sources
        };
    }
    
    /**
     * Añade un mensaje al chat
     */
    addMessage(role, content, sources = []) {
        const message = { role, content, sources, timestamp: Date.now() };
        this.messages.push(message);
        
        // Si es respuesta del asistente, usar efecto de escritura
        if (role === 'assistant') {
            this.renderMessagesWithTypingEffect(message);
        } else {
            this.renderMessages();
        }
    }
    
    /**
     * Renderiza mensajes con efecto de escritura para el último mensaje del asistente
     */
    async renderMessagesWithTypingEffect(lastMessage) {
        const container = this.modal.querySelector('#ai-chat-messages');
        if (!container) return;
        
        // Renderizar todos los mensajes excepto el último
        const previousMessages = this.messages.slice(0, -1);
        container.innerHTML = previousMessages.map(msg => this.formatMessage(msg)).join('');
        
        // Crear elemento para el mensaje que se está escribiendo
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = `
            <div class="text-slate-100 px-1 py-2 max-w-[85%] text-sm">
                <div class="typing-content"></div>
                <span class="typing-cursor">|</span>
            </div>
        `;
        container.appendChild(typingDiv);
        
        const typingContent = typingDiv.querySelector('.typing-content');
        const typingCursor = typingDiv.querySelector('.typing-cursor');
        
        // Animar cursor parpadeante
        typingCursor.style.animation = 'blink 0.7s infinite';
        
        // Efecto de escritura más rápido (varias palabras a la vez)
        const text = lastMessage.content;
        const words = text.split(' ');
        let currentWordIndex = 0;
        const wordsPerIteration = 3; // Mostrar 3 palabras por vez
        const typingSpeed = 15; // ms por iteración (más rápido)

        const typeNextBatch = () => {
            if (currentWordIndex < words.length) {
                // Agregar múltiples palabras por iteración
                const nextIndex = Math.min(currentWordIndex + wordsPerIteration, words.length);
                const displayText = words.slice(0, nextIndex).join(' ');
                typingContent.innerHTML = this.formatMarkdown(displayText);
                currentWordIndex = nextIndex;
                container.scrollTop = container.scrollHeight;
                setTimeout(typeNextBatch, typingSpeed);
            } else {
                // Escritura completada - remover cursor y renderizar mensaje completo con fuentes
                typingCursor.remove();
                typingDiv.innerHTML = this.formatMessage(lastMessage);

                // Actualizar iconos
                if (window.lucide) window.lucide.createIcons();

                // Agregar event listeners para botones de copiar
                this.attachCopyCodeListeners(container);
            }
        };

        typeNextBatch();
    }
    
    /**
     * Formatea un mensaje individual
     */
    formatMessage(msg) {
        if (msg.role === 'user') {
            return `
                <div class="flex justify-end items-center">
                    <div class="bg-slate-700 text-slate-100 px-4 py-2.5 rounded-2xl max-w-[85%] text-sm">
                        ${this.escapeHtml(msg.content)}
                    </div>
                </div>
            `;
        } else if (msg.role === 'error') {
            return `
                <div class="flex justify-start items-center">
                    <div class="bg-amber-50/30 text-amber-800 px-4 py-2 rounded-lg max-w-[85%] text-sm border border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
                        ${this.escapeHtml(msg.content)}
                    </div>
                </div>
            `;
        } else {
            // Assistant message
            const sourcesHtml = msg.sources && msg.sources.length > 0 ? `
                <div class="mt-2 pt-2 border-t border-slate-600">
                    <p class="text-xs text-slate-400 mb-1">Fuentes:</p>
                    <div class="flex flex-wrap gap-1">
                        ${msg.sources.map(source => `
                            <span class="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300" title="${this.escapeHtml(source.snippet || '')}">
                                📄 ${this.escapeHtml(source.name)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : '';

            return `
                <div class="flex justify-start items-center">
                    <div class="text-slate-100 px-1 py-2 max-w-[85%] text-sm">
                        ${this.formatMarkdown(msg.content)}
                        ${sourcesHtml}
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Renderiza los mensajes
     */
    renderMessages() {
        const container = this.modal.querySelector('#ai-chat-messages');
        if (!container) return;
        
        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="text-center text-sm text-slate-400 py-8">
                    <i data-lucide="message-circle" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>Hazme preguntas sobre tus apuntes y recursos</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        
        container.innerHTML = this.messages.map(msg => this.formatMessage(msg)).join('');
        
        // Scroll al final
        container.scrollTop = container.scrollHeight;
        
        // Actualizar iconos
        if (window.lucide) window.lucide.createIcons();
        
        // Event listeners para botones de copiar código
        this.attachCopyCodeListeners(container);
    }
    
    /**
     * Adjunta event listeners para botones de copiar código
     */
    attachCopyCodeListeners(container) {
        container.querySelectorAll('.copy-code-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const code = btn.dataset.code;
                const originalText = btn.textContent;
                
                navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = '✓ Copiado';
                    btn.style.color = '#10b981'; // Verde
                    
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.color = ''; // Restaurar color original
                    }, 2000);
                }).catch(err => {
                    console.error('Error al copiar:', err);
                    btn.textContent = '✗ Error';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 2000);
                });
            });
        });
    }
    
    /**
     * Formatea texto con markdown básico
     */
    formatMarkdown(text) {
        // Procesar bloques de código primero
        let parts = [];
        let lastIndex = 0;
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        
        while ((match = codeRegex.exec(text)) !== null) {
            // Agregar texto antes del código
            if (match.index > lastIndex) {
                const textBefore = text.substring(lastIndex, match.index);
                parts.push({ type: 'text', content: textBefore });
            }
            
            // Agregar bloque de código
            const language = match[1] || 'plaintext';
            const code = match[2].trim();
            
            parts.push({ 
                type: 'code',
                language: language,
                code: code
            });
            
            lastIndex = match.index + match[0].length;
        }
        
        // Agregar texto restante
        if (lastIndex < text.length) {
            parts.push({ type: 'text', content: text.substring(lastIndex) });
        }
        
        // Procesar cada parte
        let html = '';
        parts.forEach((part, index) => {
            if (part.type === 'code') {
                // Generar bloque de código con highlight.js y botón copiar
                const codeId = 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                html += `<div class="my-3 relative rounded-lg" style="background-color: #1e1e1e;">
                    <div class="flex items-center justify-between px-3 pt-2 pb-1">
                        <span class="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full" style="background-color: #0078d4; color: #ffffff;">${part.language}</span>
                        <button class="copy-code-btn px-2.5 py-0.5 text-xs text-slate-400 hover:text-white transition-colors rounded" data-code="${this.escapeHtml(part.code)}" title="Copiar código">
                            Copiar
                        </button>
                    </div>
                    <pre class="px-4 pb-3" style="margin: 0; overflow-x: auto;"><code id="${codeId}" class="language-${part.language} text-sm" style="line-height: 1.5;">${this.escapeHtml(part.code)}</code></pre>
                </div>`;
                
                // Aplicar highlight.js de forma asíncrona
                setTimeout(() => {
                    const block = document.getElementById(codeId);
                    if (block && window.hljs) {
                        window.hljs.highlightElement(block);
                    }
                }, 10);
            } else {
                // Texto normal: escapar y aplicar markdown
                let textHtml = this.escapeHtml(part.content);
                
                // Limpiar saltos de línea al inicio y final
                textHtml = textHtml.trim();
                
                // Si está vacío, no agregar nada
                if (!textHtml) return;
                
                // Separadores horizontales (---) - El AI los genera
                textHtml = textHtml.replace(/^---$/gm, '<hr class="my-6 border-0 border-t border-slate-600" style="opacity: 0.5;">');
                
                // Títulos (números como "1. Python", "2. Java")
                textHtml = textHtml.replace(/^(\d+)\.\s+(.+)$/gm, '<h3 class="text-base font-bold text-purple-300 mt-4 mb-2">$1. $2</h3>');
                
                // Títulos markdown
                textHtml = textHtml.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-purple-300 mt-4 mb-2">$1</h3>');
                textHtml = textHtml.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-purple-300 mt-4 mb-2">$1</h2>');
                textHtml = textHtml.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-purple-300 mt-4 mb-2">$1</h1>');
                
                // Negrita y cursiva
                textHtml = textHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
                textHtml = textHtml.replace(/\*(.*?)\*/g, '<em class="text-slate-200">$1</em>');
                
                // Código inline (fondo gris tenue como ChatGPT)
                textHtml = textHtml.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded text-sm font-mono" style="background-color: rgba(255, 255, 255, 0.1); color: #e5e7eb;">$1</code>');
                
                // Listas
                textHtml = textHtml.replace(/^- (.+)$/gm, '<li class="ml-4 text-slate-200 my-1">$1</li>');
                
                // Convertir saltos de línea: dobles -> separación de párrafo, simples -> espacio
                textHtml = textHtml.replace(/\n\n+/g, '</p><p class="text-slate-200 leading-relaxed mb-3">');
                textHtml = textHtml.replace(/\n/g, ' ');
                
                // Envolver en párrafo
                textHtml = '<p class="text-slate-200 leading-relaxed mb-3">' + textHtml + '</p>';
                
                html += textHtml;
            }
        });
        
        return html;
    }
    
    
    
    /**
     * Escapa HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Normaliza un string para usarlo como slug
     */
    normalizeSlug(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')           // Espacios a guiones
            .replace(/[^\w\-]+/g, '')        // Solo alfanuméricos y guiones
            .replace(/\-\-+/g, '-')          // Guiones múltiples a uno
            .replace(/^-+/, '')              // Remover guiones al inicio
            .replace(/-+$/, '');             // Remover guiones al final
    }
    
    /**
     * Actualiza el estado del botón de enviar
     */
    updateSendButton(loading) {
        const btn = this.modal.querySelector('#ai-chat-send-btn');
        if (btn) {
            btn.disabled = loading;
            const icon = btn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', loading ? 'loader-2' : 'send');
                if (loading) {
                    icon.classList.add('animate-spin');
                } else {
                    icon.classList.remove('animate-spin');
                }
            }
            if (window.lucide) window.lucide.createIcons();
        }
    }
    
    /**
     * Muestra indicador visual de "pensando" junto al último mensaje del usuario
     */
    showThinkingIndicator() {
        const container = this.modal.querySelector('#ai-chat-messages');
        if (!container) return;

        // Buscar el último mensaje del usuario
        const messages = container.querySelectorAll('.flex.justify-end');
        const lastUserMessage = messages[messages.length - 1];

        if (lastUserMessage && !lastUserMessage.querySelector('.thinking-indicator')) {
            // Crear indicador de pensamiento
            const thinkingIndicator = document.createElement('div');
            thinkingIndicator.className = 'thinking-indicator mr-2 opacity-80 flex-shrink-0 self-center';
            thinkingIndicator.innerHTML = `
                <div class="flex gap-1">
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
            `;

            // Agregar al mensaje del usuario (antes del mensaje de texto)
            const messageBubble = lastUserMessage.querySelector('.bg-slate-700, .bg-slate-100');
            if (messageBubble) {
                lastUserMessage.insertBefore(thinkingIndicator, messageBubble);
            } else {
                lastUserMessage.appendChild(thinkingIndicator);
            }
        }
    }

    /**
     * Oculta el modal
     */
    hide() {
        if (this.modal) {
            this.isVisible = false;
            this.modal.classList.add('hidden');
            this.modal.style.display = 'none';
        }
    }
    
    /**
     * Oculta el indicador de "pensando"
     */
    hideThinkingIndicator() {
        const container = this.modal.querySelector('#ai-chat-messages');
        if (!container) return;

        // Buscar y remover todos los indicadores de pensamiento
        const indicators = container.querySelectorAll('.thinking-indicator');
        indicators.forEach(indicator => indicator.remove());
    }
}

export default AIChatModal;
