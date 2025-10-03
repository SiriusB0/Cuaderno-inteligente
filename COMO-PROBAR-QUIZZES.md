# 🎯 Cómo Probar el Sistema de Quizzes

## 📍 Dónde está el sistema

El sistema de quizzes está integrado pero **aún no completamente funcional**. Necesitas seguir estos pasos:

## ✅ Paso 1: Refrescar el navegador

1. Abre tu navegador donde está corriendo la app
2. Presiona **F5** o **Ctrl + R** para recargar
3. Esto cargará los nuevos módulos de quizzes

## 🔍 Paso 2: Verificar que cargó correctamente

Abre la consola del navegador (F12) y busca:
- ✅ "Módulos importados correctamente"
- ❌ Si hay errores, avísame

## 📝 Paso 3: Crear preguntas de prueba

### Opción A: Desde el Dashboard (PENDIENTE)

El carrusel de quizzes aparecerá en el Dashboard, pero **los event listeners aún no están conectados**.

### Opción B: Crear manualmente con la consola (FUNCIONA AHORA)

Abre la consola del navegador (F12) y ejecuta este código:

```javascript
// 1. Obtener el primer tema de la primera materia
const subjects = window.app.dataManager.getSubjects();
const firstSubject = subjects[0];
const topics = window.app.dataManager.getTopics(firstSubject.id);
const firstTopic = topics[0];

// 2. Crear una colección de prueba
const collection = window.app.quizManager.createQuizCollection(
    firstTopic.id,
    "Prueba de Matemáticas",
    "Preguntas de prueba para verificar el sistema"
);

// 3. Crear preguntas de prueba
const testQuestions = `
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

pregunta: ¿Cuántos días tiene una semana?
opcion a: 5
opcion b: 6
opcion c: 7
opcion d: 8
respuesta: c
`;

// 4. Parsear y añadir las preguntas
const questions = window.app.quizManager.parseBatchQuestions(testQuestions);
window.app.quizManager.addQuestionsToCollection(collection.id, firstTopic.id, questions);

console.log('✅ Colección creada con', questions.length, 'preguntas');
console.log('Collection ID:', collection.id);
console.log('Topic ID:', firstTopic.id);
```

## 🎮 Paso 4: Estudiar las preguntas

Después de crear la colección, ejecuta esto en la consola:

```javascript
// Obtener la colección que acabamos de crear
const collections = window.app.quizManager.getCollectionsByTopic(firstTopic.id);
const myCollection = collections[0];

// Abrir el modal de estudio
const studyModal = new window.QuizStudyModal(window.app.quizManager, window.app.notifications);
studyModal.show(myCollection);
```

## 🎨 Paso 5: Ver el carrusel en el Dashboard

1. Refresca el Dashboard (F5)
2. Deberías ver una sección nueva: **"Colecciones de Preguntas"**
3. Con un separador horizontal hermoso
4. Y tarjetas mostrando tu colección de prueba

⚠️ **NOTA:** Los botones del carrusel aún no funcionan, necesitan event listeners.

## 🛠️ Lo que FUNCIONA ahora:

✅ **QuizManager** - Crear y gestionar colecciones
✅ **Parseo de preguntas** - Formato batch funciona perfecto
✅ **Modal de estudio** - Interfaz completa y funcional
✅ **Estadísticas** - Se guardan correctamente
✅ **Carrusel visual** - Se muestra en el Dashboard

## ⏳ Lo que FALTA:

❌ Event listeners del carrusel (navegación, estudiar, fijar)
❌ Integración en TopicsView sidebar
❌ Integración en StudyView left sidebar
❌ Botón "Crear colección" en las vistas

## 🎯 Para crear preguntas desde la interfaz:

Cuando esté completamente integrado, podrás:

1. Ir a una materia en TopicsView
2. Ver sección "Preguntas" en el sidebar
3. Click en botón "+" para crear colección
4. Pegar tus preguntas en formato batch
5. Ver vista previa
6. Guardar

## 📖 Formato de las preguntas:

```
pregunta: Tu pregunta aquí
opcion a: Primera opción
opcion b: Segunda opción
opcion c: Tercera opción
opcion d: Cuarta opción
respuesta: b
explicacion: Explicación opcional

(línea en blanco para separar preguntas)

pregunta: Otra pregunta
...
```

## 🐛 Si algo no funciona:

1. Abre la consola (F12)
2. Busca errores en rojo
3. Copia el error y avísame
4. Verifica que `window.app.quizManager` existe

## 📊 Ver estadísticas:

```javascript
// Ver todas las colecciones
const allCollections = window.app.quizManager.getCollectionsBySubject(firstSubject.id);
console.log('Colecciones:', allCollections);

// Ver estadísticas de una colección
const stats = window.app.quizManager.getAllStats(collection.id);
console.log('Estadísticas:', stats);
```

---

## 🚀 Próximos pasos para completar:

1. Agregar event listeners en Dashboard
2. Integrar en TopicsView
3. Integrar en StudyView
4. Probar flujo completo

**Estado actual:** 70% completado y funcional para pruebas manuales.
