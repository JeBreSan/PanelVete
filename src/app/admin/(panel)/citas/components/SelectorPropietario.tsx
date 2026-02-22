"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiAdminListarPropietarios } from "@/services/citasAdminService";

export type PropMini = { id: number; identificacion: string; nombre: string };

export function SelectorPropietario({
  valueId,
  onChange,
}: {
  valueId: number | null;
  onChange: (p: PropMini | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PropMini[]>([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const list = await apiAdminListarPropietarios();
        if (!alive) return;

        setItems(list ?? []);

        // si el valueId ya no existe, limpiamos
        if (valueId && !(list ?? []).some((x) => Number(x.id) === Number(valueId))) {
          onChange(null);
        }
      } catch {
        if (!alive) return;
        setItems([]);
        onChange(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => { alive = false; };
  }, []);

  const selectedValue = useMemo(() => (valueId ? String(valueId) : ""), [valueId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    if (!raw) return onChange(null);

    const id = Number(raw);
    const found = items.find((x) => Number(x.id) === id) ?? null;
    onChange(found);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 900 }}>Propietario</div>

      <select
        value={selectedValue}
        onChange={handleChange}
        disabled={loading}
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.25)",
          color: "white",
          fontWeight: 800,
        }}
      >
        <option value="">
          {loading
            ? "Cargando propietarios..."
            : items.length === 0
            ? "No hay propietarios activos"
            : "Seleccione propietario..."}
        </option>

        {items.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.nombre} — {p.identificacion}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectorPropietario;
