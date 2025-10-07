/**
 * Modal para crear colecciones de quizzes en lote - Sistema de pasos
 */
class QuizCreatorModal {
    constructor(quizManager, dataManager, notifications) {
        this.quizManager = quizManager;
        this.dataManager = dataManager;
        this.notifications = notifications;
        this.currentStep = 1;
        this.collectionData = {
            name: '',
            description: '',
            questions: []
        };
    }

    /**
     * Muestra el modal de creación de quiz
     */
    show(topicId, topicName) {
        this.topicId = topicId;
        this.topicName = topicName;
        this.currentStep = 1;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.id = 'quiz-creator-modal';

        modal.innerHTML = this.renderModal();
        document.body.appendChild(modal);

        // Event listeners
        this.attachEventListeners(modal);

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Renderiza el modal según el paso actual
     */
    renderModal() {
        return `
            <div class="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700 flex flex-col">
                <!-- Header con indicador de pasos -->
                <div class="p-3 border-b border-slate-700">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <h2 class="text-xl font-bold text-white">Crear Colección de Preguntas</h2>
                            <p class="text-slate-400 text-xs">Tema: ${this.topicName}</p>
                        </div>
                        <button id="close-quiz-modal" class="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                            <i data-lucide="x" class="w-4 h-4 text-slate-400"></i>
                        </button>
                    </div>

                    <!-- Indicador de pasos compacto -->
                    <div class="flex items-center gap-1">
                        <div class="flex items-center gap-1 flex-1">
                            <div class="flex items-center gap-1 flex-1">
                                <div class="step-indicator ${this.currentStep >= 1 ? 'active' : ''}" data-step="1">
                                    <span>1</span>
                                </div>
                                <div class="flex-1 h-0.5 ${this.currentStep >= 2 ? 'bg-blue-500' : 'bg-slate-600'}"></div>
                            </div>
                            <div class="flex items-center gap-1 flex-1">
                                <div class="step-indicator ${this.currentStep >= 2 ? 'active' : ''}" data-step="2">
                                    <span>2</span>
                                </div>
                                <div class="flex-1 h-0.5 ${this.currentStep >= 3 ? 'bg-blue-500' : 'bg-slate-600'}"></div>
                            </div>
                            <div class="step-indicator ${this.currentStep >= 3 ? 'active' : ''}" data-step="3">
                                <span>3</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-between mt-1 text-[10px] text-slate-400">
                        <span class="${this.currentStep === 1 ? 'text-blue-400 font-semibold' : ''}">Información</span>
                        <span class="${this.currentStep === 2 ? 'text-blue-400 font-semibold' : ''}">Preguntas</span>
                        <span class="${this.currentStep === 3 ? 'text-blue-400 font-semibold' : ''}">Vista Previa</span>
                    </div>
                </div>

                <!-- Body dinámico según paso -->
                <div id="step-content" class="flex-1 overflow-y-auto p-3">
                    ${this.renderStepContent()}
                </div>

                <!-- Footer con navegación -->
                <div class="p-3 border-t border-slate-700 flex justify-between items-center">
                    <button id="cancel-quiz-btn" class="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <div class="flex gap-3">
                        ${this.currentStep > 1 ? `
                            <button id="prev-step-btn" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">
                                <i data-lucide="arrow-left" class="w-4 h-4 inline mr-2"></i>
                                Anterior
                            </button>
                        ` : ''}
                        ${this.currentStep < 3 ? `
                            <button id="next-step-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                                Siguiente
                                <i data-lucide="arrow-right" class="w-4 h-4 inline ml-2"></i>
                            </button>
                        ` : `
                            <button id="save-quiz-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                                <i data-lucide="check" class="w-4 h-4 inline mr-2"></i>
                                Crear Colección
                            </button>
                        `}
                    </div>
                </div>
            </div>
            
            <style>
                .step-indicator {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background-color: #334155;
                    border: 1px solid #475569;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    font-weight: 600;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }

                .step-indicator.active {
                    background-color: #3b82f6;
                    border-color: #60a5fa;
                    color: white;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
                }
            </style>
        `;
    }

    /**
     * Renderiza el contenido del paso actual
     */
    renderStepContent() {
        switch(this.currentStep) {
            case 1:
                return this.renderStep1();
            case 2:
                return this.renderStep2();
            case 3:
                return this.renderStep3();
            default:
                return '';
        }
    }

    /**
     * Paso 1: Información básica
     */
    renderStep1() {
        return `
            <div class="max-w-2xl mx-auto space-y-3">
                <div class="text-center mb-3">
                    <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
                        <i data-lucide="file-text" class="w-5 h-5 text-blue-400"></i>
                    </div>
                    <h3 class="text-base font-bold text-white mb-1">Información de la Colección</h3>
                    <p class="text-slate-400 text-xs">Dale un nombre y descripción a tu colección de preguntas</p>
                </div>

                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-semibold text-white mb-2">
                            Nombre de la Colección *
                        </label>
                        <input 
                            type="text" 
                            id="quiz-collection-name"
                            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ej: Teoría de Conjuntos - Básico"
                            value="${this.collectionData.name}"
                            required
                        >
                        <p class="text-xs text-slate-500 mt-1">Este nombre aparecerá en tu lista de colecciones</p>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-white mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea 
                            id="quiz-collection-description"
                            class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Ej: Preguntas sobre operaciones básicas con conjuntos, unión, intersección y diferencia"
                            rows="3"
                        >${this.collectionData.description}</textarea>
                        <p class="text-xs text-slate-500 mt-1">Agrega detalles sobre el contenido de esta colección</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Paso 2: Ingresar preguntas
     */
    renderStep2() {
        return `
            <div class="space-y-3">
                <div class="text-center mb-3">
                    <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
                        <i data-lucide="list" class="w-5 h-5 text-blue-400"></i>
                    </div>
                    <h3 class="text-base font-bold text-white mb-1">Agregar Preguntas</h3>
                    <p class="text-slate-400 text-xs">Ingresa tus preguntas en el formato especificado</p>
                </div>

                <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-semibold text-white">
                        Preguntas (en lote) *
                    </label>
                    <button id="insert-example-btn" class="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors text-sm font-medium">
                        <i data-lucide="lightbulb" class="w-4 h-4"></i>
                        <span>Insertar ejemplo</span>
                    </button>
                </div>
                
                <textarea 
                    id="quiz-questions-input"
                    class="w-full h-[240px] px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                    placeholder="Pega aquí tus preguntas en el formato indicado..."
                ></textarea>
                
                <div class="flex items-center justify-between">
                    <p class="text-xs text-slate-500">Separa cada pregunta con una línea en blanco</p>
                    <span id="questions-count" class="text-sm font-semibold text-slate-400">0 preguntas detectadas</span>
                </div>
            </div>
        `;
    }

    /**
     * Paso 3: Vista previa
     */
    renderStep3() {
        const questions = this.collectionData.questions;
        
        return `
            <div class="space-y-3">
                <div class="text-center mb-3">
                    <div class="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-1">
                        <i data-lucide="eye" class="w-5 h-5 text-green-400"></i>
                    </div>
                    <h3 class="text-base font-bold text-white mb-1">Vista Previa</h3>
                    <p class="text-slate-400 text-xs">Revisa tu colección antes de crearla</p>
                </div>

                <!-- Resumen -->
                <div class="bg-slate-900/50 border border-slate-600 rounded-lg p-3">
                    <h4 class="text-base font-bold text-white mb-1">${this.collectionData.name}</h4>
                    ${this.collectionData.description ? `<p class="text-slate-400 text-xs mb-2">${this.collectionData.description}</p>` : ''}
                    <div class="flex items-center gap-3 text-sm">
                        <span class="text-blue-400 font-semibold">${questions.length} pregunta${questions.length !== 1 ? 's' : ''}</span>
                        <span class="text-slate-500">•</span>
                        <span class="text-slate-400 text-xs">Tema: ${this.topicName}</span>
                    </div>
                </div>

                <!-- Lista de preguntas -->
                <div class="space-y-2">
                    <h4 class="text-sm font-semibold text-white">Preguntas:</h4>
                    <div class="space-y-2 max-h-[280px] overflow-y-auto">
                        ${questions.map((q, index) => `
                            <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-2 hover:border-slate-600 transition-colors">
                                <h5 class="text-sm font-semibold text-white mb-1">${index + 1}. ${q.question}</h5>
                                <div class="grid grid-cols-2 gap-1 text-xs">
                                    <div class="text-slate-300 ${q.correctAnswer === 'a' ? 'text-green-400 font-semibold' : ''}">a) ${q.options.a}</div>
                                    <div class="text-slate-300 ${q.correctAnswer === 'b' ? 'text-green-400 font-semibold' : ''}">b) ${q.options.b}</div>
                                    <div class="text-slate-300 ${q.correctAnswer === 'c' ? 'text-green-400 font-semibold' : ''}">c) ${q.options.c}</div>
                                    <div class="text-slate-300 ${q.correctAnswer === 'd' ? 'text-green-400 font-semibold' : ''}">d) ${q.options.d}</div>
                                </div>
                                <div class="mt-1 pt-1 border-t border-slate-700 text-xs text-green-400">
                                    ✓ Respuesta correcta: ${q.correctAnswer.toUpperCase()}
                                </div>
                                ${q.explanation ? `<div class="mt-1 text-xs text-slate-400">💡 ${q.explanation}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Adjunta event listeners al modal
     */
    attachEventListeners(modal) {
        const closeBtn = modal.querySelector('#close-quiz-modal');
        const cancelBtn = modal.querySelector('#cancel-quiz-btn');
        const nextBtn = modal.querySelector('#next-step-btn');
        const prevBtn = modal.querySelector('#prev-step-btn');
        const saveBtn = modal.querySelector('#save-quiz-btn');

        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveQuizCollection());

        // Listeners específicos del paso 2
        if (this.currentStep === 2) {
            const textarea = modal.querySelector('#quiz-questions-input');
            const insertExampleBtn = modal.querySelector('#insert-example-btn');
            
            if (textarea) {
                textarea.addEventListener('input', () => this.updateQuestionCount(modal));
            }
            if (insertExampleBtn) {
                insertExampleBtn.addEventListener('click', () => this.insertExample(modal));
            }
        }

        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }

    /**
     * Avanza al siguiente paso
     */
    nextStep() {
        const modal = document.getElementById('quiz-creator-modal');
        
        // Validar paso actual antes de avanzar
        if (this.currentStep === 1) {
            const nameInput = modal.querySelector('#quiz-collection-name');
            const name = nameInput?.value.trim();
            
            if (!name) {
                this.notifications.warning('Ingresa un nombre para la colección');
                nameInput?.focus();
                return;
            }
            
            // Guardar datos del paso 1
            this.collectionData.name = name;
            this.collectionData.description = modal.querySelector('#quiz-collection-description')?.value.trim() || '';
        }
        
        if (this.currentStep === 2) {
            const textarea = modal.querySelector('#quiz-questions-input');
            const text = textarea?.value || '';
            const questions = this.quizManager.parseBatchQuestions(text);
            
            if (questions.length === 0) {
                this.notifications.warning('Debes ingresar al menos una pregunta válida');
                textarea?.focus();
                return;
            }
            
            // Guardar preguntas
            this.collectionData.questions = questions;
        }
        
        // Avanzar paso
        this.currentStep++;
        this.refreshModal();
    }

    /**
     * Retrocede al paso anterior
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.refreshModal();
        }
    }

    /**
     * Refresca el modal con el paso actual
     */
    refreshModal() {
        const modal = document.getElementById('quiz-creator-modal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.bg-slate-800');
        if (modalContent) {
            modalContent.outerHTML = this.renderModal().match(/<div class="bg-slate-800[\s\S]*<\/style>/)[0];
        }
        
        // Re-adjuntar listeners
        this.attachEventListeners(modal);
        
        // Re-inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
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
    saveQuizCollection() {
        // Usar datos guardados en collectionData
        const name = this.collectionData.name;
        const description = this.collectionData.description;
        const questions = this.collectionData.questions;

        if (!name || questions.length === 0) {
            this.notifications.error('Error: Datos incompletos');
            return;
        }

        // Crear colección
        const collection = this.quizManager.createQuizCollection(this.topicId, name, description);
        
        // Añadir preguntas
        this.quizManager.addQuestionsToCollection(collection.id, this.topicId, questions);

        this.notifications.success(`Colección creada con ${questions.length} pregunta${questions.length !== 1 ? 's' : ''}`);
        this.close();
    }

    /**
     * Inserta un ejemplo de formato en el textarea
     */
    insertExample(modal) {
        const textarea = modal.querySelector('#quiz-questions-input');
        const exampleText = `pregunta: ¿Cuál es la capital de Francia?
opcion a: Rusia
opcion b: Paris
opcion c: Bogotá
opcion d: Madrid
respuesta: b
explicacion: Paris es la capital de Francia (opcional)`;
        
        textarea.value = exampleText;
        textarea.focus();
        this.updateQuestionCount(modal);
        this.notifications.info('Ejemplo insertado. Puedes editarlo o agregar más preguntas.');
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
