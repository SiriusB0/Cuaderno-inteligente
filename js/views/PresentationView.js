/**
 * Vista de presentación - Modo diapositivas para navegar entre páginas
 */
class PresentationView {
    constructor(dataManager, router, notifications) {
        this.dataManager = dataManager;
        this.router = router;
        this.notifications = notifications;
        
        this.container = document.getElementById('presentation-view');
        this.slideContent = document.getElementById('slide-content');
        this.slideCounter = document.getElementById('slide-counter');
        
        this.currentSlide = 0;
        this.slides = [];
        this.presentationData = null;
        
        this.initializeEventListeners();
    }
    
    /**
     * Inicializa event listeners de la vista
     */
    initializeEventListeners() {
        // Botones de navegación
        const prevBtn = document.getElementById('prev-slide-btn');
        const nextBtn = document.getElementById('next-slide-btn');
        const exitBtn = document.getElementById('exit-presentation-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitPresentation());
        }
        
        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (this.router.getCurrentView().name === 'presentation') {
                this.handleKeyboard(e);
            }
        });
        
        // Gestos táctiles para móviles
        this.setupTouchGestures();
    }
    
    /**
     * Configura gestos táctiles
     */
    setupTouchGestures() {
        let startX = 0;
        let startY = 0;
        
        if (this.container) {
            this.container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });
            
            this.container.addEventListener('touchend', (e) => {
                if (!startX || !startY) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Solo procesar si el movimiento horizontal es mayor que el vertical
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (Math.abs(diffX) > 50) { // Mínimo 50px de movimiento
                        if (diffX > 0) {
                            this.nextSlide(); // Swipe izquierda = siguiente
                        } else {
                            this.previousSlide(); // Swipe derecha = anterior
                        }
                    }
                }
                
                startX = 0;
                startY = 0;
            });
        }
    }
    
    /**
     * Renderiza la vista de presentación
     */
    render(data) {
        if (!data || !data.pages) {
            console.error('Datos insuficientes para modo presentación');
            return;
        }
        
        this.presentationData = data;
        this.slides = data.pages;
        this.currentSlide = 0;
        
        // Mostrar vista de presentación
        if (this.container) {
            this.container.classList.remove('hidden');
        }
        
        // Ocultar otras vistas
        this.hideOtherViews();
        
        // Renderizar primera diapositiva
        this.renderSlide();
        
        // Mostrar notificación de ayuda
        this.showHelpNotification();
    }
    
    /**
     * Oculta otras vistas
     */
    hideOtherViews() {
        const views = ['subjects-view', 'topics-view', 'study-view'];
        views.forEach(viewId => {
            const view = document.getElementById(viewId);
            if (view) {
                view.classList.add('hidden');
            }
        });
    }
    
    /**
     * Renderiza la diapositiva actual
     */
    renderSlide() {
        const slide = this.slides[this.currentSlide];
        if (!slide || !this.slideContent) return;
        
        // Actualizar contador
        this.updateSlideCounter();
        
        // Renderizar contenido según el tipo
        if (slide.type === 'excalidraw') {
            this.renderExcalidrawSlide(slide);
        } else {
            this.renderTextSlide(slide);
        }
        
        // Animación de entrada
        this.slideContent.classList.add('animate-fade-in');
        setTimeout(() => {
            this.slideContent.classList.remove('animate-fade-in');
        }, 300);
    }
    
    /**
     * Renderiza diapositiva de texto
     */
    renderTextSlide(slide) {
        // Limpiar contenido anterior
        this.slideContent.innerHTML = '';
        
        // Crear contenedor de diapositiva
        const slideDiv = document.createElement('div');
        slideDiv.className = 'w-full max-w-4xl mx-auto';
        
        // Título de la diapositiva
        if (slide.title) {
            const title = document.createElement('h1');
            title.className = 'text-4xl font-bold mb-8 text-center text-white';
            title.textContent = slide.title;
            slideDiv.appendChild(title);
        }
        
        // Contenido de la diapositiva
        const content = document.createElement('div');
        content.className = 'prose prose-lg prose-invert max-w-none text-center';
        content.innerHTML = this.formatSlideContent(slide.content || '');
        slideDiv.appendChild(content);
        
        this.slideContent.appendChild(slideDiv);
    }
    
    /**
     * Renderiza diapositiva de Excalidraw
     */
    renderExcalidrawSlide(slide) {
        // Limpiar contenido anterior
        this.slideContent.innerHTML = '';
        
        // Crear contenedor
        const slideDiv = document.createElement('div');
        slideDiv.className = 'w-full h-full flex flex-col items-center justify-center';
        
        // Título
        if (slide.title) {
            const title = document.createElement('h1');
            title.className = 'text-3xl font-bold mb-6 text-white';
            title.textContent = slide.title;
            slideDiv.appendChild(title);
        }
        
        // Contenedor para el canvas
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'bg-white rounded-lg p-4 max-w-4xl max-h-96 overflow-hidden';
        
        try {
            if (slide.content && slide.content !== '{}') {
                const excalidrawData = JSON.parse(slide.content);
                
                // Crear una representación estática del dibujo
                const canvas = document.createElement('canvas');
                canvas.width = 800;
                canvas.height = 400;
                canvas.className = 'w-full h-auto';
                
                // Aquí se podría implementar la renderización del contenido de Excalidraw
                // Por ahora, mostrar un placeholder
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#6b7280';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Canvas de Ideas', canvas.width / 2, canvas.height / 2);
                
                canvasContainer.appendChild(canvas);
            } else {
                // Canvas vacío
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-64 flex items-center justify-center text-gray-500';
                placeholder.innerHTML = `
                    <div class="text-center">
                        <i data-lucide="lightbulb" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                        <p>Canvas de ideas vacío</p>
                    </div>
                `;
                canvasContainer.appendChild(placeholder);
            }
        } catch (error) {
            console.error('Error renderizando canvas de Excalidraw:', error);
            canvasContainer.innerHTML = `
                <div class="w-full h-64 flex items-center justify-center text-red-500">
                    <p>Error cargando el canvas</p>
                </div>
            `;
        }
        
        slideDiv.appendChild(canvasContainer);
        this.slideContent.appendChild(slideDiv);
        
        // Actualizar iconos
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Formatea el contenido para presentación
     */
    formatSlideContent(html) {
        // Crear un div temporal para procesar el HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Procesar elementos específicos para presentación
        
        // Hacer títulos más grandes
        temp.querySelectorAll('h1').forEach(h1 => {
            h1.className = 'text-5xl font-bold mb-8 text-white';
        });
        
        temp.querySelectorAll('h2').forEach(h2 => {
            h2.className = 'text-4xl font-semibold mb-6 text-white';
        });
        
        temp.querySelectorAll('h3').forEach(h3 => {
            h3.className = 'text-3xl font-medium mb-4 text-white';
        });
        
        // Hacer párrafos más legibles
        temp.querySelectorAll('p').forEach(p => {
            p.className = 'text-xl mb-4 text-gray-200 leading-relaxed';
        });
        
        // Hacer listas más visibles
        temp.querySelectorAll('ul, ol').forEach(list => {
            list.className = 'text-xl text-gray-200 mb-6 space-y-2';
        });
        
        temp.querySelectorAll('li').forEach(li => {
            li.className = 'mb-2';
        });
        
        // Procesar cajas desplegables - expandirlas automáticamente
        temp.querySelectorAll('.collapsible-box').forEach(box => {
            box.classList.add('expanded');
            const header = box.querySelector('.collapsible-header');
            const content = box.querySelector('.collapsible-content');
            
            if (header && content) {
                // Convertir en un bloque normal para presentación
                const newDiv = document.createElement('div');
                newDiv.className = 'bg-white bg-opacity-10 rounded-lg p-6 mb-6';
                
                const title = document.createElement('h3');
                title.className = 'text-2xl font-semibold mb-4 text-white';
                title.textContent = header.textContent;
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'text-lg text-gray-200';
                contentDiv.innerHTML = content.innerHTML;
                
                newDiv.appendChild(title);
                newDiv.appendChild(contentDiv);
                
                box.parentNode.replaceChild(newDiv, box);
            }
        });
        
        return temp.innerHTML;
    }
    
    /**
     * Actualiza el contador de diapositivas
     */
    updateSlideCounter() {
        if (this.slideCounter) {
            this.slideCounter.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
        }
    }
    
    /**
     * Va a la diapositiva anterior
     */
    previousSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.renderSlide();
        }
    }
    
    /**
     * Va a la siguiente diapositiva
     */
    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.renderSlide();
        }
    }
    
    /**
     * Va a una diapositiva específica
     */
    goToSlide(index) {
        if (index >= 0 && index < this.slides.length) {
            this.currentSlide = index;
            this.renderSlide();
        }
    }
    
    /**
     * Sale del modo presentación
     */
    exitPresentation() {
        // Ocultar vista de presentación
        if (this.container) {
            this.container.classList.add('hidden');
        }
        
        // Volver a la vista de estudio
        this.router.navigateTo('study', {
            subject: this.presentationData.subject,
            topic: this.presentationData.topic
        });
    }
    
    /**
     * Maneja atajos de teclado
     */
    handleKeyboard(e) {
        switch (e.key) {
            case 'ArrowRight':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                this.nextSlide();
                break;
                
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                this.previousSlide();
                break;
                
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
                
            case 'End':
                e.preventDefault();
                this.goToSlide(this.slides.length - 1);
                break;
                
            case 'Escape':
            case 'F11':
                e.preventDefault();
                this.exitPresentation();
                break;
                
            // Números para ir a diapositiva específica
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                const slideNum = parseInt(e.key) - 1;
                if (slideNum < this.slides.length) {
                    this.goToSlide(slideNum);
                }
                break;
        }
    }
    
    /**
     * Muestra notificación de ayuda
     */
    showHelpNotification() {
        const helpText = `
            Modo Presentación activado
            • Flechas o Espacio: Navegar
            • Números 1-9: Ir a diapositiva
            • Escape: Salir
        `;
        
        this.notifications.info(helpText, 5000);
    }
    
    /**
     * Entra en modo presentación desde otra vista
     */
    enter() {
        // Esta función se puede llamar desde otras vistas para entrar en modo presentación
        const currentView = this.router.getCurrentView();
        if (currentView.name === 'study' && currentView.data) {
            this.render(currentView.data);
        }
    }
}

export default PresentationView;
