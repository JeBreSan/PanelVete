"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin } from "@/services/authService";

export default function AdminLoginPage() {
  const router = useRouter();

  const [identificacion, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const saludo = useMemo(() => {
    return "Bienvenido al Panel de Gestión";
  }, []);

  async function onLogin() {
    setErr(null);

    if (!identificacion.trim() || !password) {
      setErr("Completá identificación y contraseña.");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const r = await apiLogin(identificacion.trim(), password);

      if (!r.ok) {
        setErr(r.message || "Credenciales incorrectas.");
        return;
      }

      const data: any = r.data ?? {};
      const u = data.user ?? data.usuario ?? data.data?.user ?? data.data?.usuario ?? data;

      if (!u) {
        setErr("Respuesta inválida del servidor (sin usuario).");
        return;
      }

      const rol = String(u?.rol ?? data?.rol ?? "usuario");

      // ✅ por ahora: solo admin
      if (rol !== "admin") {
        setErr("Prohibido. Solo admin puede entrar al panel.");
        return;
      }

      router.replace("/admin/usuarios");
    } catch (e: any) {
      setErr(e?.message ?? "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={{ ...styles.shell }} className="vf-shell">
        {/* LEFT / BRAND */}
        <section style={styles.left}>
          <div style={styles.logoBox}>
            <div style={styles.logoInner}>VetFarm Admin</div>
          </div>

          <div style={styles.title}>{saludo}</div>

          <div style={styles.subtitle}>
            Ingresá para administrar usuarios, mascotas, citas e historial clínico.
          </div>

          <div style={styles.smallNote}>VetFarm • Admin</div>
        </section>

        {/* RIGHT / FORM */}
        <section style={styles.right}>
          <div style={styles.formTitle}>Login</div>
          <div style={styles.formHint}>Ingresá tu identificación y contraseña.</div>

          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            <label style={styles.label}>
              <span style={styles.labelText}>Usuario (Identificación)</span>
              <input
                value={identificacion}
                onChange={(e) => setIdentificacion(e.target.value)}
                placeholder="ej: 1-2345-6789"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
              />
            </label>

            <button
              onClick={onLogin}
              disabled={loading}
              style={{
                ...styles.btn,
                opacity: loading ? 0.8 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (loading) return;
                (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.03)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = "none";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
              }}
              onMouseDown={(e) => {
                if (loading) return;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px) scale(0.99)";
              }}
              onMouseUp={(e) => {
                if (loading) return;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px) scale(1)";
              }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            {err ? <div style={styles.error}>• {err}</div> : null}
          </div>
        </section>
      </div>

      <style jsx>{`
        @media (max-width: 880px) {
          .vf-shell {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "linear-gradient(135deg,#5b4ae6,#2aa7c9)",
  },
  shell: {
  width: "min(900px, 100%)",
  display: "grid",
  gridTemplateColumns: "1.1fr 1fr",
  gap: 16,
  padding: 14,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(20,20,30,0.25)",
  boxShadow: "0 18px 60px rgba(0,0,0,.28)",
  backdropFilter: "blur(10px)",
  alignItems: "center",
},
  left: {
  borderRadius: 18,
  padding: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,.92)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 10,
  minHeight: 320,
},
 right: {
  borderRadius: 18,
  padding: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,0.16)",
  color: "rgba(255,255,255,.92)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: 320,
},
logoBox: {
  width: "100%",
  height: 62,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(0,0,0,0.18)",
},
  logoInner: {
  fontWeight: 1000,
  fontSize: 18,
  letterSpacing: 1.2,
  textTransform: "uppercase",
},
  title: {
    fontSize: 26,
    fontWeight: 1000,
    lineHeight: 1.15,
  },
  subtitle: {
    opacity: 0.86,
    fontWeight: 800,
    lineHeight: 1.5,
  },
  smallNote: {
    opacity: 0.7,
    fontWeight: 800,
    marginTop: 10,
  },
 
  formTitle: {
    fontSize: 18,
    fontWeight: 1000,
  },
  formHint: {
    opacity: 0.85,
    fontWeight: 800,
    marginTop: 6,
  },
  label: {
    display: "grid",
    gap: 6,
  },
  labelText: {
    fontWeight: 900,
  },
  input: {
    height: 46,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.20)",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    padding: "0 12px",
    outline: "none",
    fontWeight: 800,
  },
  btn: {
  height: 46,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#7c4dff,#00c896)",
  color: "white",
  fontWeight: 1000,
  letterSpacing: 0.5,
  transition: "all .15s ease",
  boxShadow: "0 8px 20px rgba(0,0,0,.25)",
},
  error: {
    marginTop: 6,
    color: "#ffb3b3",
    fontWeight: 800,
  },
};