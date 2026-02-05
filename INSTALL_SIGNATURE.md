# Instalación de react-signature-canvas

Para que funcione la captura de firma digital en las Hojas de Trabajo, debes instalar la siguiente librería:

```bash
npm install react-signature-canvas
```

o con yarn:

```bash
yarn add react-signature-canvas
```

## Tipos TypeScript

Si usas TypeScript (que es el caso), también instala los tipos:

```bash
npm install --save-dev @types/react-signature-canvas
```

## Características

- ✅ Captura de firma con mouse
- ✅ Soporte táctil para móviles y tablets
- ✅ Canvas responsivo
- ✅ Exportación a base64
- ✅ Función de limpiar firma
- ✅ Validación de firma vacía

## Uso en el Componente

La firma se captura en `WorkSheets.tsx` cuando se crea una nueva hoja de trabajo. Los campos obligatorios son:

1. **Recibe**: Nombre de quien recibe
2. **Cargo**: Cargo de la persona
3. **Firma**: Firma digital en el canvas

La firma se guarda como imagen base64 que puede ser enviada al backend.
