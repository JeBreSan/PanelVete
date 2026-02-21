"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin } from "@/services/authService";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identificacion, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function setCookie(name: string, value: string) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax`;
  }

  async function onLogin() {
    setErr(null);
    if (!identificacion.trim() || !password.trim()) {
      setErr("Completá identificación y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const r = await apiLogin(identificacion.trim(), password);

      const u = r.usuario;
      if (!u) throw new Error("Respuesta inválida del servidor (sin usuario).");

      if (u.rol !== "admin") {
        throw new Error("Prohibido. Solo admin puede entrar al panel.");
      }

      // ✅ guardamos sesión mínima (después lo migramos a JWT)
      setCookie("vf_uid", String(u.id));
setCookie("vf_rol", String(u.rol));
setCookie("vf_nombre", String(u.nombre || "Usuario"));

      router.replace("/admin");
    } catch (e: any) {
      setErr(e?.message ?? "Error en login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Login Admin</h1>

      <label>Identificación</label>
      <input
        value={identificacion}
        onChange={(e) => setIdentificacion(e.target.value)}
        placeholder="ej: 1-2345-6789"
        style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
      />

      <label>Contraseña</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
      />

      <button onClick={onLogin} disabled={loading} style={{ padding: 10, width: "100%" }}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}

      <p style={{ color: "#666", marginTop: 12 }}>
        Nota: este login usa /auth/login igual que la app móvil. Luego migramos a token/JWT.
      </p>
    </div>
  );
}
