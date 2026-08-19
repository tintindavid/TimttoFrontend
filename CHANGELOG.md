# [1.17.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.16.0...v1.17.0) (2026-08-19)


### Features

* **equipos:** guard duplicate creation with replace-guided UX ([0a16932](https://github.com/tintindavid/TimttoFrontend/commit/0a16932c60832037ea65ade012eadbcf429a2070))

# [1.16.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.15.0...v1.16.0) (2026-08-18)


### Features

* **ots:** responsables trazables + firmante selector + report edit-lock + fixes ([b9ee132](https://github.com/tintindavid/TimttoFrontend/commit/b9ee132236b436167d90f6d3b5adaa20caa03050))

# [1.15.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.14.0...v1.15.0) (2026-08-15)


### Features

* **notifications:** infra real-time + primer evento sheet.signed ([1e73d59](https://github.com/tintindavid/TimttoFrontend/commit/1e73d592074a6a546798de1a2f28927a1e0386d7))

# [1.14.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.13.0...v1.14.0) (2026-08-13)


### Features

* **protocols:** duplicar protocolo y auto-seleccionar actividad recién creada ([a4f2289](https://github.com/tintindavid/TimttoFrontend/commit/a4f2289670db0d7d78c09a7c1f7d53f9486e6f61))

# [1.13.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.12.0...v1.13.0) (2026-08-13)


### Features

* **ots:** sheetwork share modal + portal widening + report protocolo UX fixes ([dd023b8](https://github.com/tintindavid/TimttoFrontend/commit/dd023b8d58eb7e20615f542d2b83db1b37cbe468))

# Unreleased (2026-08-12)


### Bug Fixes

* **reports:** en el tab Protocolo → "Actividades Realizadas", el input de observaciones perdía el foco al escribir el primer carácter. La causa era que había DOS `<Form.Control>` distintos condicionados por si el texto estaba vacío; al escribir el primer char React desmontaba uno y montaba el otro. Unificado a un solo input.

### Features

* **ots:** en el card del cliente del `OtHeader`, la Ciudad y el Email ahora se muestran en líneas separadas debajo del nombre (antes: `Ciudad • Email` en una sola línea).
* **reports:** en el tab Protocolo, cada actividad tiene un checkbox "Incluir descripción de la actividad" que copia la descripción del protocolo al input de observaciones — disponible tanto en "Actividades Pendientes" como en "Actividades Realizadas". El check deriva su estado del propio texto (idempotente): activarlo prepende la descripción, desactivarlo la remueve, sin pisar ediciones manuales del resto del texto.

### Features

* **ots:** modal "+ Agregar Equipo" en `/ots/:id` ahora tiene 3 filtros nuevos en el tab "Seleccionar equipos existentes" (Sede como dropdown, Servicio como dropdown, Ubicación como texto). Además: check-all inteligente que selecciona/deselecciona SOLO los equipos filtrados visibles (respeta los que ya tenías seleccionados fuera del filtro). Los equipos que ya están en la OT (con reportes activos, no cancelados) se muestran deshabilitados con badge "Ya en la OT" — no se pueden seleccionar ni con el check-all.
* **equipos:** en el tab "Crear Equipo Nuevo" (modal de la OT), los inputs Sede y Servicio quedan preseleccionados automáticamente cuando el cliente solo tiene una única opción de cada uno. Si el usuario elige otra manualmente después, no se pisa.

# Unreleased (2026-08-11)


### Features

* **sheetwork:** botón "Enviar" en `/ots/:id → Hojas de Trabajo` y `/diario → hojas de trabajo` para HTs firmadas — abre `SendSignedSheetModal` con el correo del cliente prefilled (o el último usado desde `shareHistory`), editable, y checkbox "Permitir descargar los reportes". Al enviar se genera un enlace público de 3 descargas / 3 días (más 2 descargas de reportes ZIP si se habilita) y se despacha el correo al destinatario.
* **sheetwork:** nueva página pública `/hoja-descarga/:token` con 4 estados (active / exhausted / expired / revoked). Vista activa muestra botón "Descargar Hoja de Trabajo" y, cuando `allowReports: true`, "Descargar Reportes"; cada botón muestra el contador de descargas restantes y el banner de expiración.
* **portal-cliente:** el listado y descarga de HTs en el portal ahora incluye TODAS las HTs firmadas de las OTs del token, no solo las firmadas bajo el token actual. Rotar el token o crear uno nuevo ya no borra el histórico visible del cliente.

### UX

* **ots:** el nombre del cliente en el header de la OT ahora es un enlace que abre `/customers/:id` en una nueva pestaña (`target="_blank"`, con hover-underline). No cambia el layout del header.

# [1.12.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.11.0...v1.12.0) (2026-08-11)


### Features

* **ots): pdf filename builder modal + fix(listings:** server-side search ([9f1b282](https://github.com/tintindavid/TimttoFrontend/commit/9f1b282368079009a0deac21feaab1eee2c8af3a))

# Unreleased (2026-08-11)


### Bug Fixes

* **protocols/items:** las páginas `ProtocolsPage` e `ItemsPage` ahora buscan directo en la DB. Antes pedían solo la página actual del paginado (limit 10-20) y filtraban en memoria con `useMemo`, por lo que la búsqueda solo veía los registros ya visibles. Ahora envían `search`/`sortBy`/`order` como query params al backend (debounced 300ms via `useDebounce`, `keepPreviousData: true` en el hook), el conteo "Mostrando N de M" refleja `pagination.total`, y el orden alfabético también se resuelve server-side.

### Features

* **ots:** el botón "Reportes PDF" en el tab Hojas de Trabajo ahora abre un modal (`PdfReportsFilenameModal`) para configurar el nombre de cada PDF del ZIP. 5 tokens reordenables por drag-and-drop (`consecutivo`, `serial`, `inventario`, `item`, `fecha`), preselección por default `consecutivo + fecha + item`, vista previa en vivo usando el primer reporte de la hoja, botón "Deseleccionar todo", y popover ⓘ con la explicación de la interacción. Al enviar, se descarga el ZIP con los nombres configurados; sin configuración, se preserva el comportamiento anterior.

# [1.11.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.10.0...v1.11.0) (2026-08-11)


### Features

* **portal:** sheetwork remote signature + client-token edit and send-link ([06093b4](https://github.com/tintindavid/TimttoFrontend/commit/06093b4ad0b401944d8a231b2741b0847894fbb9))

# Unreleased (2026-08-10)


### Features

* **sheetwork:** modal "Firma de Creación de Hoja de Trabajo" ahora tiene dos tabs — "Firma en Sitio" (comportamiento actual, extraído a `<InPlaceSignSection>`) y "Firma Remota" (formulario que envía un correo con el enlace de firma al cliente).
* **sheetwork:** nuevos íconos `Reenviar` y `Firmar en sitio` en las filas de HT en estado `EnviadaAFirmar`; abren `ResendSignModal` y el modal de firma en sitio como fallback.
* **sheetwork:** nueva página pública `/firma/:token` — el cliente ve el PDF de la HT (mismo layout que el PDF final) y firma con `SignatureInput`; tras firmar la vista pasa a modo read-only con descarga del PDF hasta el vencimiento del token (7 días desde la firma).
* **client-tokens:** en el tab "Accesos Cliente" del detalle de cliente, cada acceso activo ahora tiene dos íconos nuevos: ➕ "Añadir OTs" (abre modal listando OTs del cliente que no están ya en el acceso) y ✉️ "Enviar link por correo" (abre modal con el último correo utilizado o el correo del cliente por defecto, editable; reenviable N veces). Bajo la fila se muestra el histórico "N envíos, último a x@y.com hace …" cuando `emailHistory.sendCount > 0`.

# [1.10.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.9.0...v1.10.0) (2026-08-06)


### Features

* **portal:** close reports on client sign + late-sign + image upload ([19e20c2](https://github.com/tintindavid/TimttoFrontend/commit/19e20c2a4deca2cb81b6981ff28b441dda8bdf12))

# [1.9.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.8.0...v1.9.0) (2026-08-03)


### Features

* **portal-cliente:** filtros + descarga reportes + listado y modal admin ([e3f43a1](https://github.com/tintindavid/TimttoFrontend/commit/e3f43a1a8621d3cd1d5f14b69cfd685712abf6c5))

# [1.8.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.7.0...v1.8.0) (2026-08-03)


### Features

* **portal-cliente:** permission gate + attribution selector + modal UX ([2e45851](https://github.com/tintindavid/TimttoFrontend/commit/2e45851d1c731707e0047205e7115465bf02b6b7))

# [1.7.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.6.0...v1.7.0) (2026-08-02)


### Features

* **client-portal:** portal SPA + admin OT tooling + review/sign flow ([b2ff3d6](https://github.com/tintindavid/TimttoFrontend/commit/b2ff3d6c244ccdf48c4f5aae2b7faf3b8557e108))

# [1.6.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.5.0...v1.6.0) (2026-07-14)


### Features

* rbac granular, historial, notas ot, guía rápida, verificación de parámetros y personal ([b965ea7](https://github.com/tintindavid/TimttoFrontend/commit/b965ea7e378d9793cf5a07d5acc29e934b7629cf))

# [1.5.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.4.0...v1.5.0) (2026-07-05)


### Features

* **auth:** add forgotPassword and resetPassword to frontend authService ([2aae5d9](https://github.com/tintindavid/TimttoFrontend/commit/2aae5d9f4aec25e8f73d39ff70c334f32e666169))
* **auth:** add ForgotPasswordPage with anti-enumeration confirmation ([88d2f02](https://github.com/tintindavid/TimttoFrontend/commit/88d2f02e8ef687eb4212aae297b7901647b1188b))
* **auth:** add ResetPasswordPage with token-expired handling ([05646fb](https://github.com/tintindavid/TimttoFrontend/commit/05646fb1bfb48d9e4790991d39a5fdb8df029aa1))
* **auth:** password visibility toggle, strength checklist and token preflight ([a27fde9](https://github.com/tintindavid/TimttoFrontend/commit/a27fde961957534b13e4c69b2df739f0506a98c5))
* **auth:** wire up forgot-password link in LoginForm and public routes ([45203e0](https://github.com/tintindavid/TimttoFrontend/commit/45203e063ed67bff74c95f003bd1f2c3cde86928))

# [1.4.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.3.0...v1.4.0) (2026-07-03)


### Features

* **platform:** analytics dashboard UI with charts + CSV export (E4) ([baf90c4](https://github.com/tintindavid/TimttoFrontend/commit/baf90c45fef1750f9b4f73b9e79dfb457364bc4a)), closes [#16](https://github.com/tintindavid/TimttoFrontend/issues/16)

# [1.3.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.2.0...v1.3.0) (2026-07-03)


### Features

* **platform:** emailSent banner in credentials modals (E3) ([9f092b0](https://github.com/tintindavid/TimttoFrontend/commit/9f092b0cd8d9e7297adbf228b531833e1e907a88))

# [1.2.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.1.0...v1.2.0) (2026-07-02)


### Bug Fixes

* **platform-users:** add parens to nullish/logical mix ([5185d3b](https://github.com/tintindavid/TimttoFrontend/commit/5185d3b0418f7a79c7dbb7b6545aec302b2891da))


### Features

* **platform:** view-as + change-password + admin users/audit UI (E2) ([cda3ab9](https://github.com/tintindavid/TimttoFrontend/commit/cda3ab9f79e197f6643ea890c307223c0a342f86)), closes [#13](https://github.com/tintindavid/TimttoFrontend/issues/13)

# [1.1.0](https://github.com/tintindavid/TimttoFrontend/compare/v1.0.0...v1.1.0) (2026-07-02)


### Features

* **platform:** admin console for tenant lifecycle (E1) + E0 test coverage ([7c94bd1](https://github.com/tintindavid/TimttoFrontend/commit/7c94bd17ef4ca6a41b76de5087995174119a3e6b))

# 1.0.0 (2026-06-29)


### Features

* agregar carga y gestion de evidencias en reportes (SCRUM-4) ([84c1aff](https://github.com/tintindavid/TimttoFrontend/commit/84c1aff2394585f5b00a6b20031b09da08f351d4))
* **customers:** add Cronograma PDF download button to CustomerEquiposSection ([ab1ff09](https://github.com/tintindavid/TimttoFrontend/commit/ab1ff09e21bac7ddffa8eae77b0ab2c2a5e76f94))
* **customers:** add CSV export button to CustomersPage (TICKET-002) ([6fe3da2](https://github.com/tintindavid/TimttoFrontend/commit/6fe3da2e44eade374e04cb7bff7b2e5a7ede1b31))
* **reports:** add Ver. Parámetros tab and read-only view (SCRUM-5) ([311b573](https://github.com/tintindavid/TimttoFrontend/commit/311b57313959fca5ae851b19ee58c31b36421524))
* **TICKET-001:** add inventory download button and modal ([6de4fb7](https://github.com/tintindavid/TimttoFrontend/commit/6de4fb7c6c8ad32152344d17219e0945ad1cd875))
* **tickets:** add ticket lifecycle UI + QR-gated public intake (admin-only rollout) ([1e81eb8](https://github.com/tintindavid/TimttoFrontend/commit/1e81eb8b36efee43ef93800d7d25106badaa3aeb))
