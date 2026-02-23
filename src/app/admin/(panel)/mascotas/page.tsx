"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  apiAdminActualizarMascota,
  apiAdminListarMascotas,
  apiAdminMascotaFicha,
  type MascotaAdminFicha,
  type MascotaAdminListItem,
  type MascotaAdminPatch,
} from "@/services/citasAdminService";
import { VFButton, VFCard, VFModal, VFToast, vf } from "@/ui/vfUi";

function normalize(v: any) {
  return String(v ?? "").toLowerCase().trim();
}

export default function MascotasPage() {
  const [items, setItems] = useState<MascotaAdminListItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{ text: string; kind: "ok" | "warn" | "err" } | null>(null);

  const [ficha, setFicha] = useState<MascotaAdminFicha | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const data = await apiAdminListarMascotas();
      setItems(data ?? []);
    } catch (e: any) {
      setToast({ text: e?.message ?? "Error cargando mascotas", kind: "err" });
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

    return items.filter((m) =>
      normalize(m.id).includes(s) ||
      normalize(m.nombre).includes(s) ||
      normalize(m.propietario_nombre).includes(s)
    );
  }, [items, q]);

  async function verFicha(id: number) {
    try {
      const data = await apiAdminMascotaFicha(id);
      setFicha(data);
      setOpen(true);
      setToast(null);
    } catch (e: any) {
      setToast({ text: e?.message ?? "No se pudo abrir la ficha", kind: "err" });
    }
  }

  async function guardar() {
    if (!ficha?.id) return;
    setSaving(true);
    try {
      const patch: MascotaAdminPatch = {
        nombre: ficha.nombre,
        especie: ficha.especie,
        raza: ficha.raza,
        edad: ficha.edad,
        activo: ficha.activo,
      };
      await apiAdminActualizarMascota(ficha.id, patch);
      setToast({ text: "Mascota actualizada ✅", kind: "ok" });
      setOpen(false);
      setFicha(null);
      await cargar();
    } catch (e: any) {
      setToast({ text: e?.message ?? "No se pudo guardar", kind: "err" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Mascotas</h2>
          <div style={vf.subtle}>Lista general para panel admin.</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="Buscar por nombre / propietario / id..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ ...vf.input, width: 360 }}
          />
          <VFButton variant="ghost" onClick={cargar} disabled={loading}>
            {loading ? "Cargando..." : "Recargar"}
          </VFButton>
        </div>
      </div>

      <VFToast show={!!toast} text={toast?.text ?? ""} kind={toast?.kind ?? "ok"} />

      <VFCard>
        {loading ? (
          <div style={{ fontWeight: 900, opacity: 0.9 }}>Cargando…</div>
        ) : filtrados.length === 0 ? (
          <div style={{ fontWeight: 900, opacity: 0.9 }}>Sin resultados.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtrados.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 950, fontSize: 16 }}>{m.nombre}</div>
                  <div style={{ opacity: 0.9, fontWeight: 800 }}>
                    {m.especie ?? "—"} {m.raza ? `— ${m.raza}` : ""}
                  </div>
                  <div style={{ opacity: 0.85, fontWeight: 800 }}>
                    Propietario: {m.propietario_nombre ?? "—"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <VFButton onClick={() => verFicha(m.id)}>Ver ficha</VFButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </VFCard>

      <VFModal
        open={open && !!ficha}
        title={ficha ? `Ficha de mascota #${ficha.id}` : "Ficha"}
        onClose={() => {
          setOpen(false);
          setFicha(null);
        }}
        maxWidth={780}
      >
        {ficha ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 900, opacity: 0.9 }}>
              Propietario: {ficha.propietario_nombre ?? "—"}
              {ficha.propietario_identificacion ? ` — ${ficha.propietario_identificacion}` : ""}
            </div>

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={vf.label}>Nombre</span>
                <input
                  value={ficha.nombre ?? ""}
                  onChange={(e) => setFicha({ ...ficha, nombre: e.target.value })}
                  style={vf.input}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={vf.label}>Especie</span>
                <input
                  value={ficha.especie ?? ""}
                  onChange={(e) => setFicha({ ...ficha, especie: e.target.value })}
                  style={vf.input}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={vf.label}>Raza</span>
                <input
                  value={ficha.raza ?? ""}
                  onChange={(e) => setFicha({ ...ficha, raza: e.target.value })}
                  style={vf.input}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={vf.label}>Edad</span>
                <input
                  value={String(ficha.edad ?? "")}
                  onChange={(e) => setFicha({ ...ficha, edad: e.target.value })}
                  style={vf.input}
                />
              </label>
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 900 }}>
              <input
                type="checkbox"
                checked={!!ficha.activo}
                onChange={(e) => setFicha({ ...ficha, activo: e.target.checked })}
              />
              Activo
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <VFButton
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setFicha(null);
                }}
              >
                Cancelar
              </VFButton>

              <VFButton onClick={guardar} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </VFButton>
            </div>
          </div>
        ) : null}
      </VFModal>
    </div>
  );
}