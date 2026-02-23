"use client";

import React, { useState } from "react";
import SelectorPropietario from "@/app/admin/(panel)/citas/components/SelectorPropietario";
import { apiAdminHistorialPropietario } from "@/services/citasAdminService";

export default function HistorialPage() {
  const [items, setItems] = useState<any[]>([]);
  const [propId, setPropId] = useState<number | null>(null);

  async function cargar(id: number) {
    const data = await apiAdminHistorialPropietario(id);
    setItems(data ?? []);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Historial clínico</h2>

      <SelectorPropietario
        valueId={propId}
        onChange={(p: any) => {
          if (p) {
            setPropId(p.id);
            cargar(p.id);
          }
        }}
      />

      {items.map((h) => (
        <div key={h.id} style={{ border: "1px solid #ccc", padding: 12, marginTop: 10 }}>
          <div><strong>{h.titulo}</strong></div>
          <div>- {h.mascota_nombre ?? "Mascota #" + h.mascota_id}</div>
          <div>- {new Date(h.fecha).toLocaleString()}</div>
          <div style={{ marginTop: 6 }}>{h.detalle ?? "-"}</div>
        </div>
      ))}
    </div>
  );
}
