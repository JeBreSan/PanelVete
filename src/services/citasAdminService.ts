import { getAdminHeaders, request } from "./_headers";

export type AgendaRegla = {
  id: number;
  tipo: "SIEMPRE_ABIERTO" | "CERRADO" | "HORARIO_ESPECIAL";
  inicio: string | null;
  fin: string | null;
  activo: boolean;
  nota: string | null;
};

export type CitaAdmin = {
  id: number;
  propietario_id: number;
  mascota_id: number;
  inicio: string;
  comentario: string | null;
  estado: "programada" | "cancelada" | "completada";
  created_at: string;
  updated_at: string;
  mascota_nombre?: string;
  propietario_nombre?: string;
};

export type MascotaAdminMini = { id: number; nombre: string; especie?: string; raza?: string; edad?: string | null };

export async function apiAdminListarPropietarios() {
  const h = getAdminHeaders();
  return request<Array<{ id: number; identificacion: string; nombre: string }>>(
    `/admin/propietarios`,
    { method: "GET" },
    h
  );
}

export async function apiAdminListarMascotasDePropietario(propietarioId: number) {
  const h = getAdminHeaders();
  return request<Array<{ id: number; nombre: string; especie: string }>>(
    `/admin/propietarios/${propietarioId}/mascotas`,
    { method: "GET" },
    h
  );
}

export async function apiAdminListarReglasAgenda(inicioISO: string, finISO: string): Promise<AgendaRegla[]> {
  const h = getAdminHeaders();
  return request<AgendaRegla[]>(
    `/agenda/reglas?inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`,
    { method: "GET" },
    h
  );
}

export async function apiAdminListarCitasOcupadas(inicioISO: string, finISO: string): Promise<Array<{ inicio: string }>> {
  const h = getAdminHeaders();
  return request<Array<{ inicio: string }>>(
    `/citas/ocupadas?inicio=${encodeURIComponent(inicioISO)}&fin=${encodeURIComponent(finISO)}`,
    { method: "GET" },
    h
  );
}

export async function apiAdminListarProximasCitas(propietarioId: number): Promise<CitaAdmin[]> {
  const h = getAdminHeaders();
  return request<CitaAdmin[]>(
    `/admin/propietarios/${propietarioId}/citas/proximas`,
    { method: "GET" },
    h
  );
}

export async function apiAdminCrearCita(propietarioId: number, data: { mascota_id: number; inicioISO: string; comentario?: string }) {
  const h = getAdminHeaders();
  return request<CitaAdmin>(
    `/admin/propietarios/${propietarioId}/citas`,
    {
      method: "POST",
      body: JSON.stringify({
        mascota_id: data.mascota_id,
        inicio: data.inicioISO,
        comentario: data.comentario ?? "",
      }),
    },
    h
  );
}

export async function apiAdminReprogramarCita(propietarioId: number, citaId: number, inicioISO: string) {
  const h = getAdminHeaders();
  return request<CitaAdmin>(
    `/admin/propietarios/${propietarioId}/citas/${citaId}/reprogramar`,
    { method: "PUT", body: JSON.stringify({ inicio: inicioISO }) },
    h
  );
}

export async function apiAdminCancelarCita(propietarioId: number, citaId: number) {
  const h = getAdminHeaders();
  return request<{ ok: true }>(
    `/admin/propietarios/${propietarioId}/citas/${citaId}/cancelar`,
    { method: "PUT" },
    h
  );
}

export async function apiAdminEliminarCita(propietarioId: number, citaId: number) {
  const h = getAdminHeaders();
  return request<{ ok: true }>(
    `/admin/propietarios/${propietarioId}/citas/${citaId}`,
    { method: "DELETE" },
    h
  );
}

export type AtenderPayload = {
  tipo?: "consulta" | "diagnostico" | "nota" | "procedimiento" | "resultado" | "vacuna";
  titulo: string;
  notas?: string;
  diagnostico?: string;
  medicamentos?: string;
  recomendaciones?: string;
};

export async function apiAdminAtenderCita(propietarioId: number, citaId: number, payload: AtenderPayload) {
  const h = getAdminHeaders();
  return request<any>(
    `/admin/propietarios/${propietarioId}/citas/${citaId}/atender`,
    { method: "POST", body: JSON.stringify(payload) },
    h
  );
}

export async function apiAdminHistorialMascota(propietarioId: number, mascotaId: number) {
  const h = getAdminHeaders();
  return request<any[]>(
    `/admin/propietarios/${propietarioId}/mascotas/${mascotaId}/historial`,
    { method: "GET" },
    h
  );
}
// ✅ Alias para compatibilidad con SelectorMascota
export const apiAdminListarMascotasPropietario = apiAdminListarMascotasDePropietario;

