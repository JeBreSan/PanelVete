import React from "react";
import Link from "next/link";

export const metadata = {
  title: "VetFarm Admin",
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg,#5b4ae6,#2aa7c9)",
      }}
    >
      <aside
        style={{
          width: 220,
          padding: 16,
          background: "rgba(0,0,0,0.20)",
          borderRight: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18 }}>VetFarm Admin</div>

        <nav style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <Link style={linkStyle} href="/admin/usuarios">Usuarios</Link>
          <Link style={linkStyle} href="/admin/mascotas">Mascotas</Link>
          <Link style={linkStyle} href="/admin/citas">Citas</Link>
          <Link style={linkStyle} href="/admin/historial">Historial</Link>

          {/* ✅ Logout más arriba (debajo del menú) */}
          <Link
            href="/admin/logout"
            style={{
              ...linkStyle,
              marginTop: 10,
              background: "linear-gradient(90deg,#ff3b3b,#ff7a3b)",
              border: "none",
              textAlign: "center",
            }}
          >
            Cerrar sesión
          </Link>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: 18 }}>
        <div
          style={{
            background: "rgba(20,20,30,0.25)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 18,
            padding: 16,
            minHeight: "calc(100vh - 36px)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
};