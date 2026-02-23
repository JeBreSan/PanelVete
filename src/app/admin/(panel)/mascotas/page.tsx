"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  apiAdminActualizarMascota,
  apiAdminListarMascotas,
  apiAdminMascotaFicha,
} from "@/services/citasAdminService";

function normalize(v: any) {
  return String(v ?? "").toLowerCase().trim();
}

export default function MascotasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [ficha, setFicha] = useState<any>(null);
  const [open, setOpen] = useState(false);

  async function cargar() {
    setLoading(true);
    try {
      const data = await apiAdminListarMascotas();
      setItems(data ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
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
    const data = await apiAdminMascotaFicha(id);
    setFicha(data);
    setOpen(true);
  }

  async function guardar() {
    await apiAdminActualizarMascota(ficha.id, ficha);
    setOpen(false);
    cargar();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Mascotas</h2>

      <input
        placeholder="Buscar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ padding: 8, marginBottom: 12 }}
      />

      {filtrados.map((m) => (
        <div key={m.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 10 }}>
          <div><strong>{m.nombre}</strong></div>
          <div>{m.especie ?? "-"} {m.raza ? "- " + m.raza : ""}</div>
          <div>Propietario: {m.propietario_nombre ?? "-"}</div>
          <button onClick={() => verFicha(m.id)}>Ver ficha</button>
        </div>
      ))}

      {open && ficha && (
        <div style={{ border: "2px solid black", padding: 20, marginTop: 20 }}>
          <h3>Ficha #{ficha.id}</h3>

          <div>Propietario: {ficha.propietario_nombre ?? "-"}</div>

          <input
            value={ficha.nombre ?? ""}
            onChange={(e) => setFicha({ ...ficha, nombre: e.target.value })}
          />

          <input
            value={ficha.especie ?? ""}
            onChange={(e) => setFicha({ ...ficha, especie: e.target.value })}
          />

          <input
            value={ficha.raza ?? ""}
            onChange={(e) => setFicha({ ...ficha, raza: e.target.value })}
          />

          <button onClick={guardar}>Guardar</button>
          <button onClick={() => setOpen(false)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}
