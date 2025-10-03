// --- SISTEMA DE NOTIFICACIONES ---
class NotificationManager {
    static show(message, type = 'success', duration = 3000) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => container.removeChild(notification), 300);
        }, duration);
    }
}

// --- VALIDACIÓN Y SANITIZACIÓN ---
class DataValidator {
    static sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    
    static validateSubjectName(name) {
        return name && name.trim().length > 0 && name.trim().length <= 100;
    }
    
    static validateTopicName(name) {
        return name && name.trim().length > 0 && name.trim().length <= 100;
    }
}

// --- SIMULACIÓN DE BASE DE DATOS ---
let db = {
    subjects: [
        { id: 1, name: "Cálculo I", imageUrl: "https://placehold.co/600x400/6366f1/ffffff?text=Cálculo" },
        { id: 2, name: "Programación Orientada a Objetos", imageUrl: "https://placehold.co/600x400/ec4899/ffffff?text=POO" },
        { id: 3, name: "Física de Ondas", imageUrl: "https://placehold.co/600x400/22c55e/ffffff?text=Física" }
    ],
    topics: [
        { id: 101, subjectId: 1, name: "Derivadas", imageUrl: "https://placehold.co/600x400/818cf8/ffffff?text=f'(x)" },
        { id: 102, subjectId: 1, name: "Integrales", imageUrl: "https://placehold.co/600x400/a78bfa/ffffff?text=∫f(x)dx" },
        { id: 201, subjectId: 2, name: "Pilares de POO", imageUrl: "https://placehold.co/600x400/f472b6/ffffff?text=Herencia" },
    ],
    pages: {
        101: [
            { id: 1011, content: "<h1>Concepto de la Derivada</h1><p>La derivada de una función matemática es la razón o velocidad de cambio de una función en un determinado punto.</p>" },
            { id: 1012, content: "<h2>Reglas de Derivación</h2><ul><li>Regla de la potencia</li><li>Regla del producto</li></ul>" },
        ],
        102: [{ id: 1021, content: "<h1>Integrales Definidas</h1><p>...</p>" }],
        201: [{ id: 2011, content: "<h1>Encapsulamiento</h1><p>...</p>" }],
    },
    resources: {
        101: [
            { id: 1, name: "guia_derivadas.pdf", type: "pdf" },
            { id: 2, name: "formulas.txt", type: "txt" },
        ]
    }
};

// --- ESTADO DE LA APLICACIÓN ---
let activeSubjectId = null;
let activeTopicId = null;
let activePageIndex = 0;

// --- SELECTORES DE ELEMENTOS DEL DOM ---
const views = {
    subjects: document.getElementById('subjects-view'),
    topics: document.getElementById('topics-view'),
    study: document.getElementById('study-view'),
};
const subjectsGrid = document.getElementById('subjects-grid');
const topicsGrid = document.getElementById('topics-grid');
const pagesList = document.getElementById('pages-list');
const editorContent = document.getElementById('editor-content');

// --- FUNCIONES DE NAVEGACIÓN Y RENDERIZADO ---
function navigateTo(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
        if(viewName === 'study') views[viewName].classList.add('flex');
    }
}

function renderSubjects() {
    subjectsGrid.innerHTML = '';
    db.subjects.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'subject-card cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden';
        card.innerHTML = `
            <img src="${subject.imageUrl}" alt="${subject.name}" class="w-full h-32 object-cover">
            <div class="p-4">
                <h3 class="font-bold text-lg">${subject.name}</h3>
            </div>
        `;
        card.addEventListener('click', () => selectSubject(subject.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectSubject(subject.id);
            }
        });
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Abrir materia ${subject.name}`);
        subjectsGrid.appendChild(card);
    });
}

function renderTopics(subjectId) {
    try {
        const subject = db.subjects.find(s => s.id === subjectId);
        if (!subject) throw new Error('Materia no encontrada');
        
        document.getElementById('topic-view-title').textContent = subject.name;
        topicsGrid.innerHTML = '';
        
        const topics = db.topics.filter(t => t.subjectId === subjectId);
        if (topics.length === 0) {
            topicsGrid.innerHTML = '<p class="col-span-full text-center text-gray-500">No hay temas en esta materia aún.</p>';
            return;
        }
        
        topics.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden';
            card.innerHTML = `
                <img src="${topic.imageUrl}" alt="${topic.name}" class="w-full h-32 object-cover">
                <div class="p-4">
                    <h3 class="font-bold text-lg">${topic.name}</h3>
                </div>
            `;
            card.addEventListener('click', () => selectTopic(topic.id));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectTopic(topic.id);
                }
            });
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Abrir tema ${topic.name}`);
            topicsGrid.appendChild(card);
        });
    } catch (error) {
        NotificationManager.show('Error al cargar los temas', 'error');
        console.error(error);
    }
}

function renderStudyView(topicId) {
    try {
        const topic = db.topics.find(t => t.id === topicId);
        const subject = db.subjects.find(s => s.id === topic.subjectId);
        
        if (!topic || !subject) throw new Error('Tema o materia no encontrados');
        
        document.getElementById('study-view-title').textContent = topic.name;
        document.getElementById('study-view-breadcrumb').textContent = `En ${subject.name}`;
        
        if (!db.pages[topicId]) {
            db.pages[topicId] = [{ 
                id: Date.now(), 
                content: `<h1>${topic.name}</h1><p>Empieza a escribir tus apuntes aquí...</p>` 
            }];
        }
        
        activePageIndex = 0;
        renderPagesList();
        renderEditorContent();
        renderResources();
    } catch (error) {
        NotificationManager.show('Error al cargar la vista de estudio', 'error');
        console.error(error);
    }
}

// Continúa en el siguiente archivo...
