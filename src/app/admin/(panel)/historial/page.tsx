"use client";

import React, { useState } from "react";
import SelectorPropietario from "@/app/admin/(panel)/citas/components/SelectorPropietario";
import { apiAdminHistorialPropietario, type HistorialItem } from "@/services/citasAdminService";
import { VFCard, VFToast, vf } from "@/ui/vfUi";

function fmtFecha(x: string) {
  try {
    return new Date(x).toLocaleString();
  } catch {
    return x;
  }
}

export default function HistorialPage() {
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [propId, setPropId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: "ok" | "warn" | "err" } | null>(null);

  async function cargar(id: number) {
    try {
      const data = await apiAdminHistorialPropietario(id);
      setItems(data ?? []);
      setToast(null);
    } catch (e: any) {
      setToast({ text: e?.message ?? "Error cargando historial", kind: "err" });
      setItems([]);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ margin: 0 }}>Historial clínico</h2>
        <div style={vf.subtle}>Seleccioná propietario para ver todas las entradas.</div>
      </div>

      <VFToast show={!!toast} text={toast?.text ?? ""} kind={toast?.kind ?? "ok"} />

      <VFCard>
        <SelectorPropietario
          valueId={propId}
          onChange={(p: any) => {
            if (!p) {
              setPropId(null);
              setItems([]);
              return;
            }
            setPropId(p.id);
            cargar(p.id);
          }}
        />
      </VFCard>

      <VFCard>
        {items.length === 0 ? (
          <div style={{ fontWeight: 900, opacity: 0.9 }}>
            {propId ? "Sin historial para este propietario." : "Seleccioná un propietario."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((h) => (
              <div
                key={h.id}
                style={{
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ fontWeight: 950 }}>{h.titulo}</div>
                <div style={{ opacity: 0.85, fontWeight: 800, marginTop: 4 }}>
                  — {h.mascota_nombre ?? `Mascota #${h.mascota_id}`}
                </div>
                <div style={{ opacity: 0.8, fontWeight: 800, marginTop: 2 }}>
                  — {fmtFecha(h.fecha)}
                </div>
                <div style={{ marginTop: 8, opacity: 0.92 }}>
                  {h.detalle ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </VFCard>
    </div>
  );
}