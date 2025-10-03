/**
 * Modal para crear colecciones de quizzes en lote
 */
class QuizCreatorModal {
    constructor(quizManager, dataManager, notifications) {
        this.quizManager = quizManager;
        this.dataManager = dataManager;
        this.notifications = notifications;
    }

    /**
     * Muestra el modal de creación de quiz
     */
    show(topicId, topicName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.id = 'quiz-creator-modal';

        modal.innerHTML = `
            <div class="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-700 flex flex-col">
                <!-- Header -->
                <div class="p-6 border-b border-slate-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold text-white mb-1">Crear Colección de Preguntas</h2>
                            <p class="text-slate-400 text-sm">Tema: ${topicName}</p>
                        </div>
                        <button id="close-quiz-modal" class="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <i data-lucide="x" class="w-6 h-6 text-slate-400"></i>
                        </button>
                    </div>
                </div>

                <!-- Body -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <!-- Información de la colección -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Nombre de la Colección *
                            </label>
                            <input 
                                type="text" 
                                id="quiz-collection-name"
                                class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ej: Teoría de Conjuntos - Básico"
                                required
                            >
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">
                                Descripción (opcional)
                            </label>
                            <input 
                                type="text" 
                                id="quiz-collection-description"
                                class="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ej: Preguntas sobre operaciones básicas con conjuntos"
                            >
                        </div>
                    </div>

                    <!-- Formato de ejemplo -->
                    <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                        <div class="flex items-start gap-3 mb-3">
                            <i data-lucide="info" class="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5"></i>
                            <div>
                                <h3 class="text-sm font-semibold text-white mb-1">Formato de las preguntas</h3>
                                <p class="text-xs text-slate-400">Separa cada pregunta con una línea en blanco. Usa el siguiente formato:</p>
                            </div>
                        </div>
                        <div class="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
                            <div>pregunta: ¿Cuál es la capital de Francia?</div>
                            <div>opcion a: Rusia</div>
                            <div>opcion b: Paris</div>
                            <div>opcion c: Bogotá</div>
                            <div>opcion d: Madrid</div>
                            <div>respuesta: b</div>
                            <div class="text-slate-500">explicacion: Paris es la capital de Francia (opcional)</div>
                        </div>
                    </div>

                    <!-- Área de texto para preguntas -->
                    <div>
                        <label class="block text-sm font-medium text-slate-300 mb-2">
                            Preguntas (en lote) *
                        </label>
                        <textarea 
                            id="quiz-questions-input"
                            class="w-full h-96 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none"
                            placeholder="Pega aquí tus preguntas en el formato indicado arriba..."
                        ></textarea>
                        <div class="flex items-center justify-between mt-2">
                            <p class="text-xs text-slate-500">Separa cada pregunta con una línea en blanco</p>
                            <span id="questions-count" class="text-xs text-slate-400">0 preguntas detectadas</span>
                        </div>
                    </div>

                    <!-- Preview de preguntas -->
                    <div id="questions-preview" class="hidden">
                        <h3 class="text-sm font-semibold text-white mb-3">Vista Previa</h3>
                        <div id="preview-list" class="space-y-3 max-h-64 overflow-y-auto"></div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="p-6 border-t border-slate-700 flex justify-between items-center">
                    <button id="preview-questions-btn" class="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <i data-lucide="eye" class="w-4 h-4 inline mr-2"></i>
                        Vista Previa
                    </button>
                    <div class="flex gap-3">
                        <button id="cancel-quiz-btn" class="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button id="save-quiz-btn" class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                            Crear Colección
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        this.attachEventListeners(modal, topicId);

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Auto-update contador
        const textarea = modal.querySelector('#quiz-questions-input');
        textarea.addEventListener('input', () => this.updateQuestionCount(modal));
    }

    /**
     * Adjunta event listeners al modal
     */
    attachEventListeners(modal, topicId) {
        const closeBtn = modal.querySelector('#close-quiz-modal');
        const cancelBtn = modal.querySelector('#cancel-quiz-btn');
        const saveBtn = modal.querySelector('#save-quiz-btn');
        const previewBtn = modal.querySelector('#preview-questions-btn');

        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        saveBtn.addEventListener('click', () => this.saveQuizCollection(topicId));
        previewBtn.addEventListener('click', () => this.showPreview(modal));

        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }

    /**
     * Actualiza el contador de preguntas
     */
    updateQuestionCount(modal) {
        const textarea = modal.querySelector('#quiz-questions-input');
        const counter = modal.querySelector('#questions-count');
        
        const text = textarea.value;
        const questions = this.quizManager.parseBatchQuestions(text);
        
        counter.textContent = `${questions.length} pregunta${questions.length !== 1 ? 's' : ''} detectada${questions.length !== 1 ? 's' : ''}`;
        counter.className = questions.length > 0 ? 'text-xs text-emerald-400' : 'text-xs text-slate-400';
    }

    /**
     * Muestra vista previa de las preguntas
     */
    showPreview(modal) {
        const textarea = modal.querySelector('#quiz-questions-input');
        const previewSection = modal.querySelector('#questions-preview');
        const previewList = modal.querySelector('#preview-list');

        const text = textarea.value;
        const questions = this.quizManager.parseBatchQuestions(text);

        if (questions.length === 0) {
            this.notifications.warning('No se detectaron preguntas válidas');
            return;
        }

        previewList.innerHTML = questions.map((q, index) => `
            <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <h4 class="text-sm font-semibold text-white mb-2">${index + 1}. ${q.question}</h4>
                <div class="space-y-1 text-xs">
                    <div class="text-slate-300">a) ${q.options.a}</div>
                    <div class="text-slate-300">b) ${q.options.b}</div>
                    <div class="text-slate-300">c) ${q.options.c}</div>
                    <div class="text-slate-300">d) ${q.options.d}</div>
                </div>
                <div class="mt-2 text-xs text-emerald-400">✓ Respuesta correcta: ${q.correctAnswer.toUpperCase()}</div>
                ${q.explanation ? `<div class="mt-1 text-xs text-slate-400">💡 ${q.explanation}</div>` : ''}
            </div>
        `).join('');

        previewSection.classList.remove('hidden');
        previewList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Guarda la colección de quiz
     */
    saveQuizCollection(topicId) {
        const modal = document.getElementById('quiz-creator-modal');
        const nameInput = modal.querySelector('#quiz-collection-name');
        const descriptionInput = modal.querySelector('#quiz-collection-description');
        const textarea = modal.querySelector('#quiz-questions-input');

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        const text = textarea.value;

        if (!name) {
            this.notifications.warning('Ingresa un nombre para la colección');
            nameInput.focus();
            return;
        }

        const questions = this.quizManager.parseBatchQuestions(text);

        if (questions.length === 0) {
            this.notifications.warning('No se detectaron preguntas válidas. Revisa el formato.');
            textarea.focus();
            return;
        }

        // Crear colección
        const collection = this.quizManager.createQuizCollection(topicId, name, description);
        
        // Añadir preguntas
        this.quizManager.addQuestionsToCollection(collection.id, topicId, questions);

        this.notifications.success(`Colección creada con ${questions.length} pregunta${questions.length !== 1 ? 's' : ''}`);
        this.close();
    }

    /**
     * Cierra el modal
     */
    close() {
        const modal = document.getElementById('quiz-creator-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }
}

export default QuizCreatorModal;
