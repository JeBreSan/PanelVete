"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin } from "@/services/authService";

export default function AdminLoginPage() {
  const router = useRouter();

  const [identificacion, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLogin() {
    setErr(null);
    if (!identificacion.trim() || !password) {
      setErr("Completá identificación y contraseña.");
      return;
    }
    if (loading) return;

    setLoading(true);
    const r = await apiLogin(identificacion.trim(), password);
    setLoading(false);

    if (!r.ok) {
      setErr(r.message || "Credenciales incorrectas.");
      return;
    }

    // ✅ compatible con distintas formas de respuesta
    const data: any = r.data ?? {};
    const u = data.user ?? data.usuario ?? data.data?.user ?? data.data?.usuario ?? data;

    if (!u) {
      setErr("Respuesta inválida del servidor (sin usuario).");
      return;
    }

    const rol = String(u?.rol ?? data?.rol ?? "usuario");
    if (rol !== "admin") {
      setErr("Prohibido. Solo admin puede entrar al panel.");
      return;
    }

    router.replace("/admin/usuarios");
  }

  return (
    <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 6 }}>Login</h2>
      <p style={{ marginTop: 0, opacity: 0.85 }}>Ingresá tu identificación y contraseña.</p>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Usuario (Identificación)</span>
          <input
            value={identificacion}
            onChange={(e) => setIdentificacion(e.target.value)}
            placeholder="ej: 1-2345-6789"
            style={{
              height: 44,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.10)",
              color: "#fff",
              padding: "0 12px",
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              height: 44,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.10)",
              color: "#fff",
              padding: "0 12px",
              outline: "none",
            }}
          />
        </label>

        <button
          onClick={onLogin}
          disabled={loading}
          style={{
            height: 46,
            borderRadius: 12,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        {err ? (
          <div style={{ marginTop: 6, color: "#ffb3b3", fontWeight: 700 }}>{err}</div>
        ) : null}
      </div>
    </div>
  );
}
