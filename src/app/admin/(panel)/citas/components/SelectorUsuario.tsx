"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiListarPropietarios, type Propietario } from "@/services/usuariosService";

type Props = {
  value: number | null;
  onChange: (id: number | null, item?: Propietario | null) => void;
};

export default function SelectorUsuario({ value, onChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Propietario[]>([]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((p) =>
      `${p.nombre} ${p.identificacion} ${p.correo ?? ""}`.toLowerCase().includes(s)
    );
  }, [items, q]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await apiListarPropietarios();
        setItems(list);

        // si no hay seleccionado, auto-selecciona el primero
        if ((value === null || value === undefined) && list.length > 0) {
          onChange(list[0].id, list[0]);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedObj = useMemo(
    () => items.find((x) => x.id === value) ?? null,
    [items, value]
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ fontWeight: 800 }}>Propietario</label>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar propietario..."
        style={{
          padding: 10,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.35)",
          color: "#fff",
          outline: "none",
        }}
      />

      <select
        value={value ?? ""}
        onChange={(e) => {
          const id = e.target.value ? Number(e.target.value) : null; // ✅ clave
          const obj = items.find((x) => x.id === id) ?? null;
          onChange(id, obj);
        }}
        disabled={loading}
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.45)", // ✅ visible siempre
          color: "#fff",
          fontWeight: 800,
          outline: "none",
        }}
      >
        <option value="" style={{ background: "#111", color: "#fff" }}>
          {loading ? "Cargando..." : "Seleccione propietario..."}
        </option>

        {filtered.map((p) => (
          <option
            key={p.id}
            value={p.id}
            style={{ background: "#111", color: "#fff" }}
          >
            {p.nombre} — {p.identificacion}
          </option>
        ))}
      </select>

      {selectedObj ? (
        <div style={{ opacity: 0.9, fontSize: 12 }}>
          Seleccionado: <b>{selectedObj.nombre}</b> ({selectedObj.identificacion})
        </div>
      ) : null}
    </div>
  );
}
