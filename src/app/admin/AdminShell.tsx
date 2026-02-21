"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/; samesite=lax`;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [nombre, setNombre] = useState<string>("");

  useEffect(() => {
    setNombre(getCookie("vf_nombre") || "");
  }, []);

  const nav = useMemo(
    () => [
      { href: "/admin/usuarios", label: "Usuarios" },
      { href: "/admin/mascotas", label: "Mascotas" },
      { href: "/admin/citas", label: "Citas" },
      { href: "/admin/historial", label: "Historial" },
    ],
    []
  );

  function logout() {
    clearCookie("vf_uid");
    clearCookie("vf_rol");
    clearCookie("vf_nombre");
    // si también usaste localStorage token alguna vez:
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_rol");
    } catch {}
    router.replace("/admin/login");
  }

  return (
    <div className="vf-shell">
      <aside className="vf-aside">
        <div className="vf-brand">VetFarm Admin</div>
        <div className="vf-sub">{nombre ? `Hola, ${nombre}` : "Sesión: no disponible"}</div>

        <nav className="vf-nav">
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`vf-link ${pathname?.startsWith(i.href) ? "active" : ""}`}
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 16 }}>
          <button className="vf-btn vf-btn-danger" onClick={logout} style={{ width: "100%" }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="vf-main">
        <div className="vf-card">{children}</div>
      </main>
    </div>
  );
}