// src/services/propietariosService.ts
export type Propietario = {
  id: number;
  identificacion: string;
  nombre: string;
  telefono: string | null;
  correo: string;
  rol: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PropietarioCrear = {
  identificacion: string;
  nombre: string;
  telefono?: string | null;
  correo: string;
  password: string;
  rol?: string; // si el backend lo ignora, no pasa nada
};

export type PropietarioActualizar = {
  identificacion?: string;
  nombre?: string;
  telefono?: string | null;
  correo?: string;
  password?: string; // opcional (solo si querés resetear)
  rol?: string;
  activo?: boolean;
};

function getBaseUrl() {
  // No tocamos infraestructura: usamos lo que ya venís usando.
  // Si ya tenés otra forma, sustituí solo esta función.
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

function authHeaders() {
  // Copiamos lógica típica: token + headers de rol si ya los estás usando.
  // Ajustá el storage key si tu login guarda en otro nombre.
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

  const userRol =
    typeof window !== "undefined" ? localStorage.getItem("user_rol") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (userId) headers["x-user-id"] = userId;
  if (userRol) headers["x-user-rol"] = userRol;

  return headers;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ? (init.headers as Record<string, string>) : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Error HTTP ${res.status} (${res.statusText})`;
    throw new Error(msg);
  }

  return data as T;
}

// ✅ LISTAR (activos + inactivos). Si tu backend filtra por defecto, igual sirve.
export async function apiListarPropietarios(): Promise<Propietario[]> {
  return http<Propietario[]>("/propietarios", { method: "GET" });
}

// ✅ CREAR
export async function apiCrearPropietario(
  body: PropietarioCrear
): Promise<Propietario> {
  return http<Propietario>("/propietarios", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ✅ ACTUALIZAR
export async function apiActualizarPropietario(
  id: number,
  body: PropietarioActualizar
): Promise<Propietario> {
  return http<Propietario>(`/propietarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ✅ SOFT DELETE
export async function apiDesactivarPropietario(id: number): Promise<Propietario> {
  return apiActualizarPropietario(id, { activo: false });
}

// ✅ RESTORE
export async function apiReactivarPropietario(id: number): Promise<Propietario> {
  return apiActualizarPropietario(id, { activo: true });
}