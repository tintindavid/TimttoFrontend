# Timtto Frontend

Frontend application for the Timtto maintenance platform.

## Requisitos
- Node.js 18+ (recommended)
- npm

## Instalación

1. Instala dependencias:

```bash
npm install
```

2. Copia variables de entorno si es necesario:

```bash
cp .env.example .env
# Edita .env con la URL del backend si aplica
```

## Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación correrá en `http://localhost:5173` por defecto.

## Tests

Usamos `vitest` + `@testing-library/react`.

```bash
npm test -- --run
```

## Build y despliegue

Generar build de producción:

```bash
npm run build
```

Contenido generado en `dist/`. Para servir estático puedes usar Nginx, Netlify, Vercel o cualquier CDN estático.

Ejemplo de despliegue con `serve` (no recomendado para producción):

```bash
npm install -g serve
serve -s dist
```

## Notas de integración con backend
- API base por defecto: `http://localhost:3000/api/v1` (configurable en `.env` vía `VITE_API_URL`).
- El frontend aplica el header `Authorization: Bearer <token>` automáticamente si hay token en `localStorage`.
- Para multitenancy, el cliente añade `x-tenant-id` desde `localStorage` cuando está presente.

## Siguientes pasos sugeridos
- Añadir schemas completos de validación por entidad (Yup) alineados a los DTOs del backend.
- Completar formularios con validaciones y manejo avanzado de errores del backend.
- Añadir pruebas E2E y CI.
