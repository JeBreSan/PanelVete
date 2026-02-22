import express from "express";
import { pool } from "../config/db.js";
import { requireRole } from "../middlewares/requireUser.js";

const router = express.Router();

// ✅ Roles permitidos en panel
router.use(requireRole(["admin","doctor","staff"]));

function parseId(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * GET /admin/propietarios
 * (si ya lo tenías en otro archivo, podés borrar este handler para evitar duplicado)
 */
router.get("/propietarios", async (_req, res) => {
  try {
    const r = await pool.query(`
      select id, identificacion, nombre, telefono, correo, rol
      from propietarios
      order by id desc
    `);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * GET /admin/propietarios/:propietarioId/mascotas
 */
router.get("/propietarios/:propietarioId/mascotas", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    if (!propietarioId) return res.status(400).json({ mensaje: "propietarioId inválido" });

    const r = await pool.query(`
      select id, nombre, especie, raza, edad
      from mascotas
      where propietario_id = $1 and activo = true
      order by nombre asc
    `, [propietarioId]);

    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * GET /admin/propietarios/:propietarioId/citas/proximas
 * (programadas y futuras)
 */
router.get("/propietarios/:propietarioId/citas/proximas", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    if (!propietarioId) return res.status(400).json({ mensaje: "propietarioId inválido" });

    const r = await pool.query(`
      select c.*,
             m.nombre as mascota_nombre,
             p.nombre as propietario_nombre
      from citas c
      join mascotas m on m.id = c.mascota_id
      join propietarios p on p.id = c.propietario_id
      where c.propietario_id = $1
        and c.estado = 'programada'
        and c.inicio >= now()
      order by c.inicio asc
    `, [propietarioId]);

    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * POST /admin/propietarios/:propietarioId/citas
 * body: { mascota_id, inicio, comentario }
 */
router.post("/propietarios/:propietarioId/citas", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    const { mascota_id, inicio, comentario } = req.body ?? {};
    const mascotaId = parseId(mascota_id);

    if (!propietarioId) return res.status(400).json({ mensaje: "propietarioId inválido" });
    if (!mascotaId || !inicio) return res.status(400).json({ mensaje: "Debe enviar mascota_id e inicio" });

    // validar mascota pertenece al propietario
    const m = await pool.query(`
      select id from mascotas
      where id = $1 and propietario_id = $2 and activo = true
      limit 1
    `, [mascotaId, propietarioId]);

    if (m.rowCount === 0) return res.status(403).json({ mensaje: "Mascota no válida para ese propietario" });

    try {
      const r = await pool.query(`
        insert into citas (propietario_id, mascota_id, inicio, comentario, estado)
        values ($1,$2,$3,$4,'programada')
        returning *
      `, [propietarioId, mascotaId, inicio, comentario ?? null]);

      res.json(r.rows[0]);
    } catch (err) {
      if (err?.code === "23505") return res.status(409).json({ mensaje: "SLOT_OCUPADO" });
      throw err;
    }
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * PUT /admin/propietarios/:propietarioId/citas/:citaId/reprogramar
 * body: { inicio }
 */
router.put("/propietarios/:propietarioId/citas/:citaId/reprogramar", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    const citaId = parseId(req.params.citaId);
    const { inicio } = req.body ?? {};

    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido" });
    if (!inicio) return res.status(400).json({ mensaje: "Debe enviar inicio (ISO)" });

    try {
      const r = await pool.query(`
        update citas
        set inicio = $1, updated_at = now()
        where id = $2 and propietario_id = $3
        returning *
      `, [inicio, citaId, propietarioId]);

      if (r.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada" });
      res.json(r.rows[0]);
    } catch (err) {
      if (err?.code === "23505") return res.status(409).json({ mensaje: "SLOT_OCUPADO" });
      throw err;
    }
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * PUT /admin/propietarios/:propietarioId/citas/:citaId/cancelar
 */
router.put("/propietarios/:propietarioId/citas/:citaId/cancelar", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    const citaId = parseId(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido" });

    const r = await pool.query(`
      update citas
      set estado = 'cancelada', updated_at = now()
      where id = $1 and propietario_id = $2
      returning id
    `, [citaId, propietarioId]);

    if (r.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * DELETE /admin/propietarios/:propietarioId/citas/:citaId
 */
router.delete("/propietarios/:propietarioId/citas/:citaId", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    const citaId = parseId(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido" });

    const r = await pool.query(`
      delete from citas
      where id = $1 and propietario_id = $2
      returning id
    `, [citaId, propietarioId]);

    if (r.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * GET /admin/propietarios/:propietarioId/mascotas/:mascotaId/historial
 */
router.get("/propietarios/:propietarioId/mascotas/:mascotaId/historial", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    const mascotaId = parseId(req.params.mascotaId);
    if (!propietarioId || !mascotaId) return res.status(400).json({ mensaje: "Id inválido" });

    const r = await pool.query(`
      select id, propietario_id, mascota_id, tipo, fecha, titulo, detalle
      from historial_clinico
      where propietario_id = $1 and mascota_id = $2
      order by fecha desc
      limit 200
    `, [propietarioId, mascotaId]);

    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

/**
 * POST /admin/propietarios/:propietarioId/citas/:citaId/atender
 * body: { titulo, notas, diagnostico, medicamentos, recomendaciones, tipo? }
 * - Inserta 1 entrada en historial_clinico (detalle consolidado)
 * - Marca cita como completada
 */
router.post("/propietarios/:propietarioId/citas/:citaId/atender", async (req, res) => {
  try {
    const propietarioId = parseId(req.params.propietarioId);
    const citaId = parseId(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido" });

    const { tipo, titulo, notas, diagnostico, medicamentos, recomendaciones } = req.body ?? {};
    if (!String(titulo ?? "").trim()) return res.status(400).json({ mensaje: "Título requerido" });

    // Buscar cita + mascota_id
    const c = await pool.query(`
      select id, mascota_id
      from citas
      where id = $1 and propietario_id = $2
      limit 1
    `, [citaId, propietarioId]);

    if (c.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada" });

    const mascotaId = c.rows[0].mascota_id;

    const partes = [];
    if (String(notas ?? "").trim()) partes.push(`Notas: ${String(notas).trim()}`);
    if (String(diagnostico ?? "").trim()) partes.push(`Diagnóstico: ${String(diagnostico).trim()}`);
    if (String(medicamentos ?? "").trim()) partes.push(`Medicamentos: ${String(medicamentos).trim()}`);
    if (String(recomendaciones ?? "").trim()) partes.push(`Recomendaciones: ${String(recomendaciones).trim()}`);

    const detalle = partes.join("\n");

    await pool.query("begin");

    await pool.query(`
      insert into historial_clinico (propietario_id, mascota_id, tipo, fecha, titulo, detalle)
      values ($1,$2,$3, now(), $4, $5)
    `, [
      propietarioId,
      mascotaId,
      (String(tipo ?? "consulta").trim().toLowerCase()),
      String(titulo).trim(),
      detalle || null
    ]);

    await pool.query(`
      update citas
      set estado = 'completada', updated_at = now()
      where id = $1 and propietario_id = $2
    `, [citaId, propietarioId]);

    await pool.query("commit");
    res.json({ ok: true });
  } catch (e) {
    try { await pool.query("rollback"); } catch {}
    res.status(500).json({ mensaje: "Error interno", error: String(e) });
  }
});

export default router;
