// src/services/usuariosService.ts
export type Propietario = {
  id: number;
  identificacion: string;
  nombre: string;
  telefono: string | null;
  correo: string;
  rol: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PropietarioCrear = {
  identificacion: string;
  nombre: string;
  telefono?: string | null;
  correo: string;
  password: string;
  rol?: string;
};

export type PropietarioActualizar = {
  identificacion?: string;
  nombre?: string;
  telefono?: string | null;
  correo?: string;
  password?: string;
  rol?: string;
  activo?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ===============================
   COOKIES (login admin)
================================= */
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`
    )
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function getHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const userId = getCookie("vf_uid");
  const userRol = getCookie("vf_rol");

  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) h["Authorization"] = `Bearer ${token}`;
  if (userId) h["x-user-id"] = userId;
  if (userRol) h["x-user-rol"] = userRol;

  return h;
}

/* ===============================
   REQUEST BASE
================================= */
async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...getHeaders(),
      ...(init?.headers as any),
    },
    cache: "no-store",
  });

  const text = await res.text();

  // Si el backend devolvió HTML
  if (text.trim().startsWith("<")) {
    throw new Error(
      `API devolvió HTML. URL: ${url} (HTTP ${res.status})`
    );
  }

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Respuesta no es JSON. URL: ${url} (HTTP ${res.status}) Body: ${text.slice(
        0,
        200
      )}`
    );
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `HTTP ${res.status} Body: ${text.slice(0, 200)}`
    );
  }

  return data as T;
}

/* ===============================
   ENDPOINTS
================================= */

// LISTAR
export async function apiListarPropietarios(): Promise<
  Propietario[]
> {
  return request<Propietario[]>("/usuarios", {
    method: "GET",
  });
}

// CREAR
export async function apiCrearPropietario(
  body: PropietarioCrear
): Promise<Propietario> {
  return request<Propietario>("/usuarios", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ACTUALIZAR
export async function apiActualizarPropietario(
  id: number,
  body: PropietarioActualizar
): Promise<Propietario> {
  return request<Propietario>(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// SOFT DELETE
export async function apiDesactivarPropietario(
  id: number
): Promise<Propietario> {
  return apiActualizarPropietario(id, { activo: false });
}

// RESTORE
export async function apiReactivarPropietario(
  id: number
): Promise<Propietario> {
  return apiActualizarPropietario(id, { activo: true });
}