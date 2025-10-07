// ===== REEMPLAZAR insertCodeBlock() en StudyView.js con esto =====

insertCodeBlock() {
    const blockId = `code-block-${Date.now()}`;
    
    const html = `
        <div class="hljs-code-block" id="${blockId}" contenteditable="false">
            <div class="code-header">
                <select class="lang-selector">
                    <option value="cpp">C++</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="xml">HTML</option>
                    <option value="css">CSS</option>
                    <option value="php">PHP</option>
                    <option value="sql">SQL</option>
                </select>
                <button class="copy-btn"><i data-lucide="copy" class="w-4 h-4"></i></button>
                <button class="delete-btn"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
            <div class="code-display">
                <textarea class="code-input" spellcheck="false" placeholder="Escribe tu código..."></textarea>
                <pre class="code-highlight"><code class="cpp"></code></pre>
            </div>
        </div>
        <p><br></p>
    `;

    this.insertHTML(html);
    this.injectWorkingCodeStyles();
    
    setTimeout(() => {
        const block = document.getElementById(blockId);
        if (!block) return;
        
        const input = block.querySelector('.code-input');
        const highlight = block.querySelector('.code-highlight code');
        const langSelect = block.querySelector('.lang-selector');
        const copyBtn = block.querySelector('.copy-btn');
        const deleteBtn = block.querySelector('.delete-btn');
        
        const render = () => {
            highlight.textContent = input.value;
            delete highlight.dataset.highlighted;
            if (window.hljs) hljs.highlightElement(highlight);
            this.handleTextChange();
        };
        
        // Sincronizar scroll
        input.addEventListener('scroll', () => {
            const pre = highlight.parentElement;
            pre.scrollTop = input.scrollTop;
            pre.scrollLeft = input.scrollLeft;
        });
        
        // Actualizar al escribir
        input.addEventListener('input', render);
        
        // Cambiar lenguaje
        langSelect.addEventListener('change', (e) => {
            highlight.className = e.target.value;
            render();
        });
        
        // Copiar
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(input.value);
            this.notifications.success('Copiado');
        });
        
        // Eliminar
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Eliminar?')) {
                block.remove();
                this.handleTextChange();
            }
        });
        
        render();
        
        if (window.lucide) window.lucide.createIcons();
    }, 100);
}

// ===== AGREGAR ESTA NUEVA FUNCIÓN DESPUÉS DE insertCodeBlock() =====

injectWorkingCodeStyles() {
    if (document.getElementById('working-code-styles')) return;
    
    const styleTag = document.createElement('style');
    styleTag.id = 'working-code-styles';
    styleTag.textContent = `
        .hljs-code-block {
            margin: 1rem 0;
            border-radius: 8px;
            overflow: hidden;
            background: #252526;
            border: 1px solid #333;
        }
        
        .hljs-code-block .code-header {
            background: #333;
            padding: 10px;
            display: flex;
            gap: 10px;
            align-items: center;
            border-bottom: 1px solid #444;
        }
        
        .hljs-code-block .lang-selector {
            background: #555;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .hljs-code-block .copy-btn,
        .hljs-code-block .delete-btn {
            background: #555;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .hljs-code-block .copy-btn:hover,
        .hljs-code-block .delete-btn:hover {
            background: #666;
        }
        
        .hljs-code-block .code-display {
            position: relative;
            width: 100%;
            min-height: 200px;
            background: #1e1e1e;
            padding: 15px;
            box-sizing: border-box;
        }
        
        .hljs-code-block .code-input {
            position: absolute;
            top: 1.5em;
            left: 0;
            width: 100%;
            height: calc(100% - 1.5em);
            background: transparent;
            color: transparent;
            caret-color: white;
            border: none;
            padding: 0;
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            outline: none;
            resize: none;
            z-index: 2;
            overflow: auto;
            white-space: pre;
            word-wrap: normal;
            -webkit-text-fill-color: transparent;
            box-sizing: border-box;
        }
        
        .hljs-code-block .code-highlight {
            position: absolute;
            top: 1.5em;
            left: 0;
            width: 100%;
            height: calc(100% - 1.5em);
            padding: 0;
            margin: 0;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            pointer-events: none;
            z-index: 1;
            white-space: pre;
            overflow: auto;
            word-wrap: normal;
            box-sizing: border-box;
        }
        
        .hljs-code-block pre {
            margin: 0;
            background: transparent;
            padding: 0;
        }
        
        .hljs-code-block code {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            display: block;
            padding: 0;
            margin: 0;
        }
        
        /* Override de highlight.js */
        .hljs-code-block pre code.hljs,
        .hljs-code-block code.hljs {
            padding: 0 !important;
            margin: 0 !important;
            font-family: 'Consolas', 'Monaco', monospace !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
        }
    `;
    
    document.head.appendChild(styleTag);
}
