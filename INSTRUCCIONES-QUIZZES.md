# 🎯 Cómo Usar el Sistema de Preguntas Multiple Choice

## ✅ PASO 1: Refresca tu navegador

**Presiona F5** en la página principal de tu app (http://localhost:8000)

## 🔍 PASO 2: Busca el botón MORADO

En el **Dashboard** (página principal), verás un botón grande y morado que dice:

```
🧠 Crear Preguntas Multiple Choice ➕
```

**Ubicación:** Justo debajo de las secciones "Continuar donde lo dejaste" y "Próximos Exámenes"

## 📝 PASO 3: Crear preguntas

### 3.1 Click en el botón morado

Se abrirá un modal con dos pasos:

**Paso 1:** Selecciona la **Materia**
- Verás una lista de todas tus materias
- Click en la materia donde quieres crear preguntas

**Paso 2:** Selecciona el **Tema**
- Aparecerá una lista de temas de esa materia
- Click en el tema específico

### 3.2 Pega tus preguntas

Se abrirá el modal de creación donde debes:

1. **Nombre de la colección:** Ej: "Teoría de Conjuntos - Básico"
2. **Descripción (opcional):** Ej: "Preguntas sobre operaciones básicas"
3. **Pega tus preguntas** en el formato:

```
pregunta: ¿Cuánto es 2 + 2?
opcion a: 3
opcion b: 4
opcion c: 5
opcion d: 6
respuesta: b

pregunta: ¿Cuál es la capital de Francia?
opcion a: Londres
opcion b: París
opcion c: Madrid
opcion d: Roma
respuesta: b
```

**IMPORTANTE:** Separa cada pregunta con una línea en blanco

### 3.3 Vista previa

- Click en **"Vista Previa"** para ver cómo se verán las preguntas
- Verás el contador: "X preguntas detectadas"

### 3.4 Confirmar

- Click en **"Crear Colección"**
- ¡Listo! Tu colección está creada

## 🎮 PASO 4: Estudiar las preguntas

### Opción A: Desde el Dashboard

1. Refresca el Dashboard (F5)
2. Verás una sección: **"Colecciones de Preguntas"**
3. Aparecerán tarjetas con tus colecciones
4. Click en el botón **"Estudiar"**

### Opción B: Desde el carrusel

- Usa las flechas ← → para navegar entre colecciones
- Click en **"Estudiar"** en cualquier tarjeta

## 🎯 PASO 5: Responder preguntas

En el modal de estudio:

1. **Lee la pregunta** (altura fija, no cambia de tamaño)
2. **Click en una opción** (a, b, c, o d)
3. **Click en "Confirmar Respuesta"**
4. Verás si acertaste (verde) o fallaste (rojo)
5. **Click en "Siguiente Pregunta"**
6. Al terminar, verás tus **resultados finales**

## 📊 Estadísticas

- Se guardan automáticamente
- Verás en las tarjetas:
  - ✓ Aciertos
  - ✗ Fallos
  - % Precisión

## 🎨 Características visuales

### Botón principal:
- **Color:** Gradiente morado-rosa-rojo
- **Tamaño:** Ancho completo, grande
- **Ubicación:** Dashboard, parte superior

### Tarjetas de colecciones:
- **Ancho:** 320px
- **Info mostrada:**
  - Nombre de la colección
  - Materia y tema
  - Cantidad de preguntas
  - Últimas estadísticas
  - Botón de fijar (pin)
  - Botón "Estudiar"

### Modal de estudio:
- **Altura fija:** 600px
- **Pregunta:** Altura mínima 120px
- **Opciones:** Botones grandes con hover
- **Feedback:** Colores verde/rojo
- **Progress bar:** Animada

## ❓ Si no ves el botón:

1. **Verifica que refrescaste** (F5)
2. **Abre la consola** (F12) y busca errores
3. **Verifica que estás en el Dashboard** (página principal)
4. **Verifica que tienes materias creadas**

## 🐛 Troubleshooting

### "No veo el botón morado"
- Refresca con Ctrl + F5 (fuerza recarga)
- Verifica que `window.app.quizManager` existe en la consola

### "No tengo materias"
- Crea al menos una materia primero
- Ve a "Mis Cuadernos" y agrega una materia

### "No tengo temas"
- Entra a una materia
- Crea al menos un tema

### "El modal no se abre"
- Abre la consola (F12)
- Busca errores en rojo
- Verifica que `window.QuizCreatorModal` existe

## 📝 Formato de preguntas - Reglas

✅ **Correcto:**
```
pregunta: ¿Tu pregunta aquí?
opcion a: Primera opción
opcion b: Segunda opción
opcion c: Tercera opción
opcion d: Cuarta opción
respuesta: b
```

❌ **Incorrecto:**
- Sin línea en blanco entre preguntas
- Respuesta que no es a, b, c o d
- Faltan opciones
- Formato diferente

## 🎯 Ejemplo completo

```
pregunta: ¿Cuánto es 5 + 3?
opcion a: 6
opcion b: 7
opcion c: 8
opcion d: 9
respuesta: c
explicacion: 5 + 3 = 8 (opcional)

pregunta: ¿Cuál es el color del cielo?
opcion a: Rojo
opcion b: Verde
opcion c: Azul
opcion d: Amarillo
respuesta: c

pregunta: ¿Cuántos continentes hay?
opcion a: 5
opcion b: 6
opcion c: 7
opcion d: 8
respuesta: c
```

---

**¡Ahora sí está todo listo!** 🚀

Refresca tu navegador y verás el botón morado grande en el Dashboard.
