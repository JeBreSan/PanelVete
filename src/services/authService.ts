const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/; samesite=lax`;
}

type LoginResponse = {
  ok: boolean;
  message?: string;
  data?: any;
};

export async function apiLogin(identificacion: string, password: string): Promise<LoginResponse> {
  if (!API_URL) return { ok: false, message: "Falta NEXT_PUBLIC_API_URL en .env.local" };

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ identificacion, password }),
    });

    const text = await res.text();
    let json: any = null;

    if (text && !text.trim().startsWith("<")) {
      try { json = JSON.parse(text); } catch { /* ignore */ }
    }

    if (!res.ok) {
      return { ok: false, message: json?.mensaje || json?.message || json?.error || `HTTP ${res.status}`, data: json };
    }

    const data = json ?? {};
    const u = data.user ?? data.usuario ?? data.data?.user ?? data.data?.usuario ?? data;

    const id = Number(u?.id ?? data?.id ?? 0);
    const rol = String(u?.rol ?? data?.rol ?? "usuario");
    const nombre = String(u?.nombre ?? data?.nombre ?? "Usuario");

    if (id > 0) setCookie("vf_uid", String(id));
    if (rol) setCookie("vf_rol", rol);
    if (nombre) setCookie("vf_nombre", nombre);

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, message: e?.message || "Error de red" };
  }
}

export function apiLogout() {
  clearCookie("vf_uid");
  clearCookie("vf_rol");
  clearCookie("vf_nombre");
}
