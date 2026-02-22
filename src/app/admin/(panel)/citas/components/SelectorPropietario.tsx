"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiListarPropietarios, type Propietario } from "@/services/usuariosService";

type Mini = { id: number; identificacion: string; nombre: string };

export function SelectorPropietario({
  valueId,
  onChange,
}: {
  valueId: number | null;
  onChange: (p: Mini | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Propietario[]>([]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((p) =>
      `${p.id} ${p.identificacion} ${p.nombre} ${p.correo ?? ""}`.toLowerCase().includes(s)
    );
  }, [list, q]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiListarPropietarios();
        setList(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectValue = String(valueId ?? ""); // ✅ controlado

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 900 }}>Propietario</div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar propietario…"
        style={{
          padding: 10,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          outline: "none",
        }}
      />

      <select
        value={selectValue}
        onChange={(e) => {
          const id = Number(e.target.value || 0);
          if (!id) return onChange(null);

          const p = list.find((x) => Number(x.id) === id);
          if (!p) return onChange(null);

          onChange({ id: Number(p.id), identificacion: p.identificacion, nombre: p.nombre });
        }}
        style={{
          padding: 10,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(20,20,30,0.75)",
          color: "#fff",
          fontWeight: 800,
        }}
      >
        <option value="" style={{ color: "#000" }}>
          {loading ? "Cargando..." : "Seleccione propietario..."}
        </option>

        {filtered.map((p) => (
          <option key={p.id} value={String(p.id)} style={{ color: "#000" }}>
            {p.nombre} — {p.identificacion}
          </option>
        ))}
      </select>
    </div>
  );
}