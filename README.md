# 📚 Cuaderno Inteligente

Sistema inteligente de gestión de estudios con **asistente IA integrado**.

## ✨ Características

### 📖 Gestión de Estudios
- ✅ Organización por materias, temas y páginas
- ✅ Editor de texto enriquecido con formato completo
- ✅ Soporte para diagramas (Excalidraw)
- ✅ Gestión de recursos (PDFs, imágenes, audio, video)
- ✅ Sistema de eventos y fechas de entrega
- ✅ Técnica Pomodoro integrada
- ✅ Exportación a PDF
- ✅ Sincronización con Supabase

### 🤖 Asistente IA (NUEVO)
- ✅ Chat contextual por tema
- ✅ RAG (Retrieval Augmented Generation) ligero
- ✅ Búsqueda semántica en tus recursos
- ✅ Respuestas basadas en tus apuntes y PDFs
- ✅ Citas de fuentes
- ✅ Optimizado para bajo costo (~$0.10/mes)

## 🚀 Quick Start

### Sin IA (solo app de estudio)

```bash
# Clonar
git clone https://github.com/tuusuario/Cuaderno-inteligente.git
cd Cuaderno-inteligente

# Desplegar a Vercel
vercel --prod
```

### Con IA (recomendado)

Ver: **[IA-QUICKSTART.md](IA-QUICKSTART.md)** (10 minutos)

## 📖 Documentación

- **[IA-QUICKSTART.md](IA-QUICKSTART.md)** - Setup rápido del asistente IA
- **[docs/IA-SETUP.md](docs/IA-SETUP.md)** - Documentación completa de IA
- **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)** - Arquitectura del sistema
- **[scripts/README.md](scripts/README.md)** - Uso de scripts de ingesta

## 🛠️ Stack Tecnológico

- **Frontend**: Vanilla JS (ES Modules), Tailwind CSS, Lucide Icons
- **Backend**: Supabase (Auth, Storage, Edge Functions)
- **IA**: OpenAI (GPT-4o-mini, text-embedding-3-small)
- **Hosting**: Vercel
- **Diagramas**: Excalidraw

## 💰 Costos

### App Base
- **Vercel**: $0 (Free tier)
- **Supabase**: $0 (Free tier suficiente)

### Con IA
- **OpenAI**: ~$0.10 - $3/mes (según uso)
  - Indexar 10 PDFs: ~$0.005 (una vez)
  - 200 preguntas/mes: ~$0.08
  
**Total estimado**: **~$0.10/mes** para uso estudiantil normal

## 📁 Estructura del Proyecto

```
Cuaderno-inteligente/
├── index.html              # App principal
├── css/                    # Estilos
├── js/
│   ├── components/         # Componentes reutilizables
│   │   ├── AIChatModal.js  # 🤖 Modal de chat IA
│   │   ├── NotificationManager.js
│   │   ├── PomodoroManager.js
│   │   └── ...
│   ├── core/               # Lógica central
│   │   ├── DataManager.js
│   │   ├── Router.js
│   │   └── ...
│   └── views/              # Vistas de la app
│       ├── StudyView.js    # Vista principal de estudio
│       ├── TopicsView.js
│       └── ...
├── public/
│   └── indices/            # 🤖 Índices JSON para RAG
│       └── ejemplo/
│           └── demo.json
├── scripts/                # 🤖 Scripts de ingesta
│   ├── generate-index.js   # Generador de índices
│   └── package.json
├── supabase/
│   └── functions/
│       └── ask/            # 🤖 Edge Function para IA
│           └── index.ts
└── docs/                   # Documentación
    ├── IA-SETUP.md
    └── ARQUITECTURA.md
```

## 🎯 Uso

### 1. Crear una materia

1. Abre la app
2. Haz clic en "Nueva Materia"
3. Ingresa nombre y descripción

### 2. Añadir temas

1. Selecciona la materia
2. Haz clic en "Añadir Tema"
3. Crea subtemas dentro del tema

### 3. Estudiar

1. Entra a un tema
2. Usa el editor de texto o diagramas
3. Añade recursos (PDFs, imágenes, etc.)
4. Activa Pomodoro para sesiones enfocadas

### 4. Usar el Asistente IA 🤖

1. Entra a un tema (ej: "Teoría de Conjuntos")
2. Haz clic en el botón **"Chat IA"** (morado) en el header
3. Escribe tu pregunta
4. (Opcional) Activa "Incluir apuntes del editor"
5. Recibe respuesta con citas a tus recursos

**Ejemplos de preguntas:**

- "¿Qué es un conjunto según el material?"
- "Dame un ejemplo de la ley de De Morgan con solución"
- "Resume mis apuntes en 3 puntos clave"

## 🔧 Desarrollo

### Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales.

### Generar índices para IA

```bash
cd scripts
npm install
node generate-index.js matematicas algebra-lineal ../recursos/algebra.pdf
```

Ver: [scripts/README.md](scripts/README.md)

### Desplegar Edge Function

```bash
supabase functions deploy ask
```

Ver: [docs/IA-SETUP.md](docs/IA-SETUP.md)

## 🤝 Contribuir

1. Fork del proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Proyecto educativo y personal.

## 🌟 Roadmap

- [x] Sistema de gestión de materias y temas
- [x] Editor de texto enriquecido
- [x] Diagramas con Excalidraw
- [x] Sistema de recursos
- [x] Pomodoro integrado
- [x] **Asistente IA con RAG**
- [ ] Modo offline completo
- [ ] Sincronización multi-dispositivo
- [ ] Tarjetas de repaso espaciado
- [ ] Exportar a Notion/Obsidian
- [ ] App móvil (PWA)

## 💡 Tips

- **Usa slugs sin acentos** para materias y temas (ej: `matematicas`, `teoria-de-conjuntos`)
- **Genera índices por tema** para mejor contexto en IA
- **Activa Pomodoro** para sesiones de estudio enfocadas
- **Incluye apuntes del editor** en el chat IA para preguntas sobre tu texto actual

## 🐛 Problemas Conocidos

Ver la sección de Troubleshooting en:
- [docs/IA-SETUP.md#troubleshooting](docs/IA-SETUP.md#troubleshooting)

## 📧 Contacto

¿Preguntas? Abre un issue en el repositorio.

---

Hecho con ❤️ para estudiantes que quieren aprender mejor
