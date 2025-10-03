# ⚡ Quick Start - Deployment Rápido

Guía ultra-rápida para desplegar en 10 minutos.

---

## 🚀 Pasos Rápidos

### 1️⃣ **GitHub** (2 minutos)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU-USUARIO/cuaderno-inteligente.git
git push -u origin main
```

---

### 2️⃣ **Supabase** (3 minutos)

1. Ve a https://supabase.com → **New project**
2. Crea el proyecto y **copia URL + API Key**
3. Ve a **SQL Editor** → Pega este SQL:

```sql
CREATE TABLE IF NOT EXISTS study_pages (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_study_pages_subject ON study_pages(subject_id);
ALTER TABLE study_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations" ON study_pages
    FOR ALL USING (true) WITH CHECK (true);
```

---

### 3️⃣ **Vercel** (3 minutos)

1. Ve a https://vercel.com → **Import Project**
2. Selecciona tu repo de GitHub
3. **Agrega variables de entorno**:
   - `SUPABASE_URL` = tu URL de Supabase
   - `SUPABASE_ANON_KEY` = tu API key de Supabase
4. Click **Deploy**

---

### 4️⃣ **Actualizar Código** (2 minutos)

Edita `supabase-config.js`:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = 'tu-clave-aqui';
```

```bash
git add supabase-config.js
git commit -m "Update Supabase config"
git push origin main
```

---

## ✅ ¡Listo!

Tu sitio está en: `https://cuaderno-inteligente.vercel.app`

**¿Problemas?** Lee [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas.
