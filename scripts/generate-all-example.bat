@echo off
REM Script de ejemplo para generar múltiples índices en Windows
REM Copia este archivo y personalízalo según tus materias y temas

echo 🚀 Generando índices para todas las materias...

REM Matemáticas
echo 📐 Matemáticas...
node generate-index.js matematicas algebra-lineal ..\recursos\matematicas\algebra.pdf
node generate-index.js matematicas calculo-diferencial ..\recursos\matematicas\calculo.pdf
node generate-index.js matematicas teoria-de-conjuntos ..\recursos\matematicas\conjuntos.pdf

REM Física
echo ⚛️ Física...
node generate-index.js fisica mecanica-clasica ..\recursos\fisica\mecanica.pdf
node generate-index.js fisica termodinamica ..\recursos\fisica\termo.pdf

REM Programación
echo 💻 Programación...
node generate-index.js programacion javascript ..\recursos\programacion\js.pdf
node generate-index.js programacion python ..\recursos\programacion\python.pdf

echo ✅ ¡Todos los índices generados!
echo 📁 Verifica en: public\indices\

pause
