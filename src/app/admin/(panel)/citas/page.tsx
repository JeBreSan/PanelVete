"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SelectorPropietario } from "./components/SelectorPropietario";
import {
  apiAdminAtenderCita,
  apiAdminCancelarCita,
  apiAdminEliminarCita,
  apiAdminHistorialMascota,
  apiAdminListarCitasOcupadas,
  apiAdminListarProximasCitas,
  apiAdminListarReglasAgenda,
  apiAdminReprogramarCita,
  type AgendaRegla,
  type CitaAdmin,
} from "@/services/citasAdminService";

const SLOT_MIN = 30;
const LEAD_MIN = 30;

function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }
function formatDateCR(d: Date) { return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`; }
function formatTime(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(24,0,0,0); return x; }
function sameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

function buildSlotsForDay(day: Date) {
  const base = startOfDay(day);
  const slots: Date[] = [];
  for (let h=0; h<24; h++) for (let m=0; m<60; m+=SLOT_MIN) {
    const s = new Date(base); s.setHours(h,m,0,0); slots.push(s);
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
  return rules.some((r) => r.tipo==="HORARIO_ESPECIAL" && r.inicio && r.fin && sameDay(new Date(r.inicio), day));
}
function isAllowedByRules(slot: Date, rules: AgendaRegla[], day: Date) {
  const cerrado = rules.some((r) => r.tipo==="CERRADO" && intersects(slot, r));
  if (cerrado) return false;

  const hasEspecial = hasHorarioEspecialForDay(rules, day);
  if (hasEspecial) return rules.some((r) => r.tipo==="HORARIO_ESPECIAL" && intersects(slot, r));

  return rules.some((r) => r.tipo==="SIEMPRE_ABIERTO");
}

export default function CitasPage() {
  const router = useRouter();

  const [prop, setProp] = useState<{id:number; identificacion:string; nombre:string} | null>(null);
  const [q, setQ] = useState("");

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
    for (let i=0;i<14;i++){ const d=new Date(now); d.setDate(now.getDate()+i); out.push(d); }
    return out;
  }, []);

  const load = async () => {
    if (!prop?.id) return;
    try {
      setMsg("");
      setLoading(true);
      setItems(await apiAdminListarProximasCitas(prop.id));
    } catch (e:any) {
      setMsg(e?.message || "Error cargando citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (prop?.id) load(); }, [prop?.id]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const mascota = (x as any)?.mascota_nombre ?? "";
      const propNom = (x as any)?.propietario_nombre ?? prop?.nombre ?? "";
      return `${mascota} ${propNom} ${x.id}`.toLowerCase().includes(s);
    });
  }, [items, q, prop?.nombre]);

  const openFicha = (c: CitaAdmin) => { setSelected(c); };

  const closeAll = () => {
    setSelected(null);
    setReprogOpen(false);
    setAtenderOpen(false);
    setSlotSel(null);
    setMsg("");
  };

  const cancelar = async () => {
    if (!prop?.id || !selected) return;
    try {
      await apiAdminCancelarCita(prop.id, selected.id);
      setItems((prev) => prev.filter((x) => x.id !== selected.id));
      closeAll();
    } catch (e:any) { setMsg(e?.message || "No se pudo cancelar"); }
  };

  const eliminar = async () => {
    if (!prop?.id || !selected) return;
    try {
      await apiAdminEliminarCita(prop.id, selected.id);
      setItems((prev) => prev.filter((x) => x.id !== selected.id));
      closeAll();
    } catch (e:any) { setMsg(e?.message || "No se pudo eliminar"); }
  };

  const loadSlots = async (day: Date) => {
    try {
      setLoadingSlots(true);
      setSlotSel(null);
      const ini = startOfDay(day).toISOString();
      const fin = endOfDay(day).toISOString();

      const [r, o] = await Promise.all([
        apiAdminListarReglasAgenda(ini, fin),
        apiAdminListarCitasOcupadas(ini, fin),
      ]);

      setReglas(r);
      const set = new Set<string>();
      for (const it of o) set.add(it.inicio);
      setOcupadas(set);
    } catch (e:any) {
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

  useEffect(() => { if (reprogOpen) loadSlots(diaSel); }, [diaSel]);

  const slots = useMemo(() => {
    const all = buildSlotsForDay(diaSel);
    const now = new Date();
    const lead = new Date(now.getTime() + LEAD_MIN*60*1000);

    return all
      .filter((s) => s.getTime() >= lead.getTime())
      .filter((s) => isAllowedByRules(s, reglas, diaSel))
      .filter((s) => !ocupadas.has(s.toISOString()));
  }, [diaSel, reglas, ocupadas]);

  const confirmarReprog = async () => {
    if (!prop?.id || !selected || !slotSel) return;
    try {
      const updated = await apiAdminReprogramarCita(prop.id, selected.id, slotSel.toISOString());
      setItems((prev) => prev.map((x) => (x.id === selected.id ? updated : x)));
      setSelected(updated);
      setReprogOpen(false);
      setSlotSel(null);
    } catch (e:any) {
      if (String(e?.message).includes("SLOT_OCUPADO")) {
        setMsg("Ese horario ya fue tomado. Elegí otro.");
        await loadSlots(diaSel);
        return;
      }
      setMsg(e?.message || "No se pudo reprogramar");
    }
  };

  const abrirAtender = async () => {
    if (!prop?.id || !selected) return;
    setAtenderOpen(true);
    setTitulo("Consulta");
    setNotas("");
    setDiagnostico("");
    setMeds("");
    setRecs("");
    try {
      const list = await apiAdminHistorialMascota(prop.id, selected.mascota_id);
      setHist(list);
    } catch (e:any) {
      setHist([]);
    }
  };

  const atender = async () => {
    if (!prop?.id || !selected) return;
    if (!titulo.trim()) return setMsg("Título requerido.");
    try {
      await apiAdminAtenderCita(prop.id, selected.id, {
        titulo,
        notas,
        diagnostico,
        medicamentos: meds,
        recomendaciones: recs,
      });
      // al atender, esa cita pasa a completada => se “va” de próximas
      setItems((prev) => prev.filter((x) => x.id !== selected.id));
      closeAll();
    } catch (e:any) {
      setMsg(e?.message || "No se pudo atender");
    }
  };

  return (
    <div style={{ display:"grid", gap:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900 }}>Próximas citas</h1>
          <div style={{ opacity:.85 }}>Seleccioná propietario, luego abrí una cita.</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => router.push("/admin/citas/nueva")} style={{ padding:"10px 14px", borderRadius:10, fontWeight:900 }}>Agendar</button>
          <button onClick={load} style={{ padding:"10px 14px", borderRadius:10 }}>Refrescar</button>
        </div>
      </div>

      {msg ? <div style={{ padding:10, borderRadius:10, background:"rgba(255,0,0,.12)", border:"1px solid rgba(255,0,0,.25)" }}>{msg}</div> : null}

      <div style={{ display:"grid", gap:12, padding:14, borderRadius:14, border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.06)" }}>
        <SelectorPropietario valueId={prop?.id ?? null} onChange={(p) => { setProp(p); setSelected(null); setItems([]); }} />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por mascota / propietario / id…"
          style={{ padding:10, borderRadius:10, border:"1px solid rgba(255,255,255,0.18)" }}
        />

        {!prop?.id ? (
          <div>Seleccione propietario.</div>
        ) : loading ? (
          <div>Cargando…</div>
        ) : filtered.length === 0 ? (
          <div>No hay citas próximas.</div>
        ) : (
          <div style={{ display:"grid", gap:10 }}>
            {filtered.map((c) => {
              const d = new Date(c.inicio);
              const mascota = (c as any)?.mascota_nombre ? `Cita ${ (c as any).mascota_nombre }` : `Cita #${c.id}`;
              return (
                <button
                  key={c.id}
                  onClick={() => openFicha(c)}
                  style={{
                    textAlign:"left",
                    padding:12,
                    borderRadius:14,
                    border:"1px solid rgba(255,255,255,0.14)",
                    background:"rgba(255,255,255,0.05)"
                  }}
                >
                  <div style={{ fontWeight:900 }}>{mascota}</div>
                  <div style={{ opacity:.9, marginTop:4 }}>{formatDateCR(d)} — {formatTime(d)}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FICHA */}
      {selected ? (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.65)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:16
        }}>
          <div style={{
            width:"100%", maxWidth:700, borderRadius:16, padding:14,
            border:"1px solid rgba(255,255,255,0.14)", background:"rgba(20,20,30,.95)"
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:16, fontWeight:900 }}>Ficha de cita</div>
              <button onClick={closeAll} style={{ padding:"8px 10px", borderRadius:10 }}>Cerrar</button>
            </div>

            <div style={{ marginTop:10, display:"grid", gap:8 }}>
              <div><b>ID:</b> #{selected.id}</div>
              <div><b>Fecha:</b> {formatDateCR(new Date(selected.inicio))}</div>
              <div><b>Hora:</b> {formatTime(new Date(selected.inicio))}</div>
              <div><b>Mascota ID:</b> {selected.mascota_id}</div>
            </div>

            <div style={{ marginTop:14, display:"flex", gap:10, flexWrap:"wrap" }}>
              <button onClick={abrirReprogramar} style={{ padding:"10px 12px", borderRadius:10, fontWeight:900 }}>Reprogramar</button>
              <button onClick={cancelar} style={{ padding:"10px 12px", borderRadius:10 }}>Cancelar</button>
              <button onClick={eliminar} style={{ padding:"10px 12px", borderRadius:10 }}>Eliminar</button>
              <button onClick={abrirAtender} style={{ padding:"10px 12px", borderRadius:10, fontWeight:900 }}>Atender</button>
            </div>

            {/* REPROGRAMAR */}
            {reprogOpen ? (
              <div style={{ marginTop:16, padding:12, borderRadius:14, border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.04)" }}>
                <div style={{ fontWeight:900 }}>Reprogramar</div>

                <div style={{ marginTop:10, fontWeight:800 }}>Día</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
                  {dias.map((d) => {
                    const active = sameDay(d, diaSel);
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => setDiaSel(startOfDay(d))}
                        style={{
                          padding:"8px 10px", borderRadius:999,
                          border:"1px solid rgba(255,255,255,0.18)",
                          background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                          fontWeight:800
                        }}
                      >
                        {formatDateCR(d)}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop:12, fontWeight:800 }}>Hora</div>
                {loadingSlots ? (
                  <div style={{ marginTop:8 }}>Cargando…</div>
                ) : slots.length === 0 ? (
                  <div style={{ marginTop:8 }}>No hay horarios disponibles.</div>
                ) : (
                  <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"repeat(6, minmax(0,1fr))", gap:8, maxHeight:280, overflow:"auto", paddingRight:6 }}>
                    {slots.map((s) => {
                      const active = slotSel?.toISOString() === s.toISOString();
                      return (
                        <button
                          key={s.toISOString()}
                          onClick={() => setSlotSel(s)}
                          style={{
                            padding:"10px 8px", borderRadius:12,
                            border:"1px solid rgba(255,255,255,0.18)",
                            background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                            fontWeight:900
                          }}
                        >
                          {formatTime(s)}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop:12, display:"flex", gap:10 }}>
                  <button onClick={confirmarReprog} disabled={!slotSel} style={{ padding:"10px 12px", borderRadius:10, fontWeight:900 }}>
                    Confirmar
                  </button>
                  <button onClick={() => setReprogOpen(false)} style={{ padding:"10px 12px", borderRadius:10 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}

            {/* ATENDER */}
            {atenderOpen ? (
              <div style={{ marginTop:16, padding:12, borderRadius:14, border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.04)" }}>
                <div style={{ fontWeight:900 }}>Atender cita</div>

                <div style={{ marginTop:10, opacity:.9, fontWeight:800 }}>Historial (últimas entradas)</div>
                <div style={{ marginTop:8, maxHeight:160, overflow:"auto", paddingRight:6 }}>
                  {hist.length === 0 ? (
                    <div style={{ opacity:.8 }}>Sin historial.</div>
                  ) : (
                    hist.slice(0,10).map((h) => (
                      <div key={h.id} style={{ padding:"8px 10px", borderRadius:12, border:"1px solid rgba(255,255,255,0.10)", marginBottom:8 }}>
                        <div style={{ fontWeight:900 }}>{h.titulo}</div>
                        <div style={{ opacity:.85, fontSize:12 }}>{String(h.tipo || "").toUpperCase()} — {new Date(h.fecha).toLocaleString()}</div>
                        {h.detalle ? <div style={{ marginTop:6, opacity:.9 }}>{h.detalle}</div> : null}
                      </div>
                    ))
                  )}
                </div>

                <div style={{ marginTop:10, display:"grid", gap:8 }}>
                  <input value={titulo} onChange={(e)=>setTitulo(e.target.value)} placeholder="Título (ej: Consulta general)" style={{ padding:10, borderRadius:10 }} />
                  <textarea value={notas} onChange={(e)=>setNotas(e.target.value)} placeholder="Notas" style={{ padding:10, borderRadius:10, minHeight:70 }} />
                  <textarea value={diagnostico} onChange={(e)=>setDiagnostico(e.target.value)} placeholder="Diagnóstico" style={{ padding:10, borderRadius:10, minHeight:70 }} />
                  <textarea value={meds} onChange={(e)=>setMeds(e.target.value)} placeholder="Medicamentos" style={{ padding:10, borderRadius:10, minHeight:70 }} />
                  <textarea value={recs} onChange={(e)=>setRecs(e.target.value)} placeholder="Recomendaciones" style={{ padding:10, borderRadius:10, minHeight:70 }} />
                </div>

                <div style={{ marginTop:12, display:"flex", gap:10 }}>
                  <button onClick={atender} style={{ padding:"10px 12px", borderRadius:10, fontWeight:900 }}>
                    Guardar y finalizar
                  </button>
                  <button onClick={() => setAtenderOpen(false)} style={{ padding:"10px 12px", borderRadius:10 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
