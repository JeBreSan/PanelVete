"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiAdminListarPropietarios } from "@/services/citasAdminService";
import { vf } from "@/ui/vfUi";

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
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  <div className="vf-dark" style={{ display: "grid", gap: 8 }}>
    <div style={{ fontWeight: 900 }}>Propietario</div>

    <select
      className="vf-select"
      value={selectedValue}
      onChange={handleChange}
      disabled={loading}
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