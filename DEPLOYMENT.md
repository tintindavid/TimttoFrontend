# 🚀 Checklist de Deployment - Timtto Frontend

## ✅ ANÁLISIS ACTUAL DEL PROYECTO

### Estado General: **LISTO PARA PRODUCCIÓN** ✅

El proyecto está bien estructurado y preparado para deployment en Vercel con algunas consideraciones.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Configuración Básica (COMPLETO)
- [x] `package.json` configurado correctamente
- [x] Scripts de build funcionando (`npm run build`)
- [x] TypeScript configurado con `strict: true`
- [x] Vite como bundler (optimizado para producción)
- [x] `.gitignore` configurado correctamente
- [x] Variables de entorno documentadas

### ✅ Arquitectura Frontend (COMPLETO)
- [x] React 18 con componentes funcionales
- [x] React Router v6 para navegación
- [x] React Query para cache de servidor
- [x] Axios con interceptors
- [x] Bootstrap 5 para estilos
- [x] TypeScript estricto en todo el código

### ⚠️ Puntos a Revisar Antes de Deploy

#### 1. Variables de Entorno 🔑
**CRÍTICO**: Configurar en Vercel Dashboard

```env
VITE_API_URL=https://your-backend-api-url.com/api/v1
VITE_APP_NAME=Timtto - Mantenimiento Biomédico
```

**Pasos en Vercel:**
1. Settings → Environment Variables
2. Agregar `VITE_API_URL` con la URL de tu backend en producción
3. Agregar otras variables según `.env.production.example`

#### 2. Console.logs en Producción 🪵
**RECOMENDADO**: Remover o condicionar logs de desarrollo

**Archivos con console.log/error:**
- `src/services/base.service.ts` - Múltiples logs de debug
- `src/context/AuthContext.tsx` - Logs de autenticación
- `src/services/auth.service.ts` - Logs de login
- `src/pages/Tenants/MyTenantPage.tsx` - Logs de debug
- `src/config/queryClient.ts` - Logs de errores (estos pueden quedarse)

**Solución recomendada:**
```typescript
// Crear un logger condicional
const isDev = import.meta.env.DEV;
export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => isDev && console.error(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
};
```

#### 3. CORS del Backend 🌐
**CRÍTICO**: Asegúrate que tu backend permita requests del dominio de Vercel

```javascript
// Backend - Configurar CORS
app.use(cors({
  origin: [
    'http://localhost:5173',  // Dev
    'https://your-vercel-app.vercel.app',  // Producción
    'https://your-custom-domain.com'  // Custom domain
  ],
  credentials: true
}));
```

#### 4. Timeout de Axios ⏱️
**ACTUAL**: 10 segundos (`timeout: 10000`)
**RECOMENDACIÓN**: Aumentar a 30 segundos para producción

```typescript
// src/services/api.ts
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos para producción
  // ...
});
```

---

## 🚀 DEPLOYMENT EN VERCEL

### Opción 1: Deploy desde GitHub (RECOMENDADO)

#### Paso 1: Push a GitHub
```bash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

#### Paso 2: Conectar con Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Click en "Import Project"
3. Seleccionar repositorio de GitHub
4. Vercel detectará automáticamente que es Vite

#### Paso 3: Configurar Build Settings
Vercel detectará automáticamente:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Paso 4: Configurar Variables de Entorno
En la configuración del proyecto:
```
VITE_API_URL = https://your-backend-url.com/api/v1
```

#### Paso 5: Deploy
Click en "Deploy" y esperar a que termine.

### Opción 2: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

---

## 🔧 CONFIGURACIONES ADICIONALES

### Custom Domain
1. En Vercel Dashboard → Settings → Domains
2. Agregar tu dominio personalizado
3. Configurar DNS según instrucciones

### Continuous Deployment
- **Automático**: Cada push a `main` despliega a producción
- **Preview Deployments**: Cada PR crea un preview deployment

### Environment Variables por Entorno
- **Production**: Variables para producción
- **Preview**: Variables para preview deployments
- **Development**: Variables locales

---

## 📊 OPTIMIZACIONES INCLUIDAS

### ✅ Performance
- [x] Lazy loading de rutas (si aplica)
- [x] Code splitting automático por Vite
- [x] Minificación automática
- [x] Tree shaking automático
- [x] Cache de assets estáticos (31536000s)

### ✅ Seguridad
- [x] Headers de seguridad en `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
- [x] Token JWT en localStorage
- [x] Interceptor para refresh token
- [x] Validación de tenant en headers

### ✅ SEO (Básico para SPA)
- [x] Meta tags en `index.html`
- [x] Title dinámico
- [x] Rewrites para React Router

---

## 🧪 TESTING ANTES DE PRODUCCIÓN

### Build Local
```bash
npm run build
npm run preview
```
Abre `http://localhost:4173` y verifica:
- ✅ Todas las rutas funcionan
- ✅ Login/logout funciona
- ✅ API calls funcionan
- ✅ No hay errores en console

### Type Check
```bash
npm run type-check
```

### Tests Unitarios
```bash
npm test
```

---

## 🐛 TROUBLESHOOTING

### Error: "API calls failing in production"
**Causa**: VITE_API_URL no configurada o incorrecta
**Solución**: Verificar variables de entorno en Vercel Dashboard

### Error: "404 on page refresh"
**Causa**: SPA routing no configurado
**Solución**: Ya incluido en `vercel.json` con rewrites

### Error: "CORS error in production"
**Causa**: Backend no permite el dominio de Vercel
**Solución**: Agregar dominio a CORS en backend

### Error: "White screen / blank page"
**Causa**: Error de JavaScript no capturado
**Solución**: Revisar console en DevTools, agregar error boundaries

---

## 📝 POST-DEPLOYMENT

### Verificaciones
- [ ] Probar login/logout
- [ ] Probar navegación entre páginas
- [ ] Probar refresh en rutas internas
- [ ] Probar CRUD operations
- [ ] Probar en mobile
- [ ] Revisar console para errores
- [ ] Verificar performance (Lighthouse)
- [ ] Configurar monitoring (opcional)

### Monitoring (Opcional)
- **Vercel Analytics**: Incluido gratis
- **Sentry**: Para error tracking
- **LogRocket**: Para session replay

---

## ✅ RESUMEN EJECUTIVO

### ¿Está listo para producción? **SÍ**

### Cambios OBLIGATORIOS:
1. ✅ Configurar `VITE_API_URL` en Vercel (ya documentado)
2. ✅ Configurar CORS en backend para dominio de Vercel
3. ⚠️ Remover/condicionar console.logs (recomendado)

### Cambios OPCIONALES:
- Aumentar timeout de Axios a 30s
- Implementar error tracking (Sentry)
- Agregar Google Analytics
- Configurar custom domain

### Tiempo estimado de deployment:
- **Desde GitHub**: 5-10 minutos
- **Configuración inicial**: 15-20 minutos
- **Testing post-deploy**: 30 minutos

---

## 📞 SOPORTE

### Recursos útiles:
- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [React Router en Vercel](https://vercel.com/guides/react-router-on-vercel)

### Comandos útiles:
```bash
# Ver logs de deployment
vercel logs <deployment-url>

# Ver info del proyecto
vercel inspect <deployment-url>

# Rollback a deployment anterior
vercel rollback <deployment-url>
```

---

**Creado**: $(date)
**Última actualización**: Revisar antes de cada deploy
