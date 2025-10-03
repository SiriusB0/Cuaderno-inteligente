# ✅ Checklist de Deployment

Marca cada paso a medida que lo completes.

---

## 📝 Preparación Local

- [ ] Git instalado en tu computadora
- [ ] Proyecto inicializado con `git init`
- [ ] Primer commit realizado: `git commit -m "Initial commit"`
- [ ] Verificado que `.gitignore` está presente

---

## 🐙 GitHub

- [ ] Cuenta de GitHub creada
- [ ] Repositorio `cuaderno-inteligente` creado
- [ ] Repositorio conectado: `git remote add origin ...`
- [ ] Código subido: `git push -u origin main`
- [ ] Verificado que el código aparece en GitHub

---

## 🗄️ Supabase

- [ ] Cuenta de Supabase creada
- [ ] Proyecto `cuaderno-inteligente` creado
- [ ] **URL del proyecto** copiada y guardada
- [ ] **API Key (anon/public)** copiada y guardada
- [ ] Tabla `study_pages` creada con SQL
- [ ] Políticas RLS configuradas
- [ ] Verificado que las tablas aparecen en Table Editor

---

## 🌐 Vercel

- [ ] Cuenta de Vercel creada
- [ ] Vercel conectado con GitHub
- [ ] Proyecto importado desde GitHub
- [ ] Variables de entorno agregadas:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
- [ ] Deployment iniciado
- [ ] Deployment completado exitosamente ✅
- [ ] URL del sitio copiada

---

## 🔧 Configuración

- [ ] Archivo `supabase-config.js` actualizado con credenciales reales
- [ ] Cambios commiteados: `git commit -m "Update Supabase config"`
- [ ] Cambios subidos: `git push origin main`
- [ ] Vercel detectó el cambio y re-desplegó automáticamente

---

## ✅ Verificación

- [ ] Sitio carga correctamente en la URL de Vercel
- [ ] Login funciona
- [ ] Puedo crear materias
- [ ] Puedo crear temas y subtareas
- [ ] Editor de texto funciona
- [ ] Datos se guardan en Supabase
- [ ] Verificado en Supabase → Table Editor → `study_pages`

---

## 🎨 Opcional

- [ ] Dominio personalizado configurado
- [ ] DNS propagado y funcionando
- [ ] HTTPS funcionando correctamente

---

## 🎉 ¡Completado!

**Mi sitio está en:** ________________________________________________

**Fecha de deployment:** _______________________________________________

**Notas:** 
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________

---

## 📌 Comandos Útiles para el Futuro

```bash
# Ver estado de cambios
git status

# Subir cambios nuevos
git add .
git commit -m "Descripción del cambio"
git push origin main

# Ver historial
git log --oneline
```

---

**¿Encontraste algún problema?** Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para soluciones.
