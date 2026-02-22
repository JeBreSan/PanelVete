const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Cookie helper (client only) */
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export function getAdminHeaders() {
  const h: Record<string, string> = { "Content-Type": "application/json" };

  // token opcional si lo usás
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) h["Authorization"] = `Bearer ${token}`;

  // ✅ claves para tu API Admin
  const uid = getCookie("vf_uid");
  const rol = getCookie("vf_rol");

  if (uid) h["x-user-id"] = uid;
  if (rol) h["x-user-rol"] = rol;

  return h;
}

async function safeJson(res: Response, url: string) {
  const text = await res.text();

  // Si el backend devolvió HTML (Next 404 / reverse proxy / etc.)
  if (text.trim().startsWith("<")) {
    throw new Error(`API devolvió HTML. URL: ${url} (HTTP ${res.status})`);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Respuesta no es JSON. URL: ${url} (HTTP ${res.status}) Body: ${text.slice(0, 200)}`);
  }
}

export async function request<T>(path: string, init?: RequestInit, headers?: Record<string, string>) {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(headers ?? {}),
      ...(init?.headers as any),
    },
    cache: "no-store",
  });

  const data = await safeJson(res, url);

  if (!res.ok) {
    throw new Error(data?.message || data?.mensaje || data?.error || `HTTP ${res.status}`);
  }

  return data as T;
}
