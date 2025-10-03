/**
 * AIChatModal - Modal de chat con IA usando RAG ligero
 * Carga índices JSON estáticos, hace búsqueda por similitud en el navegador
 * y consulta a Edge Function de Supabase para obtener respuestas de GPT-4o-mini
 */

class AIChatModal {
    constructor(dataManager, notifications) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        
        this.isVisible = false;
        this.currentSubject = null;
        this.currentTopic = null;
        this.indexCache = null; // Cache del índice JSON cargado
        this.messages = []; // Historial de mensajes
        this.isLoading = false;
        
        this.modal = null;
        this.SUPABASE_URL = 'https://xsumibufekrmfcenyqgq.supabase.co';
        this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdW1pYnVmZWtybWZjZW55cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTExOTIsImV4cCI6MjA3NTA2NzE5Mn0.x-vdT-84cEOj-5SDOVfDbgZMVVWczj8iVM0P_VoEkBc';
    }
    
    /**
     * Muestra el modal de chat
     */
    show(subject, topic) {
        this.currentSubject = subject;
        this.currentTopic = topic;
        
        if (!this.modal) {
            this.createModal();
        }
        
        this.isVisible = true;
        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
        
        // Cargar índice JSON si no está en cache
        if (!this.indexCache) {
            this.loadIndex();
        }
        
        // Focus en el input
        setTimeout(() => {
            const input = this.modal.querySelector('#ai-chat-input');
            if (input) input.focus();
        }, 100);
    }
    
    /**
     * Oculta el modal
     */
    hide() {
        this.isVisible = false;
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }
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
        <div id="ai-chat-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/50 p-4">
            <!-- Modal container -->
            <div class="bg-slate-800 rounded-xl shadow-2xl flex flex-col max-w-4xl w-full h-[90vh]">
                <!-- Header -->
                <div class="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
                    <div class="flex items-center gap-3">
                        <i data-lucide="graduation-cap" class="w-6 h-6 text-slate-400"></i>
                        <h2 class="text-xl font-semibold text-slate-200">Profesor</h2>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="ai-clear-chat-btn" class="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Borrar conversación">
                            <i data-lucide="trash-2" class="w-5 h-5 text-slate-400"></i>
                        </button>
                        <button id="ai-close-btn" class="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <i data-lucide="x" class="w-5 h-5 text-slate-400"></i>
                        </button>
                    </div>
                </div>
            
            <!-- Contexto actual -->
            <div class="px-4 py-2 bg-slate-900/50 border-b border-slate-700">
                <div class="flex items-center gap-2 text-xs text-slate-400">
                    <i data-lucide="book-open" class="w-3 h-3"></i>
                    <span id="ai-context-info">Cargando contexto...</span>
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
            <div class="p-4 border-t border-slate-700 bg-slate-900/50">
                <!-- Toggle incluir apuntes -->
                <div class="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="ai-include-notes-toggle" class="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500" checked>
                    <label for="ai-include-notes-toggle" class="text-xs text-slate-400 cursor-pointer">Incluir apuntes del editor</label>
                </div>
                
                <!-- Input y botón -->
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        id="ai-chat-input" 
                        placeholder="Pregunta sobre este tema..." 
                        class="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                    >
                    <button 
                        id="ai-chat-send-btn" 
                        class="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </div>
                
                <!-- Estado de carga del índice -->
                <div id="ai-index-status" class="mt-2 flex items-center gap-2">
                    <span class="hidden" id="ai-status-icon"></span>
                    <span class="text-xs text-slate-500" id="ai-status-text"></span>
                </div>
            </div>
        `;
        
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
        const closeBtn = this.modal.querySelector('#ai-chat-close-btn');
        const clearBtn = this.modal.querySelector('#ai-chat-clear-btn');
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
                throw new Error('Índice no encontrado');
            }
            
            const index = await response.json();
            
            if (!Array.isArray(index) || index.length === 0) {
                throw new Error('Índice vacío o inválido');
            }
            
            this.indexCache = index;
            this.updateIndexStatus(index.length, 'success');
            this.updateContextInfo();
            
        } catch (error) {
            console.error('Error cargando índice:', error);
            this.indexCache = null;
            this.updateIndexStatus('⚠️ Sin índice - usando solo apuntes', 'warning');
            this.updateContextInfo();
        }
    }
    
    /**
     * Normaliza un string para slug (sin espacios, minúsculas, sin acentos)
     */
    normalizeSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales por -
            .replace(/^-|-$/g, ''); // Quitar guiones al inicio/fin
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
        
        // Añadir mensaje del usuario
        this.addMessage('user', query);
        
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
            this.addMessage('error', `Error: ${error.message}`);
            this.notifications.error('Error al consultar IA');
        } finally {
            this.isLoading = false;
            this.updateSendButton(false);
        }
    }
    
    /**
     * Obtiene respuesta de la IA
     */
    async getAIResponse(query) {
        // 1. Obtener apuntes del editor si está activado
        const includeNotes = this.modal.querySelector('#ai-include-notes-toggle')?.checked;
        let editorContext = '';
        
        if (includeNotes) {
            const editor = document.getElementById('text-editor');
            if (editor) {
                editorContext = editor.innerText.trim();
                // Limitar a 2000 caracteres para no saturar
                if (editorContext.length > 2000) {
                    editorContext = editorContext.substring(0, 2000) + '...';
                }
            }
        }
        
        // 2. Si hay índice, buscar chunks relevantes
        let topChunks = [];
        if (this.indexCache && this.indexCache.length > 0) {
            topChunks = await this.findRelevantChunks(query, 5);
        }
        
        // 3. Llamar a Edge Function (o fallback local si no está configurada)
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
                extraContext: editorContext
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * Encuentra chunks relevantes usando similitud coseno
     */
    async findRelevantChunks(query, topK = 5) {
        if (!this.indexCache || this.indexCache.length === 0) {
            return [];
        }
        
        // 1. Obtener embedding del query (simulado - en producción llamar a OpenAI)
        const queryEmbedding = await this.getQueryEmbedding(query);
        
        // 2. Calcular similitud con cada chunk
        const similarities = this.indexCache.map(chunk => ({
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
        this.messages.push({ role, content, sources, timestamp: Date.now() });
        this.renderMessages();
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
        
        container.innerHTML = this.messages.map(msg => {
            if (msg.role === 'user') {
                return `
                    <div class="flex justify-end">
                        <div class="bg-purple-600 text-white px-4 py-2 rounded-lg max-w-[85%] text-sm">
                            ${this.escapeHtml(msg.content)}
                        </div>
                    </div>
                `;
            } else if (msg.role === 'error') {
                return `
                    <div class="flex justify-start">
                        <div class="bg-red-900/50 text-red-200 px-4 py-2 rounded-lg max-w-[85%] text-sm border border-red-700">
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
                    <div class="flex justify-start">
                        <div class="bg-slate-700 text-slate-100 px-4 py-2 rounded-lg max-w-[85%] text-sm">
                            ${this.formatMarkdown(msg.content)}
                            ${sourcesHtml}
                        </div>
                    </div>
                `;
            }
        }).join('');
        
        // Scroll al final
        container.scrollTop = container.scrollHeight;
        
        // Actualizar iconos
        if (window.lucide) window.lucide.createIcons();
    }
    
    /**
     * Formatea texto con markdown básico
     */
    formatMarkdown(text) {
        return this.escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
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
     * Limpia el chat
     */
    clearChat() {
        this.messages = [];
        this.renderMessages();
        this.notifications.success('Chat limpiado');
    }
}

export default AIChatModal;
