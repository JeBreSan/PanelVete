"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Propietario, PropietarioActualizar } from "@/services/usuariosService";
import { apiActualizarPropietario, apiListarPropietarios } from "@/services/usuariosService";

type FormState = {
  identificacion: string;
  nombre: string;
  telefono: string;
  correo: string;
  password: string;
  rol: string;
  activo: boolean;
};

function normalize(s: any) {
  return String(s ?? "").toLowerCase().trim();
}

export default function UsuariosPage() {
  const [items, setItems] = useState<Propietario[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Propietario | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    identificacion: "",
    nombre: "",
    telefono: "",
    correo: "",
    password: "",
    rol: "usuario",
    activo: true,
  });

  async function cargar() {
    setErr(null);
    setLoading(true);
    try {
      const data = await apiListarPropietarios();
      setItems(data ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    const s = normalize(q);
    if (!s) return items;

    return items.filter((u) => {
      return (
        normalize(u.id).includes(s) ||
        normalize(u.identificacion).includes(s) ||
        normalize(u.nombre).includes(s) ||
        normalize(u.correo).includes(s) ||
        normalize(u.telefono).includes(s) ||
        normalize(u.rol).includes(s)
      );
    });
  }, [items, q]);

  function abrirEditar(u: Propietario) {
    setErr(null);
    setEditing(u);
    setForm({
      identificacion: String(u.identificacion ?? ""),
      nombre: String(u.nombre ?? ""),
      telefono: String(u.telefono ?? ""),
      correo: String(u.correo ?? ""),
      password: "",
      rol: String(u.rol ?? "usuario"),
      activo: Boolean(u.activo ?? true),
    });
    setOpen(true);
  }

  function cerrarModal() {
    if (saving) return;
    setOpen(false);
    setEditing(null);
  }

  function buildPatch(original: Propietario, f: FormState): PropietarioActualizar {
    const patch: PropietarioActualizar = {};

    // Identificación bloqueada
    if (String(original.nombre ?? "") !== f.nombre.trim()) patch.nombre = f.nombre.trim();
    if (String(original.telefono ?? "") !== f.telefono.trim()) patch.telefono = f.telefono.trim();
    if (String(original.correo ?? "") !== f.correo.trim()) patch.correo = f.correo.trim();
    if (String(original.rol ?? "usuario") !== f.rol) patch.rol = f.rol;

    const origActivo = Boolean(original.activo ?? true);
    if (origActivo !== Boolean(f.activo)) patch.activo = Boolean(f.activo);

    if (f.password && f.password.trim().length >= 4) patch.password = f.password.trim();

    return patch;
  }

  async function guardar() {
    if (!editing) return;

    setErr(null);

    const patch = buildPatch(editing, form);

    if (Object.keys(patch).length === 0) {
      setErr('No hiciste cambios. (Por eso sale "No hay campos para actualizar".)');
      return;
    }

    setSaving(true);
    try {
      const updated = await apiActualizarPropietario(editing.id, patch);

      setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)));

      setOpen(false);
      setEditing(null);
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 900, color: "rgba(255,255,255,.92)" }}>
            Usuarios (Propietarios)
          </h2>

          <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="vf-btn vf-btn-ghost" onClick={cargar} disabled={loading}>
              {loading ? "Cargando..." : "Recargar"}
            </button>

            <input
              className="vf-input"
              placeholder="Buscar por id / identificación / nombre / correo / teléfono / rol..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: 420, maxWidth: "100%" }}
            />
          </div>
        </div>
      </div>

      {err && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "rgba(255,0,0,.12)", border: "1px solid rgba(255,0,0,.25)", fontWeight: 800 }}>
          {err}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          background: "rgba(255,255,255,.10)",
          border: "1px solid rgba(255,255,255,.14)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", color: "rgba(255,255,255,.92)" }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,.12)" }}>
              <th style={th}>id</th>
              <th style={th}>identificación</th>
              <th style={th}>nombre</th>
              <th style={th}>teléfono</th>
              <th style={th}>correo</th>
              <th style={th}>rol</th>
              <th style={{ ...th, textAlign: "right" }}>editar</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,.12)" }}>
                <td style={td}>{u.id}</td>
                <td style={td}>{u.identificacion}</td>
                <td style={td}>{u.nombre}</td>
                <td style={td}>{u.telefono ?? "—"}</td>
                <td style={td}>{u.correo ?? "—"}</td>
                <td style={td}>{u.rol}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button className="vf-btn vf-btn-primary" onClick={() => abrirEditar(u)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}

            {filtrados.length === 0 && (
              <tr>
                <td style={td} colSpan={7}>
                  No hay resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Modal Editar (MISMO look que Mascotas) ===== */}
      {open && editing && (
        <div className="vf-modalOverlay" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}>
          <div className="vf-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>Editar #{editing.id}</div>
                <div style={{ marginTop: 6, opacity: 0.9, fontWeight: 800 }}>
                  Identificación (bloqueado): {form.identificacion}
                </div>
              </div>

              <button className="vf-btn vf-btn-ghost" onClick={cerrarModal} disabled={saving}>
                Cerrar
              </button>
            </div>

            <div style={{ marginTop: 14 }} className="vf-grid">
              <label style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>Nombre</div>
                <input
                  className="vf-input"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>Correo</div>
                <input
                  className="vf-input"
                  value={form.correo}
                  onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>Teléfono</div>
                <input
                  className="vf-input"
                  value={form.telefono}
                  onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>Password (opcional, min 4)</div>
                <input
                  className="vf-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••"
                />
              </label>

              <label className="vf-dark" style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>Rol</div>
                <select
                  className="vf-select"
                  value={form.rol}
                  onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                >
                  <option value="usuario">usuario</option>
                  <option value="doctor">doctor</option>
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <div style={{ gridColumn: "1 / -1", marginTop: 6 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Estado</div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.activo)}
                    onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                  />
                  {form.activo ? "Activo" : "Inactivo"}
                </label>
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <button className="vf-btn vf-btn-ghost" onClick={cerrarModal} disabled={saving}>
                Cancelar
              </button>
              <button className="vf-btn vf-btn-primary" onClick={guardar} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {err ? (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "rgba(255,0,0,.12)", border: "1px solid rgba(255,0,0,.25)", fontWeight: 800 }}>
                {err}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 12,
  letterSpacing: 0.4,
  fontWeight: 900,
  color: "rgba(255,255,255,.75)",
};

const td: React.CSSProperties = {
  padding: "12px 12px",
  fontWeight: 700,
};