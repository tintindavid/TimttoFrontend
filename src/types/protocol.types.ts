import { ActividadMtto } from "./actividad.types";

export interface ProtocolMtto {
  _id?: string;
  tenantId?: string;
  Descripcion?: string;
  nombre?: string;
  actividadesMtto?: ActividadMtto[]; // Array of ActividadMtto IDs
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProtocolDto {
  Descripcion?: string;
  nombre?: string;
  actividadesMtto?: string[]; // Array of activity IDs
}

export interface UpdateProtocolDto {
  Descripcion?: string;
  nombre?: string;
  actividadesMtto?: string[]; // Array of activity IDs
}