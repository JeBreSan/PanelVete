"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SelectorPropietario } from "../components/SelectorPropietario";
import SelectorMascota from "../components/SelectorMascota";
import {
  apiAdminCrearCita,
  apiAdminListarCitasOcupadas,
  apiAdminListarReglasAgenda,
  type AgendaRegla,
} from "@/services/citasAdminService";

const SLOT_MIN = 30;
const LEAD_MIN = 30;
const DIAS_A_MOSTRAR = 14;

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(24, 0, 0, 0);
  return x;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDateCR(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function buildSlotsForDay(day: Date) {
  const base = startOfDay(day);
  const slots: Date[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += SLOT_MIN) {
      const s = new Date(base);
      s.setHours(h, m, 0, 0);
      slots.push(s);
    }
  }
  return slots;
}

function intersects(slot: Date, rule: AgendaRegla) {
  if (!rule.inicio || !rule.fin) return false;
  const a = new Date(rule.inicio).getTime();
  const b = new Date(rule.fin).getTime();
  const x = slot.getTime();
  return x >= a && x < b;
}

function hasHorarioEspecialForDay(rules: AgendaRegla[], day: Date) {
  return rules.some((r) => r.tipo === "HORARIO_ESPECIAL" && r.inicio && r.fin && sameDay(new Date(r.inicio), day));
}

function isAllowedByRules(slot: Date, rules: AgendaRegla[], day: Date) {
  const cerrado = rules.some((r) => r.tipo === "CERRADO" && intersects(slot, r));
  if (cerrado) return false;

  const hasEspecial = hasHorarioEspecialForDay(rules, day);
  if (hasEspecial) {
    return rules.some((r) => r.tipo === "HORARIO_ESPECIAL" && intersects(slot, r));
  }

  return rules.some((r) => r.tipo === "SIEMPRE_ABIERTO");
}

export default function NuevaCitaPage() {
  const router = useRouter();

  const [prop, setProp] = useState<{ id: number; identificacion: string; nombre: string } | null>(null);
  const [masc, setMasc] = useState<{id:number; nombre:string} | null>(null);

  const [diaSel, setDiaSel] = useState<Date>(() => startOfDay(new Date()));
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [reglas, setReglas] = useState<AgendaRegla[]>([]);
  const [slotSel, setSlotSel] = useState<Date | null>(null);
  const [comentario, setComentario] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const dias = useMemo(() => {
    const out: Date[] = [];
    const now = startOfDay(new Date());
    for (let i = 0; i < DIAS_A_MOSTRAR; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setMsg("");
        setLoadingSlots(true);
        setSlotSel(null);

        const ini = startOfDay(diaSel).toISOString();
        const fin = endOfDay(diaSel).toISOString();

        const [r, o] = await Promise.all([
          apiAdminListarReglasAgenda(ini, fin),
          apiAdminListarCitasOcupadas(ini, fin),
        ]);

        setReglas(r);
        const set = new Set<string>();
        for (const it of o) set.add(it.inicio);
        setOcupadas(set);
      } catch (e: any) {
        setMsg(e?.message || "Error cargando disponibilidad");
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [diaSel]);

  const slots = useMemo(() => {
    const all = buildSlotsForDay(diaSel);
    const now = new Date();
    const lead = new Date(now.getTime() + LEAD_MIN * 60 * 1000);

    return all
      .filter((s) => s.getTime() >= lead.getTime())
      .filter((s) => isAllowedByRules(s, reglas, diaSel))
      .filter((s) => !ocupadas.has(s.toISOString()));
  }, [diaSel, reglas, ocupadas]);

  const crear = async () => {
    if (!prop?.id) return setMsg("Seleccione propietario.");
    if (!masc?.id) return setMsg("Seleccione mascota.");
    if (!slotSel) return setMsg("Seleccione hora.");
    try {
      setMsg("");
      await apiAdminCrearCita(prop.id, { mascota_id: masc.id, inicioISO: slotSel.toISOString(), comentario });
      router.push("/admin/citas");
    } catch (e: any) {
      if (String(e?.message).includes("SLOT_OCUPADO")) return setMsg("Ese horario ya fue tomado. Elegí otro.");
      setMsg(e?.message || "Error creando cita");
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>Agendar cita</h1>
          
        </div>
        <button className="vf-btn vf-btn-ghost" onClick={() => router.push("/admin/citas")}>
  Volver
</button>
      </div>

      {msg ? (
        <div style={{ padding: 10, borderRadius: 10, background: "rgba(255,0,0,.12)", border: "1px solid rgba(255,0,0,.25)" }}>
          {msg}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          padding: 14,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <SelectorPropietario valueId={prop?.id ?? null} onChange={(p) => { setProp(p); setMasc(null); }} />
        <SelectorMascota
  propietarioId={prop?.id ?? null}
  valueId={masc?.id ?? null}
  onChange={setMasc}
/>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 800 }}>Día</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {dias.map((d) => {
              const active = sameDay(d, diaSel);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setDiaSel(startOfDay(d))}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                    fontWeight: 800,
                  }}
                >
                  {formatDateCR(d)}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 800 }}>Hora disponible</label>
          {loadingSlots ? (
            <div>Cargando…</div>
          ) : slots.length === 0 ? (
            <div>No hay horarios disponibles.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 8, maxHeight: 320, overflow: "auto", paddingRight: 6 }}>
              {slots.map((s) => {
                const active = slotSel?.toISOString() === s.toISOString();
                return (
                  <button
                    key={s.toISOString()}
                    onClick={() => setSlotSel(s)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                      fontWeight: 900,
                    }}
                  >
                    {formatTime(s)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={{ fontWeight: 800 }}>Comentarios</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej: vómitos, dolor, revisión general..."
            style={{ padding: 12, borderRadius: 12, minHeight: 90 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
  <button className="vf-btn vf-btn-primary" onClick={crear}>
    Confirmar cita
  </button>

  <button className="vf-btn vf-btn-ghost" onClick={() => router.push("/admin/citas")}>
    Ir a próximas
  </button>
</div>
      </div>
    </div>
  );
}

