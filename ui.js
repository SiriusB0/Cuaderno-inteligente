// --- FUNCIONES DE RENDERIZADO CONTINUADAS ---
function renderPagesList() {
    pagesList.innerHTML = '';
    const pages = db.pages[activeTopicId] || [];
    
    if (pages.length === 0) {
        pagesList.innerHTML = '<p class="text-xs text-center text-gray-400">No hay páginas aún</p>';
        return;
    }
    
    pages.forEach((page, index) => {
        const thumb = document.createElement('div');
        thumb.className = `page-thumbnail cursor-pointer p-2 rounded-md bg-white dark:bg-gray-700 shadow-sm ${index === activePageIndex ? 'active' : ''}`;
        thumb.innerHTML = `<p class="text-sm font-medium">Página ${index + 1}</p>`;
        thumb.addEventListener('click', () => switchToPage(index));
        thumb.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchToPage(index);
            }
        });
        thumb.setAttribute('tabindex', '0');
        thumb.setAttribute('role', 'button');
        thumb.setAttribute('aria-label', `Ir a página ${index + 1}`);
        pagesList.appendChild(thumb);
    });
}

function renderEditorContent() {
    const pages = db.pages[activeTopicId] || [];
    const content = pages[activePageIndex]?.content || '';
    editorContent.innerHTML = content;
    editorManager?.updateToolbarState();
}

function renderResources() {
    const resourceList = document.getElementById('resource-list');
    resourceList.innerHTML = '';
    const resources = db.resources[activeTopicId] || [];
    
    if (resources.length === 0) {
        resourceList.innerHTML = `<p class="text-xs text-center text-gray-400">No hay recursos adjuntos.</p>`;
        return;
    }
    
    resources.forEach(res => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2 rounded-md bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600';
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="file-text" class="w-4 h-4 text-indigo-500"></i>
                <span class="text-sm truncate">${res.name}</span>
            </div>
        `;
        item.addEventListener('click', () => viewResource(res));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                viewResource(res);
            }
        });
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `Ver recurso ${res.name}`);
        resourceList.appendChild(item);
    });
    lucide.createIcons();
}

// --- MANEJO DE ESTADO Y DATOS ---
function selectSubject(id) {
    try {
        if (!db.subjects.find(s => s.id === id)) {
            throw new Error('Materia no encontrada');
        }
        activeSubjectId = id;
        renderTopics(id);
        navigateTo('topics');
    } catch (error) {
        NotificationManager.show('Error al seleccionar materia', 'error');
        console.error(error);
    }
}

function selectTopic(id) {
    try {
        if (!db.topics.find(t => t.id === id)) {
            throw new Error('Tema no encontrado');
        }
        activeTopicId = id;
        renderStudyView(id);
        navigateTo('study');
    } catch (error) {
        NotificationManager.show('Error al seleccionar tema', 'error');
        console.error(error);
    }
}

function switchToPage(index) {
    try {
        editorManager?.saveCurrentPage();
        activePageIndex = index;
        renderPagesList();
        renderEditorContent();
        editorContent.focus();
    } catch (error) {
        NotificationManager.show('Error al cambiar de página', 'error');
        console.error(error);
    }
}

function addPage() {
    try {
        if (!activeTopicId) throw new Error('No hay tema activo');
        
        const newPage = { 
            id: Date.now(), 
            content: `<p>Nueva página...</p>`
        };
        
        if (!db.pages[activeTopicId]) {
            db.pages[activeTopicId] = [];
        }
        
        db.pages[activeTopicId].push(newPage);
        editorManager?.saveCurrentPage();
        activePageIndex = db.pages[activeTopicId].length - 1;
        renderPagesList();
        renderEditorContent();
        editorContent.focus();
        
        NotificationManager.show('Nueva página creada');
    } catch (error) {
        NotificationManager.show('Error al crear página', 'error');
        console.error(error);
    }
}

function addSubject() {
    const name = prompt('Nombre de la nueva materia:');
    if (!name || !DataValidator.validateSubjectName(name)) {
        NotificationManager.show('Nombre de materia inválido', 'error');
        return;
    }
    
    try {
        const newSubject = {
            id: Date.now(),
            name: name.trim(),
            imageUrl: `https://placehold.co/600x400/6366f1/ffffff?text=${encodeURIComponent(name.trim())}`
        };
        
        db.subjects.push(newSubject);
        renderSubjects();
        NotificationManager.show('Materia creada correctamente');
    } catch (error) {
        NotificationManager.show('Error al crear materia', 'error');
        console.error(error);
    }
}

function addTopic() {
    if (!activeSubjectId) {
        NotificationManager.show('No hay materia seleccionada', 'error');
        return;
    }
    
    const name = prompt('Nombre del nuevo tema:');
    if (!name || !DataValidator.validateTopicName(name)) {
        NotificationManager.show('Nombre de tema inválido', 'error');
        return;
    }
    
    try {
        const newTopic = {
            id: Date.now(),
            subjectId: activeSubjectId,
            name: name.trim(),
            imageUrl: `https://placehold.co/600x400/818cf8/ffffff?text=${encodeURIComponent(name.trim())}`
        };
        
        db.topics.push(newTopic);
        renderTopics(activeSubjectId);
        NotificationManager.show('Tema creado correctamente');
    } catch (error) {
        NotificationManager.show('Error al crear tema', 'error');
        console.error(error);
    }
}
