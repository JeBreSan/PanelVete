"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  apiAdminListarMascotasDePropietario,
  type MascotaAdminMini,
} from "@/services/citasAdminService";

type Props = {
  propietarioId: number | null;
  valueId: number | null;
  onChange: (m: MascotaAdminMini | null) => void;
};

export default function SelectorMascota({ propietarioId, valueId, onChange }: Props) {
  const [items, setItems] = useState<MascotaAdminMini[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) => `${m.nombre} ${m.id}`.toLowerCase().includes(s));
  }, [items, q]);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!propietarioId) {
        setItems([]);
        onChange(null);
        return;
      }
      try {
        setLoading(true);
        const list = await apiAdminListarMascotasDePropietario(propietarioId);
        if (!alive) return;
        setItems(list);

        if (list.length === 0) {
          onChange(null);
        } else if (valueId) {
          const found = list.find((x) => x.id === valueId) ?? null;
          onChange(found);
        } else {
          onChange(list[0]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propietarioId]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 900 }}>Mascota</div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar mascota..."
        style={{
          padding: 10,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
        }}
      />

      <select
        disabled={!propietarioId || loading || filtered.length === 0}
        value={valueId ?? ""}
        onChange={(e) => {
          const id = Number(e.target.value);
          const m = items.find((x) => x.id === id) ?? null;
          onChange(m);
        }}
        style={{
          padding: 12,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          fontWeight: 800,
        }}
      >
        <option value="">{!propietarioId ? "Seleccione propietario..." : loading ? "Cargando..." : "Seleccione mascota..."}</option>

        {filtered.map((m) => (
          <option key={m.id} value={m.id} style={{ color: "black" }}>
            {m.nombre} — #{m.id}
          </option>
        ))}
      </select>

      {!propietarioId ? null : loading ? null : items.length === 0 ? (
        <div style={{ opacity: 0.85 }}>Ese propietario no tiene mascotas activas.</div>
      ) : null}
    </div>
  );
}