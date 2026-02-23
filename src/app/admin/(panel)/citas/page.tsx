"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SelectorPropietario } from "./components/SelectorPropietario";
import { ui } from "@/ui/adminUi";
import {
  apiAdminAtenderCita,
  apiAdminCancelarCita,
  apiAdminEliminarCita,
  apiAdminHistorialMascota,
  apiAdminListarCitasOcupadas,
  apiAdminListarProximasCitas,
  apiAdminListarReglasAgenda,
  apiAdminListarTodasProximasCitas,
  apiAdminReprogramarCita,
  type AgendaRegla,
  type CitaAdmin,
} from "@/services/citasAdminService";

const SLOT_MIN = 30;
const LEAD_MIN = 30;

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function formatDateCR(d: Date) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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

function buildSlotsForDay(day: Date) {
  const base = startOfDay(day);
  const slots: Date[] = [];
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m += SLOT_MIN) {
      const s = new Date(base);
      s.setHours(h, m, 0, 0);
      slots.push(s);
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
  if (hasEspecial) return rules.some((r) => r.tipo === "HORARIO_ESPECIAL" && intersects(slot, r));

  return rules.some((r) => r.tipo === "SIEMPRE_ABIERTO");
}

export default function CitasPage() {
  const router = useRouter();

  const [prop, setProp] = useState<{ id: number; identificacion: string; nombre: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CitaAdmin[]>([]);
  const [msg, setMsg] = useState("");

  const [selected, setSelected] = useState<CitaAdmin | null>(null);

  // reprogramar
  const [reprogOpen, setReprogOpen] = useState(false);
  const [diaSel, setDiaSel] = useState<Date>(() => startOfDay(new Date()));
  const [slotSel, setSlotSel] = useState<Date | null>(null);
  const [reglas, setReglas] = useState<AgendaRegla[]>([]);
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // atender
  const [atenderOpen, setAtenderOpen] = useState(false);
  const [hist, setHist] = useState<any[]>([]);
  const [titulo, setTitulo] = useState("");
  const [notas, setNotas] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [meds, setMeds] = useState("");
  const [recs, setRecs] = useState("");

  const dias = useMemo(() => {
    const out: Date[] = [];
    const now = startOfDay(new Date());
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  const load = async () => {
    try {
      setMsg("");
      setLoading(true);

      if (!prop?.id) {
        const all = await apiAdminListarTodasProximasCitas();
        setItems(all);
        return;
      }

      const mine = await apiAdminListarProximasCitas(prop.id);
      setItems(mine);
    } catch (e: any) {
      setMsg(e?.message || "Error cargando citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prop?.id]);

  const openFicha = (c: CitaAdmin) => {
    setSelected(c);
  };

  const closeAll = () => {
    setSelected(null);
    setReprogOpen(false);
    setAtenderOpen(false);
    setSlotSel(null);
    setMsg("");
  };

  // ✅ Siempre usar el propietario real de la cita seleccionada
  const ownerId = selected?.propietario_id ?? prop?.id ?? null;

  const cancelar = async () => {
    if (!ownerId || !selected) return;
    try {
      await apiAdminCancelarCita(ownerId, selected.id);
      setItems((prev) => prev.filter((x) => x.id !== selected.id));
      closeAll();
    } catch (e: any) {
      setMsg(e?.message || "No se pudo cancelar");
    }
  };

  const eliminar = async () => {
    if (!ownerId || !selected) return;
    try {
      await apiAdminEliminarCita(ownerId, selected.id);
      setItems((prev) => prev.filter((x) => x.id !== selected.id));
      closeAll();
    } catch (e: any) {
      setMsg(e?.message || "No se pudo eliminar");
    }
  };

  const loadSlots = async (day: Date) => {
    try {
      setLoadingSlots(true);
      setSlotSel(null);

      const ini = startOfDay(day).toISOString();
      const fin = endOfDay(day).toISOString();

      const [r, o] = await Promise.all([apiAdminListarReglasAgenda(ini, fin), apiAdminListarCitasOcupadas(ini, fin)]);

      setReglas(r);

      const set = new Set<string>();
      for (const it of o) set.add(it.inicio);
      setOcupadas(set);
    } catch (e: any) {
      setMsg(e?.message || "Error cargando horarios");
    } finally {
      setLoadingSlots(false);
    }
  };

  const abrirReprogramar = async () => {
    if (!selected) return;
    const base = startOfDay(new Date(selected.inicio));
    setDiaSel(base);
    setReprogOpen(true);
    await loadSlots(base);
  };

  useEffect(() => {
    if (reprogOpen) loadSlots(diaSel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const confirmarReprog = async () => {
    if (!ownerId || !selected || !slotSel) return;
    try {
      const updated = await apiAdminReprogramarCita(ownerId, selected.id, slotSel.toISOString());
      setItems((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
      setSelected(updated);
      setReprogOpen(false);
      setSlotSel(null);
    } catch (e: any) {
      if (String(e?.message).includes("SLOT_OCUPADO")) {
        setMsg("Ese horario ya fue tomado. Elegí otro.");
        await loadSlots(diaSel);
        return;
      }
      setMsg(e?.message || "No se pudo reprogramar");
    }
  };

  const abrirAtender = async () => {
    if (!ownerId || !selected) return;
    setAtenderOpen(true);
    setTitulo("Consulta");
    setNotas("");
    setDiagnostico("");
    setMeds("");
    setRecs("");

    try {
      const list = await apiAdminHistorialMascota(ownerId, selected.mascota_id);
      setHist(list);
    } catch {
      setHist([]);
    }
  };

  const atender = async () => {
    if (!ownerId || !selected) return;
    if (!titulo.trim()) return setMsg("Título requerido.");

    try {
      await apiAdminAtenderCita(ownerId, selected.id, {
        titulo,
        notas,
        diagnostico,
        medicamentos: meds,
        recomendaciones: recs,
      });

      setItems((prev) => prev.filter((x) => x.id !== selected.id));
      closeAll();
    } catch (e: any) {
      setMsg(e?.message || "No se pudo atender");
    }
  };

  return (
    <div style={ui.page}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <h1 style={ui.h1}>Próximas citas</h1>
          <div style={ui.sub}>{prop?.id ? `Filtrando por: ${prop.nombre}` : "Mostrando TODAS las próximas citas."}</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/admin/citas/nueva")}
            style={ui.btn}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Agendar
          </button>

          <button
            onClick={load}
            style={ui.btnGhost}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* Toast error */}
      {msg ? <div style={{ ...ui.toast, border: "1px solid rgba(255,80,80,0.28)" }}>{msg}</div> : null}

      {/* Panel principal */}
      <div style={{ marginTop: 14, ...ui.card, ...ui.cardInner, display: "grid", gap: 12 }}>
        <SelectorPropietario
          valueId={prop?.id ?? null}
          onChange={(p) => {
            setProp(p);
            setSelected(null);
          }}
        />

        {loading ? (
          <div style={{ fontWeight: 900, opacity: 0.9 }}>Cargando…</div>
        ) : items.length === 0 ? (
          <div style={{ fontWeight: 900, opacity: 0.9 }}>No hay citas próximas.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((c) => {
              const d = new Date(c.inicio);
              const mascota = (c as any)?.mascota_nombre ? `Cita ${String((c as any).mascota_nombre)}` : `Cita #${c.id}`;
              const propNom = (c as any)?.propietario_nombre ? ` — ${String((c as any).propietario_nombre)}` : "";
              return (
                <button
                  key={c.id}
                  onClick={() => openFicha(c)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.05)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 950 }}>{mascota}{propNom}</div>
                  <div style={{ opacity: 0.9, marginTop: 6, fontWeight: 850 }}>
                    {formatDateCR(d)} — {formatTime(d)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL FICHA */}
      {selected ? (
        <div style={ui.overlay} onClick={closeAll}>
          <div style={ui.modal} onClick={(e) => e.stopPropagation()}>
            <div style={ui.modalHead}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={ui.pill}>Ficha de cita</div>
                <div style={{ fontWeight: 950, opacity: 0.92 }}>#{selected.id}</div>
              </div>

              <button style={ui.btnGhost} onClick={closeAll}>
                Cerrar
              </button>
            </div>

            <div style={ui.modalBody}>
              <div style={{ display: "grid", gap: 8 }}>
                <div><b>ID:</b> #{selected.id}</div>
                <div><b>Fecha:</b> {formatDateCR(new Date(selected.inicio))}</div>
                <div><b>Hora:</b> {formatTime(new Date(selected.inicio))}</div>
                <div><b>Mascota ID:</b> {selected.mascota_id}</div>
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={ui.btn} onClick={abrirReprogramar}>Reprogramar</button>
                <button style={ui.btnGhost} onClick={cancelar}>Cancelar</button>
                <button style={ui.btnDanger} onClick={eliminar}>Eliminar</button>
                <button style={ui.btn} onClick={abrirAtender}>Atender</button>
              </div>

              {/* REPROGRAMAR */}
              {reprogOpen ? (
                <div style={{ marginTop: 16, ...ui.card, ...ui.cardInner, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ fontWeight: 950 }}>Reprogramar</div>

                  <div style={{ marginTop: 10, fontWeight: 900 }}>Día</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {dias.map((d) => {
                      const active = sameDay(d, diaSel);
                      return (
                        <button
                          key={d.toISOString()}
                          onClick={() => setDiaSel(startOfDay(d))}
                          style={{
                            ...ui.btnGhost,
                            height: 38,
                            borderRadius: 999,
                            background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                          }}
                        >
                          {formatDateCR(d)}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 12, fontWeight: 900 }}>Hora</div>
                  {loadingSlots ? (
                    <div style={{ marginTop: 8, fontWeight: 850, opacity: 0.9 }}>Cargando…</div>
                  ) : slots.length === 0 ? (
                    <div style={{ marginTop: 8, fontWeight: 850, opacity: 0.9 }}>No hay horarios disponibles.</div>
                  ) : (
                    <div
                      style={{
                        marginTop: 10,
                        display: "grid",
                        gridTemplateColumns: "repeat(6, minmax(0,1fr))",
                        gap: 8,
                        maxHeight: 280,
                        overflow: "auto",
                        paddingRight: 6,
                      }}
                    >
                      {slots.map((s) => {
                        const active = slotSel?.toISOString() === s.toISOString();
                        return (
                          <button
                            key={s.toISOString()}
                            onClick={() => setSlotSel(s)}
                            style={{
                              ...ui.btnGhost,
                              height: 40,
                              borderRadius: 12,
                              background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)",
                            }}
                          >
                            {formatTime(s)}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button style={ui.btn} onClick={confirmarReprog} disabled={!slotSel}>
                      Confirmar
                    </button>
                    <button style={ui.btnGhost} onClick={() => setReprogOpen(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}

              {/* ATENDER */}
              {atenderOpen ? (
                <div style={{ marginTop: 16, ...ui.card, ...ui.cardInner, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ fontWeight: 950 }}>Atender cita</div>

                  <div style={{ marginTop: 10, opacity: 0.9, fontWeight: 900 }}>Historial (últimas entradas)</div>
                  <div style={{ marginTop: 8, maxHeight: 170, overflow: "auto", paddingRight: 6 }}>
                    {hist.length === 0 ? (
                      <div style={{ opacity: 0.85, fontWeight: 850 }}>Sin historial.</div>
                    ) : (
                      hist.slice(0, 10).map((h) => (
                        <div
                          key={h.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.12)",
                            marginBottom: 8,
                            background: "rgba(0,0,0,0.18)",
                          }}
                        >
                          <div style={{ fontWeight: 950 }}>{h.titulo}</div>
                          <div style={{ opacity: 0.85, fontSize: 12, fontWeight: 850, marginTop: 4 }}>
                            {String(h.tipo || "").toUpperCase()} — {new Date(h.fecha).toLocaleString()}
                          </div>
                          {h.detalle ? <div style={{ marginTop: 8, opacity: 0.92 }}>{h.detalle}</div> : null}
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ej: Consulta general)" style={ui.input} />
                    <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas" style={{ ...ui.textarea, minHeight: 70 }} />
                    <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} placeholder="Diagnóstico" style={{ ...ui.textarea, minHeight: 70 }} />
                    <textarea value={meds} onChange={(e) => setMeds(e.target.value)} placeholder="Medicamentos" style={{ ...ui.textarea, minHeight: 70 }} />
                    <textarea value={recs} onChange={(e) => setRecs(e.target.value)} placeholder="Recomendaciones" style={{ ...ui.textarea, minHeight: 70 }} />
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button style={ui.btn} onClick={atender}>
                      Guardar y finalizar
                    </button>
                    <button style={ui.btnGhost} onClick={() => setAtenderOpen(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}