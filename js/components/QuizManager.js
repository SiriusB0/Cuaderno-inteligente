/**
 * Gestor de Quizzes - Sistema de preguntas multiple choice
 */
class QuizManager {
    constructor(dataManager, notifications) {
        this.dataManager = dataManager;
        this.notifications = notifications;
        
        this.initializeQuizData();
    }

    /**
     * Inicializa la estructura de datos de quizzes
     */
    initializeQuizData() {
        if (!this.dataManager.data.quizCollections) {
            this.dataManager.data.quizCollections = {};
        }
        if (!this.dataManager.data.quizStats) {
            this.dataManager.data.quizStats = {};
        }
    }

    /**
     * Crea una nueva colección de quizzes
     */
    createQuizCollection(topicId, name, description = '') {
        const collectionId = `quiz_${Date.now()}`;
        
        const collection = {
            id: collectionId,
            topicId: topicId,
            name: name,
            description: description,
            questions: [],
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!this.dataManager.data.quizCollections[topicId]) {
            this.dataManager.data.quizCollections[topicId] = [];
        }

        this.dataManager.data.quizCollections[topicId].push(collection);
        this.dataManager.save();
        this.dataManager.emit('quizCollectionCreated', { collectionId, topicId });

        return collection;
    }

    /**
     * Parsea preguntas en formato batch
     * Formato:
     * pregunta: ¿Cuál es la capital de Francia?
     * opcion a: Rusia
     * opcion b: Paris
     * opcion c: Bogotá
     * opcion d: Madrid
     * respuesta: b
     */
    parseBatchQuestions(text) {
        const questions = [];
        const blocks = text.trim().split(/\n\s*\n/); // Separar por líneas en blanco

        for (const block of blocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 6) continue; // Necesita al menos 6 líneas

            const question = {
                id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                question: '',
                options: { a: '', b: '', c: '', d: '' },
                correctAnswer: '',
                explanation: ''
            };

            for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (trimmedLine.match(/^pregunta:\s*/i)) {
                    question.question = trimmedLine.replace(/^pregunta:\s*/i, '').trim();
                } else if (trimmedLine.match(/^opci[oó]n\s+a:\s*/i)) {
                    question.options.a = trimmedLine.replace(/^opci[oó]n\s+a:\s*/i, '').trim();
                } else if (trimmedLine.match(/^opci[oó]n\s+b:\s*/i)) {
                    question.options.b = trimmedLine.replace(/^opci[oó]n\s+b:\s*/i, '').trim();
                } else if (trimmedLine.match(/^opci[oó]n\s+c:\s*/i)) {
                    question.options.c = trimmedLine.replace(/^opci[oó]n\s+c:\s*/i, '').trim();
                } else if (trimmedLine.match(/^opci[oó]n\s+d:\s*/i)) {
                    question.options.d = trimmedLine.replace(/^opci[oó]n\s+d:\s*/i, '').trim();
                } else if (trimmedLine.match(/^respuesta:\s*/i)) {
                    question.correctAnswer = trimmedLine.replace(/^respuesta:\s*/i, '').trim().toLowerCase();
                } else if (trimmedLine.match(/^explicaci[oó]n:\s*/i)) {
                    question.explanation = trimmedLine.replace(/^explicaci[oó]n:\s*/i, '').trim();
                }
            }

            // Validar que la pregunta esté completa
            if (question.question && 
                question.options.a && 
                question.options.b && 
                question.options.c && 
                question.options.d && 
                question.correctAnswer &&
                ['a', 'b', 'c', 'd'].includes(question.correctAnswer)) {
                questions.push(question);
            }
        }

        return questions;
    }

    /**
     * Añade preguntas a una colección
     */
    addQuestionsToCollection(collectionId, topicId, questions) {
        const collections = this.dataManager.data.quizCollections[topicId];
        if (!collections) return false;

        const collection = collections.find(c => c.id === collectionId);
        if (!collection) return false;

        collection.questions.push(...questions);
        collection.updatedAt = new Date().toISOString();
        
        this.dataManager.save();
        this.dataManager.emit('quizQuestionsAdded', { collectionId, topicId, count: questions.length });

        return true;
    }

    /**
     * Obtiene todas las colecciones de un tema
     */
    getCollectionsByTopic(topicId) {
        return this.dataManager.data.quizCollections[topicId] || [];
    }

    /**
     * Obtiene una colección específica
     */
    getCollection(collectionId, topicId) {
        const collections = this.dataManager.data.quizCollections[topicId];
        if (!collections) return null;

        return collections.find(c => c.id === collectionId);
    }

    /**
     * Fija/desfija una colección
     */
    togglePinCollection(collectionId, topicId) {
        const collections = this.dataManager.data.quizCollections[topicId];
        if (!collections) return false;

        const collection = collections.find(c => c.id === collectionId);
        if (!collection) return false;

        collection.isPinned = !collection.isPinned;
        this.dataManager.save();
        this.dataManager.emit('quizCollectionPinned', { collectionId, topicId, isPinned: collection.isPinned });

        return collection.isPinned;
    }

    /**
     * Elimina una colección
     */
    deleteCollection(collectionId, topicId) {
        const collections = this.dataManager.data.quizCollections[topicId];
        if (!collections) return false;

        const index = collections.findIndex(c => c.id === collectionId);
        if (index === -1) return false;

        collections.splice(index, 1);
        
        // Eliminar estadísticas asociadas
        if (this.dataManager.data.quizStats[collectionId]) {
            delete this.dataManager.data.quizStats[collectionId];
        }

        this.dataManager.save();
        this.dataManager.emit('quizCollectionDeleted', { collectionId, topicId });

        return true;
    }

    /**
     * Guarda estadísticas de una sesión de estudio
     */
    saveQuizStats(collectionId, stats) {
        if (!this.dataManager.data.quizStats[collectionId]) {
            this.dataManager.data.quizStats[collectionId] = [];
        }

        const sessionStats = {
            date: new Date().toISOString(),
            totalQuestions: stats.totalQuestions,
            correctAnswers: stats.correctAnswers,
            incorrectAnswers: stats.incorrectAnswers,
            accuracy: Math.round((stats.correctAnswers / stats.totalQuestions) * 100),
            timeSpent: stats.timeSpent || 0
        };

        this.dataManager.data.quizStats[collectionId].push(sessionStats);
        this.dataManager.save();
        this.dataManager.emit('quizStatsUpdated', { collectionId, stats: sessionStats });

        return sessionStats;
    }

    /**
     * Obtiene las últimas estadísticas de una colección
     */
    getLastStats(collectionId) {
        const stats = this.dataManager.data.quizStats[collectionId];
        if (!stats || stats.length === 0) return null;

        return stats[stats.length - 1];
    }

    /**
     * Obtiene todas las estadísticas de una colección
     */
    getAllStats(collectionId) {
        return this.dataManager.data.quizStats[collectionId] || [];
    }

    /**
     * Obtiene todas las colecciones de una materia (por todos sus temas)
     */
    getCollectionsBySubject(subjectId) {
        const topics = this.dataManager.getTopics(subjectId);
        const allCollections = [];

        for (const topic of topics) {
            const collections = this.getCollectionsByTopic(topic.id);
            for (const collection of collections) {
                allCollections.push({
                    ...collection,
                    topicName: topic.name
                });
            }
        }

        // Ordenar: primero las fijadas, luego por fecha
        return allCollections.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
    }

    /**
     * Actualiza una colección
     */
    updateCollection(collectionId, topicId, updates) {
        const collections = this.dataManager.data.quizCollections[topicId];
        if (!collections) return false;

        const collection = collections.find(c => c.id === collectionId);
        if (!collection) return false;

        Object.assign(collection, updates);
        collection.updatedAt = new Date().toISOString();

        this.dataManager.save();
        this.dataManager.emit('quizCollectionUpdated', { collectionId, topicId });

        return true;
    }
}

export default QuizManager;
