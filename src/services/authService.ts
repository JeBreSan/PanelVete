export type LoginResponse = {
  mensaje?: string;
  usuario?: {
    id: number;
    identificacion: string;
    nombre: string;
    telefono?: string | null;
    correo?: string | null;
    rol: "admin" | "usuario";
  };
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function parseErrorText(raw: string) {
  try {
    const j = JSON.parse(raw);
    return j?.mensaje || j?.message || j?.error || raw;
  } catch {
    return raw;
  }
}

export async function apiLogin(identificacion: string, password: string): Promise<LoginResponse> {
  if (!BASE_URL) throw new Error("Falta NEXT_PUBLIC_API_BASE_URL en .env.local");

  const r = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identificacion, password }),
  });

  const raw = await r.text();
  if (!r.ok) throw new Error(parseErrorText(raw) || `Error HTTP ${r.status}`);

  return JSON.parse(raw) as LoginResponse;
}
