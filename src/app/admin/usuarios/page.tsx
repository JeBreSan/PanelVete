"use client";

import { useEffect, useMemo, useState } from "react";
import {
  apiActualizarPropietario,
  apiCrearPropietario,
  apiDesactivarPropietario,
  apiListarPropietarios,
  apiReactivarPropietario,
  type Propietario,
} from "@/services/usuariosService";

type Filtro = "activos" | "inactivos" | "todos";

type FormState = {
  identificacion: string;
  nombre: string;
  telefono: string;
  correo: string;
  password: string;
  rol: string;
};

const emptyForm: FormState = {
  identificacion: "",
  nombre: "",
  telefono: "",
  correo: "",
  password: "",
  rol: "usuario",
};

export default function AdminUsuariosPage() {
  const [data, setData] = useState<Propietario[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [filtro, setFiltro] = useState<Filtro>("activos");
  const [msg, setMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Propietario | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const list = await apiListarPropietarios();
      setData(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setErr(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    const norm = data.map((u) => ({ ...u, activo: u.activo ?? true })); // si backend no manda activo, asumimos true
    if (filtro === "todos") return norm;
    if (filtro === "activos") return norm.filter((x) => x.activo);
    return norm.filter((x) => !x.activo);
  }, [data, filtro]);

  function abrirCrear() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
    setMsg(null);
  }

  function abrirEditar(u: Propietario) {
    setEditing(u);
    setForm({
      identificacion: u.identificacion ?? "",
      nombre: u.nombre ?? "",
      telefono: u.telefono ?? "",
      correo: u.correo ?? "",
      password: "",
      rol: u.rol ?? "usuario",
    });
    setModalOpen(true);
    setMsg(null);
  }

  function cerrarModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function validate(): string | null {
    if (!form.identificacion.trim()) return "Identificación requerida";
    if (!form.nombre.trim()) return "Nombre requerido";
    if (!form.correo.trim()) return "Correo requerido";
    if (!/^\S+@\S+\.\S+$/.test(form.correo.trim())) return "Correo inválido";
    if (!editing && form.password.trim().length < 6) return "Password mínimo 6 caracteres";
    return null;
  }

  async function guardar() {
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      if (!editing) {
        await apiCrearPropietario({
          identificacion: form.identificacion.trim(),
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() ? form.telefono.trim() : null,
          correo: form.correo.trim(),
          password: form.password.trim(),
          rol: form.rol.trim() || "usuario",
        });
        setMsg("✅ Usuario creado");
      } else {
        const body: any = {
          identificacion: form.identificacion.trim(),
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() ? form.telefono.trim() : null,
          correo: form.correo.trim(),
          rol: form.rol.trim() || editing.rol,
        };
        if (form.password.trim()) body.password = form.password.trim();

        await apiActualizarPropietario(editing.id, body);
        setMsg("✅ Usuario actualizado");
      }

      cerrarModal();
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Error guardando"}`);
    } finally {
      setSaving(false);
    }
  }

  async function desactivar(u: Propietario) {
    const ok = confirm(`¿Desactivar a "${u.nombre}"? (soft delete)`);
    if (!ok) return;

    try {
      await apiDesactivarPropietario(u.id);
      setMsg("✅ Usuario desactivado");
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Error desactivando"}`);
    }
  }

  async function reactivar(u: Propietario) {
    const ok = confirm(`¿Reactivar a "${u.nombre}"?`);
    if (!ok) return;

    try {
      await apiReactivarPropietario(u.id);
      setMsg("✅ Usuario reactivado");
      await load();
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Error reactivando"}`);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Usuarios (Propietarios)</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={load} style={{ padding: 8 }}>
          Recargar
        </button>

        <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} style={{ padding: 8 }}>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="todos">Todos</option>
        </select>

        <button onClick={abrirCrear} style={{ padding: 8 }}>
          + Nuevo
        </button>
      </div>

      {msg && <p style={{ marginBottom: 12 }}>{msg}</p>}

      {loading && <p>Cargando…</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["id", "identificacion", "nombre", "telefono", "correo", "rol", "activo", "acciones"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u) => (
                <tr key={u.id}>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{u.id}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{u.identificacion}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{u.nombre}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{u.telefono ?? "-"}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{u.correo}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{u.rol}</td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    {(u.activo ?? true) ? "true" : "false"}
                  </td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => abrirEditar(u)} style={{ padding: 6 }}>
                        Editar
                      </button>

                      {(u.activo ?? true) ? (
                        <button onClick={() => desactivar(u)} style={{ padding: 6 }}>
                          Desactivar
                        </button>
                      ) : (
                        <button onClick={() => reactivar(u)} style={{ padding: 6 }}>
                          Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 12 }}>
                    No hay datos para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal simple */}
      {modalOpen && (
        <div
          onClick={cerrarModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              background: "white",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ marginTop: 0 }}>{editing ? `Editar #${editing.id}` : "Nuevo usuario"}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Identificación" value={form.identificacion} onChange={(v) => setForm((s) => ({ ...s, identificacion: v }))} />
              <Field label="Nombre" value={form.nombre} onChange={(v) => setForm((s) => ({ ...s, nombre: v }))} />
              <Field label="Correo" value={form.correo} onChange={(v) => setForm((s) => ({ ...s, correo: v }))} />
              <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm((s) => ({ ...s, telefono: v }))} />
              <Field
                label={editing ? "Password (opcional)" : "Password"}
                value={form.password}
                type="password"
                onChange={(v) => setForm((s) => ({ ...s, password: v }))}
              />
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 12 }}>Rol</label>
                <select value={form.rol} onChange={(e) => setForm((s) => ({ ...s, rol: e.target.value }))} style={{ padding: 10 }}>
                  <option value="usuario">usuario</option>
<option value="doctor">doctor</option>
<option value="staff">staff</option>
<option value="admin">admin</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={cerrarModal} style={{ padding: 8 }}>
                Cancelar
              </button>
              <button onClick={guardar} style={{ padding: 8 }} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field(props: { label: string; value: string; type?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 12 }}>{props.label}</label>
      <input
        value={props.value}
        type={props.type ?? "text"}
        onChange={(e) => props.onChange(e.target.value)}
        style={{ padding: 10 }}
      />
    </div>
  );
}