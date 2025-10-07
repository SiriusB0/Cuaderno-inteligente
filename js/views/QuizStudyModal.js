/**
 * Modal para estudiar preguntas multiple choice
 */
class QuizStudyModal {
    constructor(quizManager, notifications) {
        this.quizManager = quizManager;
        this.notifications = notifications;
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.hasAnswered = false;
        this.stats = {
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            startTime: null
        };
    }

    /**
     * Muestra el modal de estudio
     */
    show(collection) {
        if (!collection || !collection.questions || collection.questions.length === 0) {
            this.notifications.error('Esta colección no tiene preguntas');
            return;
        }

        this.collection = collection;
        this.currentQuestionIndex = 0;
        this.stats = {
            totalQuestions: collection.questions.length,
            correctAnswers: 0,
            incorrectAnswers: 0,
            startTime: Date.now()
        };

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4';
        modal.id = 'quiz-study-modal';

        modal.innerHTML = `
            <div class="bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-700 flex flex-col" style="max-height: 90vh;">
                <!-- Header compacto -->
                <div class="p-4 border-b border-slate-700 flex-shrink-0">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex-1">
                            <h2 class="text-lg font-bold text-white">${collection.name}</h2>
                            <p class="text-slate-400 text-xs">${collection.description || 'Responde todas las preguntas'}</p>
                        </div>
                        <button id="close-study-modal" class="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
                            <i data-lucide="x" class="w-5 h-5 text-slate-400"></i>
                        </button>
                    </div>
                    
                    <!-- Progress bar compacto -->
                    <div class="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span>Pregunta <span id="current-question-num">1</span> de ${collection.questions.length}</span>
                        <span id="score-display">0 correctas</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5">
                        <div id="progress-bar" class="bg-gradient-to-r from-indigo-600 to-purple-600 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Question Content (sin scroll, altura fija) -->
                <div class="flex-1 p-4 overflow-hidden">
                    <div id="question-container" class="h-full flex flex-col">
                        <!-- La pregunta se renderizará aquí -->
                    </div>
                </div>

                <!-- Footer compacto -->
                <div class="p-4 border-t border-slate-700 flex-shrink-0">
                    <div id="action-buttons" class="flex justify-end gap-3">
                        <!-- Los botones se renderizarán aquí -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeBtn = modal.querySelector('#close-study-modal');
        closeBtn.addEventListener('click', () => this.confirmClose());

        // Renderizar primera pregunta
        this.renderQuestion();

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Renderiza la pregunta actual
     */
    renderQuestion() {
        const modal = document.getElementById('quiz-study-modal');
        if (!modal) return;

        const question = this.collection.questions[this.currentQuestionIndex];
        const container = modal.querySelector('#question-container');
        const actionButtons = modal.querySelector('#action-buttons');

        this.selectedAnswer = null;
        this.hasAnswered = false;

        // Renderizar pregunta con altura fija y scroll
        container.innerHTML = `
            <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-6 mb-4 flex-shrink-0 overflow-y-auto" style="height: 200px;">
                <h3 class="text-lg font-semibold text-white leading-relaxed">${question.question}</h3>
            </div>

            <div class="grid grid-cols-2 gap-3 flex-shrink-0">
                ${this.renderOption('a', question.options.a)}
                ${this.renderOption('b', question.options.b)}
                ${this.renderOption('c', question.options.c)}
                ${this.renderOption('d', question.options.d)}
            </div>
        `;

        // Renderizar botones
        actionButtons.innerHTML = `
            <button id="confirm-answer-btn" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Confirmar Respuesta
            </button>
        `;

        // Event listeners para opciones
        const options = container.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.addEventListener('click', () => this.selectOption(option));
        });

        // Event listener para confirmar
        const confirmBtn = actionButtons.querySelector('#confirm-answer-btn');
        confirmBtn.addEventListener('click', () => this.confirmAnswer());

        // Actualizar progress
        this.updateProgress();

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Renderiza una opción
     */
    renderOption(letter, text) {
        return `
            <button class="quiz-option w-full text-left p-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg hover:border-indigo-500 hover:bg-slate-900 transition-all group" data-option="${letter}">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-xs group-hover:bg-indigo-600 transition-colors flex-shrink-0">
                        ${letter.toUpperCase()}
                    </div>
                    <span class="text-slate-200 text-sm flex-1">${text}</span>
                </div>
            </button>
        `;
    }

    /**
     * Selecciona una opción
     */
    selectOption(optionElement) {
        if (this.hasAnswered) return;

        const modal = document.getElementById('quiz-study-modal');
        const options = modal.querySelectorAll('.quiz-option');
        const confirmBtn = modal.querySelector('#confirm-answer-btn');

        // Remover selección anterior
        options.forEach(opt => {
            opt.classList.remove('border-indigo-500', 'bg-indigo-500/20', 'bg-slate-900');
            opt.classList.add('border-slate-700', 'bg-slate-900/50');
            // Restaurar color del círculo
            const circle = opt.querySelector('.w-6.h-6');
            if (circle) {
                circle.classList.remove('bg-indigo-600');
                circle.classList.add('bg-slate-700');
            }
        });

        // Seleccionar nueva opción con fondo azul
        optionElement.classList.remove('border-slate-700', 'bg-slate-900/50');
        optionElement.classList.add('border-indigo-500', 'bg-indigo-500/20');
        
        // Cambiar color del círculo de la opción seleccionada
        const selectedCircle = optionElement.querySelector('.w-6.h-6');
        if (selectedCircle) {
            selectedCircle.classList.remove('bg-slate-700');
            selectedCircle.classList.add('bg-indigo-600');
        }

        this.selectedAnswer = optionElement.dataset.option;
        confirmBtn.disabled = false;
    }

    /**
     * Confirma la respuesta
     */
    confirmAnswer() {
        if (!this.selectedAnswer || this.hasAnswered) return;

        this.hasAnswered = true;
        const modal = document.getElementById('quiz-study-modal');
        const question = this.collection.questions[this.currentQuestionIndex];
        
        // Normalizar ambas respuestas a minúsculas para comparación
        const selectedAnswerNormalized = this.selectedAnswer.toLowerCase().trim();
        const correctAnswerNormalized = question.correctAnswer.toLowerCase().trim();
        const isCorrect = selectedAnswerNormalized === correctAnswerNormalized;

        console.log('Respuesta seleccionada:', selectedAnswerNormalized);
        console.log('Respuesta correcta:', correctAnswerNormalized);
        console.log('¿Es correcta?:', isCorrect);

        // Actualizar estadísticas
        if (isCorrect) {
            this.stats.correctAnswers++;
        } else {
            this.stats.incorrectAnswers++;
        }

        // Mostrar feedback visual en las opciones
        const options = modal.querySelectorAll('.quiz-option');
        options.forEach(opt => {
            const letter = opt.dataset.option.toLowerCase().trim();
            opt.disabled = true;
            opt.classList.remove('hover:border-indigo-500', 'hover:bg-slate-900');

            if (letter === correctAnswerNormalized) {
                // Respuesta correcta - fondo verde
                opt.classList.remove('border-slate-700', 'border-indigo-500', 'bg-slate-900/50');
                opt.classList.add('border-emerald-500', 'bg-emerald-500/30');
                // Cambiar color del círculo
                const circle = opt.querySelector('.w-6.h-6');
                if (circle) {
                    circle.classList.remove('bg-slate-700');
                    circle.classList.add('bg-emerald-600');
                }
                // Cambiar color del texto
                const textSpan = opt.querySelector('span');
                if (textSpan) {
                    textSpan.classList.remove('text-slate-200');
                    textSpan.classList.add('text-white');
                }
            } else if (letter === selectedAnswerNormalized) {
                // Respuesta incorrecta seleccionada - fondo rojo
                opt.classList.remove('border-slate-700', 'border-indigo-500', 'bg-slate-900/50');
                opt.classList.add('border-red-500', 'bg-red-500/30');
                // Cambiar color del círculo
                const circle = opt.querySelector('.w-6.h-6');
                if (circle) {
                    circle.classList.remove('bg-slate-700');
                    circle.classList.add('bg-red-600');
                }
                // Cambiar color del texto
                const textSpan = opt.querySelector('span');
                if (textSpan) {
                    textSpan.classList.remove('text-slate-200');
                    textSpan.classList.add('text-white');
                }
            }
        });

        // Cambiar botón a "Siguiente" y agregar botón de explicación si existe
        const actionButtons = modal.querySelector('#action-buttons');
        const isLastQuestion = this.currentQuestionIndex === this.collection.questions.length - 1;
        
        actionButtons.innerHTML = `
            <div class="flex justify-between w-full">
                ${question.explanation && question.explanation.trim() !== '' ? `
                    <button id="show-explanation-btn" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all text-sm flex items-center gap-2">
                        <i data-lucide="info" class="w-4 h-4"></i>
                        Ver Explicación
                    </button>
                ` : '<div></div>'}
                <button id="next-question-btn" class="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-md text-sm flex items-center gap-2">
                    <span>${isLastQuestion ? 'Ver Resultados' : 'Siguiente Pregunta'}</span>
                    <i data-lucide="${isLastQuestion ? 'bar-chart' : 'arrow-right'}" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        const nextBtn = actionButtons.querySelector('#next-question-btn');
        nextBtn.addEventListener('click', () => {
            if (isLastQuestion) {
                this.showResults();
            } else {
                this.nextQuestion();
            }
        });
        
        // Event listener para botón de explicación
        const explanationBtn = actionButtons.querySelector('#show-explanation-btn');
        if (explanationBtn && question.explanation && question.explanation.trim() !== '') {
            explanationBtn.addEventListener('click', () => {
                this.showExplanationModal(question.explanation, isCorrect);
            });
        }

        // Actualizar score
        this.updateProgress();

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Muestra un modal con la explicación
     */
    showExplanationModal(explanation, isCorrect) {
        const explanationModal = document.createElement('div');
        explanationModal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4';
        
        explanationModal.innerHTML = `
            <div class="bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl border border-slate-700 p-6">
                <div class="flex items-start gap-3 mb-4">
                    <i data-lucide="${isCorrect ? 'check-circle' : 'info'}" class="w-6 h-6 ${isCorrect ? 'text-emerald-400' : 'text-blue-400'} flex-shrink-0"></i>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-white mb-2">Explicación</h3>
                        <p class="text-slate-300 leading-relaxed">${explanation}</p>
                    </div>
                </div>
                <button id="close-explanation" class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors">
                    Cerrar
                </button>
            </div>
        `;
        
        document.body.appendChild(explanationModal);
        
        // Event listeners
        const closeBtn = explanationModal.querySelector('#close-explanation');
        closeBtn.addEventListener('click', () => document.body.removeChild(explanationModal));
        
        explanationModal.addEventListener('click', (e) => {
            if (e.target === explanationModal) document.body.removeChild(explanationModal);
        });
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Siguiente pregunta
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        this.renderQuestion();
    }

    /**
     * Actualiza el progreso
     */
    updateProgress() {
        const modal = document.getElementById('quiz-study-modal');
        if (!modal) return;

        const currentNum = modal.querySelector('#current-question-num');
        const scoreDisplay = modal.querySelector('#score-display');
        const progressBar = modal.querySelector('#progress-bar');

        currentNum.textContent = this.currentQuestionIndex + 1;
        scoreDisplay.textContent = `${this.stats.correctAnswers} correctas`;
        
        const progress = ((this.currentQuestionIndex + (this.hasAnswered ? 1 : 0)) / this.stats.totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
    }

    /**
     * Muestra los resultados finales
     */
    showResults() {
        const modal = document.getElementById('quiz-study-modal');
        if (!modal) return;

        const timeSpent = Math.floor((Date.now() - this.stats.startTime) / 1000);
        this.stats.timeSpent = timeSpent;

        const accuracy = Math.round((this.stats.correctAnswers / this.stats.totalQuestions) * 100);
        
        // Guardar estadísticas
        this.quizManager.saveQuizStats(this.collection.id, this.stats);

        // Renderizar resultados
        const container = modal.querySelector('#question-container');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <div class="w-24 h-24 rounded-full bg-gradient-to-br ${accuracy >= 70 ? 'from-emerald-500 to-green-600' : 'from-amber-500 to-orange-600'} flex items-center justify-center mb-6">
                    <span class="text-4xl font-bold text-white">${accuracy}%</span>
                </div>

                <h3 class="text-2xl font-bold text-white mb-2">
                    ${accuracy >= 90 ? '¡Excelente!' : accuracy >= 70 ? '¡Bien hecho!' : '¡Sigue practicando!'}
                </h3>
                <p class="text-slate-400 mb-8">Has completado la colección de preguntas</p>

                <div class="grid grid-cols-3 gap-6 w-full max-w-md mb-8">
                    <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                        <div class="text-3xl font-bold text-white mb-1">${this.stats.totalQuestions}</div>
                        <div class="text-xs text-slate-400">Total</div>
                    </div>
                    <div class="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                        <div class="text-3xl font-bold text-emerald-400 mb-1">${this.stats.correctAnswers}</div>
                        <div class="text-xs text-emerald-400">Correctas</div>
                    </div>
                    <div class="bg-red-900/20 border border-red-700 rounded-lg p-4">
                        <div class="text-3xl font-bold text-red-400 mb-1">${this.stats.incorrectAnswers}</div>
                        <div class="text-xs text-red-400">Incorrectas</div>
                    </div>
                </div>

                <div class="text-sm text-slate-400">
                    Tiempo: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s
                </div>
            </div>
        `;

        // Botones finales
        const actionButtons = modal.querySelector('#action-buttons');
        actionButtons.innerHTML = `
            <button id="retry-quiz-btn" class="px-6 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <i data-lucide="rotate-ccw" class="w-4 h-4 inline mr-2"></i>
                Reintentar
            </button>
            <button id="finish-quiz-btn" class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                Finalizar
            </button>
        `;

        const retryBtn = actionButtons.querySelector('#retry-quiz-btn');
        const finishBtn = actionButtons.querySelector('#finish-quiz-btn');

        retryBtn.addEventListener('click', () => {
            this.currentQuestionIndex = 0;
            this.stats = {
                totalQuestions: this.collection.questions.length,
                correctAnswers: 0,
                incorrectAnswers: 0,
                startTime: Date.now()
            };
            this.renderQuestion();
        });

        finishBtn.addEventListener('click', () => this.close());

        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Confirma el cierre si hay preguntas sin responder
     */
    confirmClose() {
        if (this.currentQuestionIndex < this.stats.totalQuestions - 1 || !this.hasAnswered) {
            if (confirm('¿Estás seguro de que quieres salir? Perderás tu progreso.')) {
                this.close();
            }
        } else {
            this.close();
        }
    }

    /**
     * Cierra el modal
     */
    close() {
        const modal = document.getElementById('quiz-study-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }
}

export default QuizStudyModal;
