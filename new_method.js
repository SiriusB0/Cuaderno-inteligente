    /**
     * Inserta un bloque de código editable con CodeMirror v5
     */
    insertCodeBlock() {
        // Generar ID único para el contenedor
        const codeId = 'codemirror-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        const html = `
            <div class="code-block-container my-3 relative rounded-lg border border-gray-600 overflow-hidden" contenteditable="false" id="${codeId}" style="background-color: #282a36;">
                <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700" style="background-color: #44475a;">
                    <select class="language-selector text-xs px-2 py-1 rounded border border-gray-600" style="background-color: #6272a4; color: #f8f8f2; border: none; outline: none;">
                        <option value="text">Texto</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="clike">C/C++</option>
                        <option value="htmlmixed">HTML</option>
                        <option value="css">CSS</option>
                        <option value="xml">XML</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="go">Go</option>
                        <option value="sql">SQL</option>
                    </select>
                    <div class="flex items-center gap-2">
                        <button class="copy-code-btn px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded" title="Copiar código">
                            <i data-lucide="copy" class="w-3 h-3"></i>
                        </button>
                        <button class="delete-code-btn px-2 py-1 text-xs text-gray-400 hover:text-red-400 transition-colors rounded" title="Eliminar bloque">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                    </div>
                </div>
                <div class="codemirror-wrapper" style="min-height: 300px;"></div>
            </div>
            <p><br></p>
        `;

        // Insertar el bloque de código
        this.insertHTML(html);

        // Inicializar CodeMirror después de insertar
        setTimeout(() => {
            const container = document.getElementById(codeId);
            if (!container || !window.CodeMirror) return;

            const wrapper = container.querySelector('.codemirror-wrapper');
            const languageSelector = container.querySelector('.language-selector');
            const copyBtn = container.querySelector('.copy-code-btn');
            const deleteBtn = container.querySelector('.delete-code-btn');

            // Código inicial por defecto
            let defaultCode = '';
            let defaultMode = 'text';

            // Detectar si hay selección de texto para usar como código inicial
            const selection = window.getSelection();
            if (selection.toString().trim()) {
                defaultCode = selection.toString();
                // Intentar detectar el lenguaje basado en el contenido
                if (defaultCode.includes('function') || defaultCode.includes('const ') || defaultCode.includes('let ')) {
                    defaultMode = 'javascript';
                    languageSelector.value = 'javascript';
                } else if (defaultCode.includes('def ') || defaultCode.includes('import ') || defaultCode.includes('print(')) {
                    defaultMode = 'python';
                    languageSelector.value = 'python';
                } else if (defaultCode.includes('#include') || defaultCode.includes('int main') || defaultCode.includes('cout')) {
                    defaultMode = 'clike';
                    languageSelector.value = 'clike';
                } else if (defaultCode.includes('<') && defaultCode.includes('>')) {
                    defaultMode = 'htmlmixed';
                    languageSelector.value = 'htmlmixed';
                }
            } else {
                // Código de ejemplo según el lenguaje seleccionado inicialmente
                const examples = {
                    javascript: `function ejemplo() {
    // Tu código JavaScript aquí
    console.log("Hola mundo");
    return "Hola mundo";
}`,
                    python: `def ejemplo():
    # Tu código Python aquí
    print("Hola mundo")
    return "Hola mundo"`,
                    clike: `#include <iostream>

int main() {
    // Tu código C++ aquí
    std::cout << "Hola mundo" << std::endl;
    return 0;
}`,
                    htmlmixed: `<!DOCTYPE html>
<html>
<head>
    <title>Ejemplo</title>
</head>
<body>
    <!-- Tu código HTML aquí -->
    <h1>Hola mundo</h1>
    <p>Esto es un párrafo.</p>
</body>
</html>`,
                    css: `/* Tu código CSS aquí */
.ejemplo {
    color: #f8f8f2;
    background-color: #282a36;
    padding: 10px;
}`,
                    text: '// Escribe tu código aquí...'
                };
                defaultCode = examples[defaultMode] || '// Escribe tu código aquí...';
            }

            // Crear instancia de CodeMirror
            const cm = CodeMirror(wrapper, {
                value: defaultCode,
                mode: defaultMode,
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true,
                indentUnit: 4,
                tabSize: 4,
                indentWithTabs: false,
                electricChars: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                readOnly: false,
                viewportMargin: Infinity, // Para que sea scrollable
                extraKeys: {
                    'Ctrl-Space': 'autocomplete',
                    'Tab': function(cm) {
                        if (cm.somethingSelected()) {
                            cm.indentSelection('add');
                        } else {
                            cm.replaceSelection('    ', 'end');
                        }
                    },
                    'Shift-Tab': function(cm) {
                        cm.indentSelection('subtract');
                    },
                    'Esc': function(cm) {
                        // Salir del foco si está en el editor
                        cm.getInputField().blur();
                    }
                }
            });

            // Establecer altura mínima
            cm.setSize('100%', '300px');
            cm.refresh(); // Refrescar para aplicar cambios

            // Función para obtener el modo correcto según el lenguaje
            const getModeForLanguage = (language) => {
                const modeMap = {
                    javascript: 'javascript',
                    python: 'python',
                    clike: 'text/x-c++src', // Para C++
                    htmlmixed: 'htmlmixed',
                    css: 'css',
                    xml: 'xml',
                    php: 'php',
                    ruby: 'ruby',
                    go: 'go',
                    sql: 'sql',
                    text: 'text'
                };
                return modeMap[language] || 'text';
            };

            // Event listener para cambio de lenguaje
            languageSelector.addEventListener('change', (e) => {
                const newMode = getModeForLanguage(e.target.value);
                cm.setOption('mode', newMode);
                cm.refresh();
            });

            // Event listener para copiar
            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const code = cm.getValue();

                if (navigator.clipboard) {
                    navigator.clipboard.writeText(code).then(() => {
                        const originalIcon = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i data-lucide="check" class="w-3 h-3 text-green-400"></i>';

                        setTimeout(() => {
                            copyBtn.innerHTML = originalIcon;
                            if (window.lucide) window.lucide.createIcons();
                        }, 2000);
                    }).catch(err => {
                        console.error('Error al copiar:', err);
                        this.showFallbackCopy(copyBtn, code);
                    });
                } else {
                    this.showFallbackCopy(copyBtn, code);
                }
            });

            // Event listener para eliminar
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                    this.handleTextChange();
                }
            });

            // Event listener para cambios en el código
            cm.on('change', () => {
                this.handleTextChange();
            });

            // Hacer foco en el editor inmediatamente
            setTimeout(() => {
                cm.focus();
                cm.setCursor(cm.lineCount(), 0); // Ir al final
            }, 100);

            // Actualizar iconos de Lucide
            if (window.lucide) {
                window.lucide.createIcons();
            }

        }, 50);
    }
