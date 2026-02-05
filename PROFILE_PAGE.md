# Página de Perfil de Usuario

## 📋 Descripción
Página de perfil completa para que los usuarios visualicen y editen su información personal, incluyendo la gestión de firma digital.

## 🎯 Características Implementadas

### 1. Vista de Perfil (`/profile`)
- **Información Personal**: Muestra todos los datos del usuario en formato de tarjeta profesional
- **Foto de Perfil**: Visualización de foto o placeholder
- **Badge de Rol**: Identificación visual del rol (Admin, Técnico, Usuario)
- **Vista Previa de Firma**: Si el usuario tiene firma configurada

### 2. Modal de Edición de Perfil
Permite editar los siguientes campos:
- ✅ Nombre (firstName) - Obligatorio
- ✅ Apellido (lastName) - Obligatorio
- ✅ Usuario (username) - Obligatorio
- ✅ Teléfono (phone) - Opcional
- ✅ Ciudad (city) - Opcional
- ✅ Registro INVIMA (registroInvima) - Opcional

**Validaciones:**
- Nombre y Apellido: mínimo 2 caracteres
- Usuario: mínimo 3 caracteres
- Formulario con React Hook Form + Yup

### 3. Modal de Firma Digital
- **Captura de Firma**: Canvas interactivo usando `react-signature-canvas`
- **Responsive**: Adapta el tamaño según el dispositivo
- **Vista Previa**: Muestra la firma actual antes de actualizar
- **Validaciones**: No permite guardar sin firma
- **Formato**: Guarda en base64 (PNG)

## 📂 Archivos Creados

```
src/
├── pages/
│   └── Profile/
│       ├── ProfilePage.tsx          # Página principal
│       ├── ProfilePage.css          # Estilos de la página
│       ├── EditProfileModal.tsx     # Modal de edición
│       ├── SignatureModal.tsx       # Modal de firma
│       └── SignatureModal.css       # Estilos del modal de firma
```

## 📝 Archivos Modificados

### Services
- `src/services/user.service.ts`
  - `updateProfile()`: Actualizar información del perfil
  - `updateSignature()`: Actualizar firma digital

### Hooks
- `src/hooks/useUsers.ts`
  - `useUpdateProfile()`: Hook para mutación de perfil
  - `useUpdateSignature()`: Hook para mutación de firma

### Types
- `src/types/user.types.ts`
  - `UpdateProfileDto`: Interface para actualización de perfil
  - `UpdateSignatureDto`: Interface para actualización de firma

### Routes
- `src/routes/index.tsx`
  - Agregada ruta `/profile` protegida

### Layout
- `src/components/layout/Navbar/Navbar.tsx`
  - Corregida navegación a perfil usando `useNavigate`
  - Click en "Perfil" ahora redirige correctamente a `/profile`

## 🎨 Diseño

### Responsive
- **Desktop**: Layout de 2 columnas (perfil + detalles)
- **Tablet**: Layout adaptativo
- **Mobile**: Layout de 1 columna, elementos apilados

### Colores y Estilos
- **Primary**: Para badges y acciones principales
- **Secondary**: Para elementos secundarios
- **Success/Warning**: Para estado de firma
- **Gradiente**: En placeholder de foto

### Componentes Bootstrap
- Cards con shadow-sm
- Badges para rol y estado
- Modales centrados y responsivos
- Form controls con validación visual

## 🔌 Endpoints del Backend

### Actualizar Perfil
```
PUT /api/v1/users/:id/profile
Body: {
  firstName?: string,
  lastName?: string,
  username?: string,
  phone?: string,
  city?: string,
  registroInvima?: string
}
```

### Actualizar Firma
```
PUT /api/v1/users/:id/signature
Body: {
  fileFirma: string (base64)
}
```

## 🚀 Cómo Usar

### Para Usuarios
1. Hacer clic en el menú de usuario en el Navbar
2. Seleccionar "Perfil"
3. Para editar información: botón "Editar Perfil"
4. Para agregar/actualizar firma: botón "Agregar/Actualizar Firma"

### Navegación
```
Navbar → Menú Usuario → Perfil → /profile
```

## 🔐 Seguridad
- Ruta protegida con `PrivateRoute`
- Solo el usuario autenticado puede ver/editar su perfil
- Token JWT enviado automáticamente en headers
- Validación client-side y server-side

## 📱 Compatibilidad
- ✅ Desktop (mouse para firma)
- ✅ Tablet (touch para firma)
- ✅ Mobile (touch para firma)

## 🎯 Campos del Usuario (Modelo Backend)
```typescript
{
  tenantId: string,          // No editable
  firstName: string,         // Editable
  lastName: string,          // Editable
  fullName: string,          // Calculado
  username: string,          // Editable
  email: string,             // No editable desde perfil
  password: string,          // No visible/editable desde perfil
  role: string,              // No editable desde perfil
  phone: string,             // Editable
  city: string,              // Editable
  registroInvima: string,    // Editable
  photo: string,             // Visualizable (edición pendiente)
  fileFirma: string,         // Editable vía modal de firma
  isDeleted: boolean,        // No relevante
  deletedAt: Date,           // No relevante
}
```

## 📊 Estados de Carga
- **Loading**: Spinner mientras carga datos
- **Error**: Alert si falla la carga
- **Success**: Toast al guardar cambios exitosamente
- **Validación**: Mensajes de error en formulario

## 🔄 Flujo de Actualización
1. Usuario abre modal de edición
2. Formulario pre-cargado con datos actuales
3. Usuario modifica campos
4. Validación client-side
5. Submit al backend
6. React Query invalida caché
7. Datos actualizados automáticamente
8. Toast de confirmación

## 💡 Notas Importantes
- El email y contraseña **NO** son editables desde el perfil
- Para cambios de email/contraseña, contactar al administrador
- La firma se guarda en formato base64 PNG
- La foto de perfil es visualizable pero no editable (funcionalidad futura)

## 🐛 Troubleshooting

### La firma no se ve
- Verificar que `fileFirma` contiene un data URI válido
- Verificar permisos en el backend

### Errores de validación
- Revisar que los campos cumplan requisitos mínimos
- Verificar conexión al backend

### Navegación no funciona
- Verificar que la ruta esté registrada en `routes/index.tsx`
- Verificar autenticación activa
