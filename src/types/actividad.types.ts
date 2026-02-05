export interface ActividadMtto {
  _id?: string;
  Status?: string;
  Nombre: string;
  Descripcion?: string;
  EsObligatoria?: boolean;
  StatusReason?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: any;
}

export interface CreateActividadDto {
  Nombre: string;
  Descripcion?: string;
  EsObligatoria?: boolean;
}

export interface UpdateActividadDto extends Partial<CreateActividadDto> {}
