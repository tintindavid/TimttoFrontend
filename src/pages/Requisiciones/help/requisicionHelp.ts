/**
 * Single catalog of the contextual help ("(!)") of the Requisiciones module.
 * Every entry says WHAT the function does (`body`) and HOW it connects to the rest of the module (`relation`).
 * Keep the text accurate to the real behavior of E1 (see docs/requisiciones.md).
 */
export interface HelpEntry {
  title: string;
  /** What it does. */
  body: string;
  /** How it relates to other parts of the module. */
  relation?: string;
  tip?: string;
}

const HELP = {
  // ---------------------------------------------------------------- Pages / navigation
  'pagina.listado': {
    title: 'Listado de requisiciones',
    body: 'Muestra las requisiciones (solicitudes internas de compra) de tu organización que puedes ver, con su estado, monto y solicitante.',
    relation:
      'Desde aquí creas una requisición nueva o abres el detalle de una existente. Cada una avanza por estados y niveles de aprobación que se configuran en Configuración (Áreas, Tipos, Reglas, Presupuestos).',
  },
  'pagina.mias': {
    title: 'Mis requisiciones',
    body: 'Lista las requisiciones que tú creaste o en las que figuras como solicitante, en cualquier estado.',
    relation: 'Es tu bandeja de seguimiento: aquí ves si tus solicitudes siguen en borrador, en aprobación, aprobadas o rechazadas.',
  },
  'pagina.porAprobar': {
    title: 'Por aprobar',
    body: 'Bandeja de aprobador: requisiciones en aprobación cuyo nivel actual te corresponde decidir.',
    relation:
      'Solo aparece si tienes el permiso de aprobar. Quién decide cada nivel lo define la regla de aprobación (jefe del área, un rol o usuarios concretos), no solo el permiso.',
  },
  'pagina.formulario': {
    title: 'Formulario de requisición',
    body: 'Aquí describes qué necesitas comprar: datos generales, justificación y una o más líneas con cantidad y precio estimado.',
    relation:
      'Puedes guardarla como borrador (editable) o guardar y enviar: al enviarla se calculan los niveles de aprobación según el monto estimado.',
  },
  'pagina.detalle': {
    title: 'Detalle de la requisición',
    body: 'Reúne todo de una requisición: datos, líneas, monto, niveles de aprobación, presupuesto del área e historial de eventos.',
    relation:
      'Los botones de arriba cambian según su estado y según quién eres (creador/solicitante, aprobador o supervisor). Todo cambio queda registrado en el historial.',
  },
  'pagina.areas': {
    title: 'Áreas',
    body: 'Las áreas representan departamentos de la organización. Cada requisición pertenece a un área y esta aporta sus jefes como aprobadores.',
    relation:
      'Un área puede tener varios jefes (nivel «Jefe de área» de las reglas) y presupuestos propios. Se puede asignar un área a cada usuario para que se proponga al crear una requisición.',
  },
  'pagina.tipos': {
    title: 'Tipos de requisición',
    body: 'Clasifican las requisiciones (por ejemplo repuestos, papelería o servicios). Se elige al crearla.',
    relation: 'El tipo no se puede cambiar después de crear la requisición. Aparece como filtro del listado y en el detalle.',
  },
  'pagina.reglas': {
    title: 'Reglas de aprobación',
    body: 'Cada regla es un nivel de aprobación. Al enviar una requisición se suman todos los niveles activos cuyo «monto desde» sea menor o igual a su monto estimado.',
    relation:
      'Ejemplo: Jefe de área desde 0 y Dirección desde 5.000.000; una requisición de 7.000.000 pasa por ambos, una de 1.000.000 solo por el primero. Los niveles se congelan al enviar: cambiar la regla después no afecta las que ya están en aprobación.',
  },
  'pagina.presupuestos': {
    title: 'Presupuestos por área',
    body: 'Define cuánto puede gastar un área en un período (año o mes). Es solo informativo.',
    relation:
      'El aprobador ve consumido, comprometido y disponible del área dentro del detalle de la requisición, pero el presupuesto nunca bloquea enviar ni aprobar.',
  },
  'config.nav': {
    title: 'Secciones de configuración',
    body: 'Cambia entre Áreas, Tipos, Reglas de aprobación y Presupuestos. Solo ves las secciones para las que tienes permiso de lectura.',
    relation:
      'Se complementan: las áreas aportan jefes, los tipos clasifican, las reglas definen los niveles según el monto y los presupuestos dan contexto al aprobador.',
  },
  'config.buscar': {
    title: 'Buscar en la configuración',
    body: 'Filtra la tabla escribiendo parte del nombre. La búsqueda se aplica poco después de dejar de escribir.',
  },
  'config.orden': {
    title: 'Ordenar',
    body: 'Alterna el orden de la tabla entre A–Z y Z–A por nombre.',
  },

  // ---------------------------------------------------------------- Listing filters
  'filtro.busqueda': {
    title: 'Buscar requisiciones',
    body: 'Busca por consecutivo (por ejemplo REQ-2026-0001) o por parte del título.',
    relation: 'Se combina con los demás filtros: solo se muestran las que cumplen todo a la vez.',
  },
  'filtro.area': {
    title: 'Filtrar por área',
    body: 'Muestra solo las requisiciones del área elegida.',
    relation: 'Las áreas se administran en Configuración > Áreas.',
  },
  'filtro.tipo': {
    title: 'Filtrar por tipo',
    body: 'Muestra solo las requisiciones del tipo elegido.',
    relation: 'Los tipos se administran en Configuración > Tipos.',
  },
  'filtro.fechas': {
    title: 'Filtrar por fecha de creación',
    body: 'Limita el listado a las requisiciones creadas entre las fechas «Desde» y «Hasta» (ambas incluidas).',
  },
  'filtro.orden': {
    title: 'Orden del listado',
    body: 'Alterna entre ver primero las requisiciones más recientes o las más antiguas, según su fecha de creación.',
  },
  'estados.leyenda': {
    title: 'Estados de una requisición',
    body: 'El estado indica en qué punto del flujo está la requisición. Estos son todos:',
    relation: 'El flujo normal es Borrador, En aprobación y Aprobada. Rechazada puede reabrirse y cualquier estado no terminal puede cancelarse.',
  },
  'accion.nueva': {
    title: 'Nueva requisición',
    body: 'Abre el formulario para crear una requisición. Se guarda primero como borrador y, cuando esté lista, se envía a aprobación.',
    relation: 'Solo la ven los usuarios con permiso para crear requisiciones. El consecutivo REQ-AÑO-NNNN se asigna al guardarla.',
  },

  // ---------------------------------------------------------------- Form
  'form.titulo': {
    title: 'Título',
    body: 'Nombre corto que identifica la requisición en el listado y en las notificaciones. Obligatorio, hasta 200 caracteres.',
  },
  'form.tipo': {
    title: 'Tipo',
    body: 'Clasifica la requisición. Se elige al crearla.',
    relation: 'No se puede cambiar después de crearla. Solo aparecen los tipos activos definidos en Configuración > Tipos.',
  },
  'form.area': {
    title: 'Área',
    body: 'Departamento que hace la solicitud. Se propone tu área si tienes una asignada.',
    relation:
      'Determina quiénes son los jefes que aprueban el nivel «Jefe de área» y qué presupuesto se muestra al aprobador. Solo aparecen las áreas activas.',
  },
  'form.prioridad': {
    title: 'Prioridad',
    body: 'Indica la urgencia de la compra (Baja, Media, Alta o Urgente). Es informativa para quienes revisan.',
    relation: 'No cambia los niveles de aprobación: estos dependen del monto estimado.',
  },
  'form.fechaRequerida': {
    title: 'Fecha requerida',
    body: 'Fecha en la que necesitas tener lo solicitado. Es opcional.',
  },
  'form.justificacion': {
    title: 'Justificación',
    body: 'Explica por qué se necesita la compra. Es opcional al guardar el borrador, pero obligatoria para enviar a aprobación.',
    relation: 'Es lo primero que lee quien aprueba para decidir.',
  },
  'form.lineas': {
    title: 'Líneas',
    body: 'Cada línea es un producto o servicio que pides, con cantidad, unidad y precio estimado. Debe haber al menos una (máximo 100).',
    relation: 'La suma de las líneas da el monto estimado, que es el que define los niveles de aprobación al enviar.',
  },
  'form.fuente': {
    title: 'Ítem de stock o texto libre',
    body: 'Con «Ítem de stock» eliges un repuesto del inventario y se rellenan su nombre, unidad y precio. Con «Texto libre» describes lo que necesitas a mano.',
    relation:
      'Elegir del inventario es posible solo si tu organización usa el inventario básico. En fases posteriores, almacén usará esta vinculación para revisar existencias.',
    tip: 'Si el ítem no existe en el inventario, usa texto libre.',
  },
  'form.descripcionLinea': {
    title: 'Descripción y especificaciones',
    body: 'La descripción dice qué se pide (obligatoria). Las especificaciones sirven para detalles como marca, medida o referencia.',
  },
  'form.cantidadUnidad': {
    title: 'Cantidad y unidad',
    body: 'Cuántas unidades se piden (mayor que cero) y en qué unidad se miden (und, kg, m, etc.).',
    relation: 'Cantidad por precio estimado da el subtotal de la línea.',
  },
  'form.precioEstimado': {
    title: 'Precio estimado',
    body: 'Precio unitario aproximado. Si eliges un ítem de stock se rellena con el precio del inventario y lo puedes ajustar.',
    relation:
      'Es una estimación, no un precio de compra. Con él se calcula el monto estimado, que define los niveles de aprobación. El servidor recalcula el monto al guardar.',
  },
  'form.montoTotal': {
    title: 'Monto total estimado',
    body: 'Suma en vivo de cantidad por precio estimado de todas las líneas.',
    relation: 'Ese monto decide por cuántos niveles de aprobación pasará la requisición según las reglas configuradas.',
  },
  'form.guardarBorrador': {
    title: 'Guardar borrador',
    body: 'Guarda la requisición sin enviarla. Puedes dejar campos incompletos (la justificación es opcional) y seguir editándola después.',
    relation: 'Mientras sea borrador no se calculan niveles ni se notifica a aprobadores.',
  },
  'form.guardarEnviar': {
    title: 'Guardar y enviar',
    body: 'Guarda la requisición y la envía a aprobación en un solo paso. Exige justificación completa.',
    relation:
      'Al enviar se fijan los niveles de aprobación según el monto y se avisa a los aprobadores del primer nivel. Si el envío falla, el borrador queda guardado y puedes reintentar desde el detalle.',
  },

  // ---------------------------------------------------------------- Detail
  'detalle.encabezado': {
    title: 'Datos generales',
    body: 'Resumen de la requisición: tipo, área, prioridad, solicitante, fecha requerida, justificación y, si aplica, el motivo de cancelación.',
  },
  'detalle.solicitante': {
    title: 'Solicitante',
    body: 'Persona para quien es la compra. Si no se indicó otra, es quien creó la requisición.',
    relation: 'El creador y el solicitante pueden enviar, editar, retirar y reabrir, pero no pueden aprobarla (separación de funciones).',
  },
  'detalle.lineas': {
    title: 'Líneas de la requisición',
    body: 'Productos o servicios solicitados con cantidad, unidad, precio estimado y subtotal. Las líneas con «Ítem de stock» vienen del inventario.',
  },
  'detalle.monto': {
    title: 'Monto estimado',
    body: 'Suma de los subtotales, calculada por el servidor.',
    relation: 'Se usó para decidir cuántos niveles de aprobación se requieren al enviar. Si se edita y se vuelve a enviar, se recalcula.',
  },
  'detalle.aprobacion': {
    title: 'Panel de aprobación',
    body: 'Muestra los niveles por los que debe pasar la requisición, quién aprueba cada uno y cómo va cada decisión.',
    relation: 'Los niveles se definen al enviar, a partir de las reglas de aprobación, y quedan congelados para esa ronda.',
  },
  'detalle.niveles': {
    title: 'Niveles de aprobación',
    body: 'Los niveles se aprueban en secuencia: hasta que el nivel actual aprueba, el siguiente no puede decidir. Los niveles posibles son Pendiente, Aprobado, Rechazado o Cancelado.',
    relation:
      'Es acumulativo: un monto alto pasa por todos los niveles cuyo «monto desde» alcance. Una misma persona no puede decidir dos niveles ni aprobar su propia requisición. Un rechazo cancela los niveles restantes.',
  },
  'detalle.presupuesto': {
    title: 'Presupuesto del área',
    body: 'Muestra el presupuesto del área para el mes (o el año): monto, consumido por requisiciones aprobadas, comprometido por las que están en trámite y disponible.',
    relation:
      'Es informativo para ayudar a decidir. Cuando se alcanza el umbral de alerta o se supera el presupuesto se avisa, pero no se impide aprobar. Se configura en Configuración > Presupuestos.',
  },
  'detalle.timeline': {
    title: 'Historial',
    body: 'Registro cronológico de todo lo ocurrido: creación, edición, envío, decisiones, retiros, reaperturas, cancelación y reasignaciones.',
    relation: 'Es inmutable: solo se agregan eventos, nunca se editan ni se borran. Sirve de auditoría.',
  },

  // ---------------------------------------------------------------- Actions
  'accion.enviar': {
    title: 'Enviar',
    body: 'Envía el borrador a aprobación: se calculan y congelan los niveles según el monto y se notifica al primer nivel.',
    relation:
      'La ven el creador o solicitante (o un supervisor con permiso de gestionar todo) con la requisición en Borrador. Falla si no hay reglas aplicables o si algún nivel no tendría un aprobador distinto del creador.',
  },
  'accion.editar': {
    title: 'Editar',
    body: 'Abre el formulario para modificar el borrador (el tipo no se puede cambiar).',
    relation: 'Solo se edita en estado Borrador. Si ya fue enviada, primero hay que retirarla.',
  },
  'accion.eliminar': {
    title: 'Eliminar',
    body: 'Elimina el borrador. Se pide confirmación antes de hacerlo.',
    relation: 'Solo existe para borradores y para el creador o solicitante. Una requisición ya enviada no se elimina: se cancela.',
  },
  'accion.aprobar': {
    title: 'Aprobar',
    body: 'Aprueba el nivel actual. Si hay más niveles, pasa al siguiente; si era el último, la requisición queda Aprobada.',
    relation:
      'La ve solo el aprobador del nivel actual: no el creador ni el solicitante ni quien ya decidió otro nivel. Si la requisición cambió mientras la mirabas, el sistema pide recargar antes de decidir.',
  },
  'accion.rechazar': {
    title: 'Rechazar',
    body: 'Rechaza el nivel actual con una observación obligatoria. Cancela los niveles restantes y la requisición queda Rechazada.',
    relation: 'La ve solo el aprobador del nivel actual. El creador puede luego reabrirla para corregirla y volver a enviarla.',
  },
  'accion.retirar': {
    title: 'Retirar',
    body: 'Devuelve a Borrador una requisición enviada o en aprobación, con una observación, para poder corregirla.',
    relation:
      'La ve el creador o solicitante. Los niveles de la ronda anterior quedan como historial y se vuelven a calcular al enviar de nuevo.',
  },
  'accion.reabrir': {
    title: 'Reabrir',
    body: 'Devuelve a Borrador una requisición rechazada, con una observación, para ajustarla y volver a enviarla.',
    relation: 'La ve el creador o solicitante. Al reenviar, empieza una nueva ronda de aprobación.',
  },
  'accion.cancelar': {
    title: 'Cancelar requisición',
    body: 'Cierra la requisición de forma definitiva, indicando el motivo. Una requisición cancelada no vuelve a abrirse.',
    relation: 'Requiere permiso de cancelar y es posible desde cualquier estado que no sea terminal. Queda en el historial con su motivo.',
  },
  'accion.reasignar': {
    title: 'Reasignar aprobadores',
    body: 'Cambia quiénes pueden decidir un nivel pendiente, por ejemplo si el aprobador está ausente.',
    relation:
      'La ve quien tiene permiso de gestionar todas las requisiciones, solo con la requisición en aprobación. No puede asignarse a sí mismo. Una decisión abierta en otra pantalla puede quedar desactualizada y pedirá recargar.',
  },
  'modal.nivel': {
    title: 'Nivel a reasignar',
    body: 'Elige el nivel pendiente cuyos aprobadores quieres cambiar. Los niveles ya decididos no se pueden reasignar.',
  },
  'modal.aprobadores': {
    title: 'Aprobadores del nivel',
    body: 'Usuarios que podrán decidir ese nivel. Reemplazan a los actuales; debe quedar al menos uno y tú no puedes incluirte.',
    relation: 'Quedan registrados en el historial como «Aprobadores reasignados».',
  },
  'modal.observacion': {
    title: 'Observación o motivo',
    body: 'Texto obligatorio que queda en el historial y se muestra a las demás personas involucradas.',
  },

  // ---------------------------------------------------------------- Configuration fields
  'area.codigo': {
    title: 'Código del área',
    body: 'Identificador corto y único del área. Se define al crearla y no se puede cambiar después.',
  },
  'area.jefes': {
    title: 'Jefes del área',
    body: 'Usuarios que aprueban el nivel «Jefe de área» de las requisiciones de esta área (hasta 10).',
    relation: 'Si un nivel de tipo «Jefe de área» no tiene un jefe elegible distinto del creador y del solicitante, la requisición no puede enviarse.',
  },
  'area.activa': {
    title: 'Área activa',
    body: 'Solo las áreas activas se ofrecen al crear requisiciones o presupuestos.',
    relation: 'Una requisición ya creada conserva su área aunque luego se desactive. Si el área está en uso no se elimina: se desactiva.',
  },
  'tipo.codigo': {
    title: 'Código del tipo',
    body: 'Identificador corto y único. No se puede cambiar una vez creado.',
    relation: 'El tipo de una requisición también es inmutable, así que renombrar el código no afectaría a las existentes.',
  },
  'tipo.activo': {
    title: 'Tipo activo',
    body: 'Solo los tipos activos se ofrecen al crear una requisición.',
    relation: 'Las requisiciones existentes de un tipo desactivado se conservan. Si está en uso, no se elimina: se desactiva.',
  },
  'regla.orden': {
    title: 'Orden del nivel',
    body: 'Posición del nivel en la cadena de aprobación: se aprueba primero el orden menor. Debe ser único entre las reglas activas.',
    relation: 'Un monto inicial mayor debe tener un orden mayor, para que los niveles altos se aprueben después de los bajos.',
  },
  'regla.montoDesde': {
    title: 'Monto desde',
    body: 'Monto estimado a partir del cual este nivel aplica (incluido). Una requisición pasa por todos los niveles activos cuyo monto desde sea menor o igual a su monto.',
    relation: 'Los rangos son semiabiertos [desde, hasta): el valor «hasta» de un nivel puede ser el «desde» del siguiente sin traslape.',
  },
  'regla.montoHasta': {
    title: 'Monto hasta',
    body: 'Límite superior informativo del rango; déjalo vacío si no tiene límite. Debe ser mayor que el monto desde y los rangos activos no deben traslaparse.',
    relation: 'Los niveles se deciden por «monto desde» de forma acumulativa, así que este valor sirve sobre todo para documentar y validar la coherencia.',
  },
  'regla.aprobadorTipo': {
    title: 'Tipo de aprobador',
    body: 'Define quién decide el nivel: los jefes del área de la requisición, los usuarios de un rol o usuarios específicos.',
    relation:
      'Todo aprobador debe tener el permiso de aprobar requisiciones. En ningún caso pueden decidir el creador ni el solicitante de la requisición. Los aprobadores de la requisición se fijan al enviarla.',
  },
  'regla.activa': {
    title: 'Nivel activo',
    body: 'Solo los niveles activos se tienen en cuenta al enviar una requisición.',
    relation: 'Desactivarlo no afecta a las requisiciones que ya están en aprobación: conservan sus niveles.',
  },
  'pres.filtroArea': {
    title: 'Filtrar por área',
    body: 'Muestra solo los presupuestos del área elegida.',
  },
  'pres.filtroPeriodo': {
    title: 'Filtrar por período',
    body: 'Escribe el período completo: AAAA para un año (2026) o AAAA-MM para un mes (2026-03).',
  },
  'pres.area': {
    title: 'Área del presupuesto',
    body: 'Área a la que pertenece el presupuesto. Junto con el período es su identidad, por eso no se cambian al editar.',
  },
  'pres.periodo': {
    title: 'Período',
    body: 'Año (2026) o mes (2026-03) que cubre el presupuesto. Para el aprobador se muestra el del mes actual y, si no existe, el del año.',
  },
  'pres.monto': {
    title: 'Monto del presupuesto',
    body: 'Cantidad asignada al área para el período.',
    relation: 'Se compara con lo consumido (requisiciones aprobadas) y lo comprometido (en trámite) para calcular lo disponible.',
  },
  'pres.umbral': {
    title: 'Umbral de alerta',
    body: 'Porcentaje de uso (1 a 100) a partir del cual se muestra una alerta al aprobador. Por defecto 80.',
    relation: 'Es solo un aviso: nunca bloquea enviar ni aprobar.',
  },
  'pres.ejecucion': {
    title: 'Ejecución del presupuesto',
    body: 'Consumido: requisiciones aprobadas del período. Comprometido: las enviadas o en aprobación. Disponible: lo que queda.',
    relation: 'Se calcula al consultar a partir de las requisiciones; no se guarda.',
  },

  // ---------------------------------------------------------------- Estados
  'estado.Borrador': {
    title: 'Borrador',
    body: 'Editable. Es el estado inicial, y al que vuelve una requisición retirada o reabierta.',
  },
  'estado.Enviada': {
    title: 'Enviada',
    body: 'Estado transitorio: pasa a «En aprobación» en el mismo momento del envío.',
  },
  'estado.En_Aprobacion': {
    title: 'En aprobación',
    body: 'Tiene niveles pendientes. Para editarla hay que retirarla primero.',
  },
  'estado.Aprobada': {
    title: 'Aprobada',
    body: 'Todos los niveles aprobaron. En esta fase es el último estado del flujo; el resto del proceso de compra llega en fases posteriores.',
  },
  'estado.Rechazada': {
    title: 'Rechazada',
    body: 'Un nivel la rechazó con una observación. Se puede reabrir a Borrador para corregirla.',
  },
  'estado.Cancelada': {
    title: 'Cancelada',
    body: 'Cerrada definitivamente con un motivo. No se puede reabrir.',
  },

  // ---------------------------------------------------------------- Timeline events
  'evento.CREADA': { title: 'Requisición creada', body: 'Se guardó la requisición por primera vez, como borrador.' },
  'evento.EDITADA': { title: 'Requisición editada', body: 'Se modificaron los datos o las líneas del borrador.' },
  'evento.ENVIADA': { title: 'Requisición enviada', body: 'El creador o solicitante la envió a aprobación.' },
  'evento.APROBACION_SOLICITADA': {
    title: 'Aprobación solicitada',
    body: 'El sistema fijó los niveles según el monto y avisó a los aprobadores del nivel actual.',
  },
  'evento.NIVEL_APROBADO': { title: 'Nivel aprobado', body: 'Un aprobador autorizó su nivel. Si quedan niveles, sigue el siguiente.' },
  'evento.NIVEL_RECHAZADO': { title: 'Nivel rechazado', body: 'Un aprobador rechazó su nivel con una observación; los niveles restantes se cancelan.' },
  'evento.APROBADA': { title: 'Requisición aprobada', body: 'Todos los niveles aprobaron: la requisición quedó Aprobada.' },
  'evento.RECHAZADA': { title: 'Requisición rechazada', body: 'La requisición quedó Rechazada tras el rechazo de un nivel.' },
  'evento.RETIRADA': { title: 'Requisición retirada', body: 'Volvió a Borrador para corregirla. Los niveles anteriores quedan como historial.' },
  'evento.REABIERTA': { title: 'Requisición reabierta', body: 'Una requisición rechazada volvió a Borrador para ajustarla y reenviarla.' },
  'evento.CANCELADA': { title: 'Requisición cancelada', body: 'Se cerró definitivamente con un motivo.' },
  'evento.APROBADORES_REASIGNADOS': {
    title: 'Aprobadores reasignados',
    body: 'Un supervisor cambió los aprobadores de un nivel pendiente.',
  },
  'evento.ELIMINADA': { title: 'Requisición eliminada', body: 'El borrador fue eliminado.' },

  // ---------------------------------------------------------------- Guide / key concepts
  'guia.creacion': {
    title: '1. Creación',
    body: 'Creas la requisición como borrador: eliges tipo y área, escribes la justificación y agregas líneas (del inventario o en texto libre) con su precio estimado.',
    relation: 'El tipo y el área vienen de Configuración. El monto estimado sale de la suma de las líneas.',
  },
  'guia.envio': {
    title: '2. Envío',
    body: 'Al enviarla, el sistema calcula los niveles de aprobación según el monto, los congela y avisa a los aprobadores del primer nivel.',
    relation: 'Los niveles salen de las reglas de aprobación; si no hay reglas aplicables o un nivel no tiene aprobador elegible, el envío se rechaza.',
  },
  'guia.niveles': {
    title: '3. Niveles de aprobación',
    body: 'Los niveles se aprueban en orden. Los montos altos acumulan más niveles (por ejemplo jefe de área y luego dirección).',
    relation: 'Quien aprueba ve también el presupuesto del área, que es informativo.',
  },
  'guia.decision': {
    title: '4. Aprobación o rechazo',
    body: 'Si todos los niveles aprueban, queda Aprobada. Si uno rechaza, queda Rechazada con su observación y el creador puede reabrirla y reenviarla.',
    relation: 'Mientras está en aprobación, el creador puede retirarla para corregirla y cualquier requisición no terminal puede cancelarse.',
  },
  'guia.fases': {
    title: '5. Próximas fases',
    body: 'En esta fase el flujo termina en Aprobada. Después vendrán almacén y vales de salida, compras y licitación, orden de compra y recepción, y reportes.',
    relation: 'Almacén, compras, órdenes de compra y recepción aún no están disponibles.',
  },
  'modulo.permisos': {
    title: 'Quién puede hacer qué',
    body: 'El creador y el solicitante envían, editan, retiran y reabren su requisición; quien tiene permiso de gestionar todo puede hacerlo sobre cualquiera y reasignar aprobadores.',
    relation: 'Aprobar requiere el permiso de aprobar y ser elegible en el nivel actual según la regla.',
  },
  'modulo.separacion': {
    title: 'Separación de funciones',
    body: 'Nadie aprueba su propia requisición: ni el creador ni el solicitante, y una misma persona no decide dos niveles de la misma requisición.',
  },
  'modulo.version': {
    title: 'Cambios simultáneos',
    body: 'Si la requisición cambió mientras la mirabas (por ejemplo, otro aprobador decidió), el sistema rechaza tu decisión y recarga para que decidas sobre lo último.',
  },
  'modulo.notificaciones': {
    title: 'Notificaciones',
    body: 'Cada evento (envío, decisión, rechazo, cancelación) puede avisar dentro del sistema y por correo a aprobadores, jefe del área, creador y solicitante.',
    relation: 'Las reglas de notificación se configuran aparte, en las preferencias y reglas de notificaciones del sistema.',
  },
  'modulo.premium': {
    title: 'Módulo premium',
    body: 'Requisiciones es una capacidad que se activa por organización desde el panel de plataforma. Al apagarla se oculta y bloquea, pero los datos se conservan.',
  },
} as const satisfies Record<string, HelpEntry>;

export type HelpId = keyof typeof HELP;

export const REQUISICION_HELP: Record<HelpId, HelpEntry> = HELP;

export const getHelp = (id: HelpId): HelpEntry => REQUISICION_HELP[id];

/** Order and ids of the end-to-end flow shown in the "Guía del módulo". */
export const GUIA_PASOS: HelpId[] = ['guia.creacion', 'guia.envio', 'guia.niveles', 'guia.decision', 'guia.fases'];

/** Cross-cutting concepts listed at the end of the guide. */
export const GUIA_CONCEPTOS: HelpId[] = [
  'modulo.permisos',
  'modulo.separacion',
  'modulo.version',
  'modulo.notificaciones',
  'modulo.premium',
];

/** Estados in flow order, used by the legend. */
export const ESTADO_HELP_IDS: HelpId[] = [
  'estado.Borrador',
  'estado.Enviada',
  'estado.En_Aprobacion',
  'estado.Aprobada',
  'estado.Rechazada',
  'estado.Cancelada',
];

/** Help id of a timeline event type, when the catalog has one. */
export const eventHelpId = (tipo: string): HelpId | undefined => {
  const id = `evento.${tipo}`;
  return id in REQUISICION_HELP ? (id as HelpId) : undefined;
};
