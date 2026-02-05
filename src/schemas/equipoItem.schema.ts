import * as yup from 'yup';

export const createEquipoItemSchema = yup.object({
  Equipment: yup.string().required('Equipo es requerido'),
  ClienteId: yup.string().required('Cliente es requerido'),
  Marca: yup.string().nullable(),
  Serie: yup.string().nullable(),
  Servicio: yup.string().nullable(),
  Status: yup.string().oneOf(['active', 'inactive', 'maintenance']).nullable(),
  Area: yup.string().nullable(),
  Modelo: yup.string().nullable(),
});

export const updateEquipoItemSchema = createEquipoItemSchema.partial();
