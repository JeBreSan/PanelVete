import { Router } from "express";
import { pool } from "../config/db.js";
import { adminAtenderCita } from "../controllers/admin.controller.js";

const router = Router();

/**
 * GET /admin/propietarios
 */
router.get("/propietarios", async (_req, res) => {
  try {
    const q = await pool.query(
      `SELECT id, identificacion, nombre
       FROM propietarios
       ORDER BY nombre ASC`
    );
    res.json(q.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /admin/propietarios/:id/mascotas
 * Solo activas
 */
router.get("/propietarios/:id/mascotas", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    if (!propietarioId) return res.status(400).json({ error: "propietario_id inválido" });

    const q = await pool.query(
      `SELECT id, nombre, especie, raza, edad
       FROM mascotas
       WHERE propietario_id = $1 AND activo = true
       ORDER BY nombre ASC`,
      [propietarioId]
    );

    res.json(q.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /admin/citas/proximas
 * Todas las próximas citas
 */
router.get("/citas/proximas", async (_req, res) => {
  try {
    const q = await pool.query(
      `SELECT
         c.id,
         c.propietario_id,
         c.mascota_id,
         c.inicio,
         c.comentario,
         c.estado,
         c.created_at,
         c.updated_at,
         m.nombre AS mascota_nombre,
         u.nombre AS propietario_nombre
       FROM citas c
       LEFT JOIN mascotas m ON m.id = c.mascota_id
       LEFT JOIN propietarios u ON u.id = c.propietario_id
       WHERE c.inicio >= NOW()
         AND (c.estado = 'programada' OR c.estado IS NULL)
       ORDER BY c.inicio ASC`
    );
    res.json(q.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /admin/propietarios/:id/citas/proximas
 * Próximas citas por propietario
 */
router.get("/propietarios/:id/citas/proximas", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    if (!propietarioId) return res.status(400).json({ error: "propietario_id inválido" });

    const q = await pool.query(
      `SELECT
         c.id,
         c.propietario_id,
         c.mascota_id,
         c.inicio,
         c.comentario,
         c.estado,
         c.created_at,
         c.updated_at,
         m.nombre AS mascota_nombre,
         u.nombre AS propietario_nombre
       FROM citas c
       LEFT JOIN mascotas m ON m.id = c.mascota_id
       LEFT JOIN propietarios u ON u.id = c.propietario_id
       WHERE c.propietario_id = $1
         AND c.inicio >= NOW()
         AND (c.estado = 'programada' OR c.estado IS NULL)
       ORDER BY c.inicio ASC`,
      [propietarioId]
    );

    res.json(q.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /admin/propietarios/:id/citas
 * Crear cita
 */
router.post("/propietarios/:id/citas", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    const mascotaId = Number(req.body?.mascota_id);
    const inicioISO = String(req.body?.inicio || "");
    const comentario = String(req.body?.comentario ?? "");

    if (!propietarioId) return res.status(400).json({ error: "propietario_id inválido" });
    if (!mascotaId) return res.status(400).json({ error: "mascota_id inválido" });
    if (!inicioISO) return res.status(400).json({ error: "inicio requerido" });

    const okMasc = await pool.query(
      `SELECT 1 FROM mascotas WHERE id = $1 AND propietario_id = $2 AND activo = true LIMIT 1`,
      [mascotaId, propietarioId]
    );
    if (okMasc.rowCount === 0) return res.status(400).json({ error: "Mascota no válida para este propietario" });

    const ocupado = await pool.query(
      `SELECT 1 FROM citas
       WHERE inicio = $1
         AND (estado = 'programada' OR estado IS NULL)
       LIMIT 1`,
      [inicioISO]
    );
    if (ocupado.rowCount > 0) return res.status(409).json({ error: "SLOT_OCUPADO" });

    const q = await pool.query(
      `INSERT INTO citas (propietario_id, mascota_id, inicio, comentario, estado)
       VALUES ($1, $2, $3, $4, 'programada')
       RETURNING *`,
      [propietarioId, mascotaId, inicioISO, comentario]
    );

    res.status(201).json(q.rows[0]);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * PUT /admin/propietarios/:id/citas/:citaId/reprogramar
 */
router.put("/propietarios/:id/citas/:citaId/reprogramar", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    const citaId = Number(req.params.citaId);
    const inicioISO = String(req.body?.inicio || "");

    if (!propietarioId || !citaId) return res.status(400).json({ error: "ids inválidos" });
    if (!inicioISO) return res.status(400).json({ error: "inicio requerido" });

    const exists = await pool.query(
      `SELECT 1 FROM citas WHERE id = $1 AND propietario_id = $2 LIMIT 1`,
      [citaId, propietarioId]
    );
    if (exists.rowCount === 0) return res.status(404).json({ error: "CITA_NO_EXISTE" });

    const ocupado = await pool.query(
      `SELECT 1 FROM citas
       WHERE inicio = $1
         AND id <> $2
         AND (estado = 'programada' OR estado IS NULL)
       LIMIT 1`,
      [inicioISO, citaId]
    );
    if (ocupado.rowCount > 0) return res.status(409).json({ error: "SLOT_OCUPADO" });

    const q = await pool.query(
      `UPDATE citas
       SET inicio = $1, updated_at = NOW()
       WHERE id = $2 AND propietario_id = $3
       RETURNING *`,
      [inicioISO, citaId, propietarioId]
    );

    res.json(q.rows[0]);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * PUT /admin/propietarios/:id/citas/:citaId/cancelar
 */
router.put("/propietarios/:id/citas/:citaId/cancelar", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    const citaId = Number(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ error: "ids inválidos" });

    await pool.query(
      `UPDATE citas SET estado = 'cancelada', updated_at = NOW()
       WHERE id = $1 AND propietario_id = $2`,
      [citaId, propietarioId]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * DELETE /admin/propietarios/:id/citas/:citaId
 */
router.delete("/propietarios/:id/citas/:citaId", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    const citaId = Number(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ error: "ids inválidos" });

    await pool.query(`DELETE FROM citas WHERE id = $1 AND propietario_id = $2`, [citaId, propietarioId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /admin/propietarios/:id/citas/:citaId/atender
 * ✅ Inserta historial_clinico + marca completada (controller real)
 */
router.post("/propietarios/:id/citas/:citaId/atender", adminAtenderCita);

export default router;