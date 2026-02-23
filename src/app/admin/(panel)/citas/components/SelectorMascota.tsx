"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiAdminListarMascotasDePropietario } from "@/services/citasAdminService";
import { vf } from "@/ui/vfUi";

export type MascotaMini = {
  id: number;
  nombre: string;
  especie?: string;
};

export function SelectorMascota({
  propietarioId,
  valueId,
  onChange,
}: {
  propietarioId: number | null;
  valueId: number | null;
  onChange: (m: MascotaMini | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MascotaMini[]>([]);

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

        setItems(list ?? []);

        if (valueId && !(list ?? []).some((x: any) => Number(x.id) === Number(valueId))) {
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
  }, [propietarioId]);

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
    <div style={{ fontWeight: 900 }}>Mascota</div>

    <select
      className="vf-select"
      value={selectedValue}
      onChange={handleChange}
      disabled={!propietarioId || loading}
    >
      <option value="">
        {loading
          ? "Cargando mascotas..."
          : !propietarioId
          ? "Primero seleccione propietario..."
          : items.length === 0
          ? "Este propietario no tiene mascotas activas"
          : "Seleccione mascota..."}
      </option>

      {items.map((m) => (
        <option key={m.id} value={String(m.id)}>
          {m.nombre}
        </option>
      ))}
    </select>
  </div>
);
  
}

export default SelectorMascota;