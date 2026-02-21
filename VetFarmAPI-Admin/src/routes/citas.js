import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

/**
 * GET /citas/ocupadas?inicio=ISO&fin=ISO
 * Devuelve lista de { inicio } para bloquear slots
 */
router.get("/ocupadas", async (req, res) => {
  try {
    const propietarioId = req.user.id;
    const { inicio, fin } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ error: "Debe enviar inicio y fin (ISO)" });
    }

    const q = `
      select inicio
      from citas
      where estado = 'programada'
        and inicio >= $1
        and inicio < $2
      order by inicio asc
    `;
    const r = await pool.query(q, [inicio, fin]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /citas/proximas
 * Devuelve citas futuras del propietario (programadas)
 */
router.get("/proximas", async (req, res) => {
  try {
    const propietarioId = req.user.id;

    const q = `
      select *
      from citas
      where propietario_id = $1
        and estado = 'programada'
        and inicio >= now()
      order by inicio asc
    `;
    const r = await pool.query(q, [propietarioId]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * POST /citas
 * body: { mascota_id, inicio, comentario }
 * Crea cita si la mascota pertenece al propietario
 * Si el slot ya está tomado -> 409
 */
router.post("/", async (req, res) => {
  try {
    const propietarioId = req.user.id;
    const { mascota_id, inicio, comentario } = req.body ?? {};

    if (!mascota_id || !inicio) {
      return res.status(400).json({ error: "Debe enviar mascota_id e inicio" });
    }

    // Verificar que la mascota pertenezca a este propietario
    const m = await pool.query(
      `select id from mascotas where id = $1 and propietario_id = $2 and activo = true`,
      [mascota_id, propietarioId]
    );

    if (m.rowCount === 0) {
      return res.status(403).json({ error: "Mascota no válida para este usuario" });
    }

    const q = `
      insert into citas (propietario_id, mascota_id, inicio, comentario, estado)
      values ($1, $2, $3, $4, 'programada')
      returning *
    `;

    try {
      const r = await pool.query(q, [propietarioId, mascota_id, inicio, comentario ?? null]);
      return res.json(r.rows[0]);
    } catch (err) {
      // Unique violation (slot ocupado)
      if (err?.code === "23505") {
        return res.status(409).json({ error: "SLOT_OCUPADO" });
      }
      throw err;
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * DELETE /citas/:id
 * Borra cita (solo si pertenece al propietario)
 */
router.delete("/:id", async (req, res) => {
  try {
    const propietarioId = req.user.id;
    const id = Number(req.params.id);

    if (!id) return res.status(400).json({ error: "ID inválido" });

    const r = await pool.query(
      `delete from citas where id = $1 and propietario_id = $2 returning id`,
      [id, propietarioId]
    );

    if (r.rowCount === 0) return res.status(404).json({ error: "Cita no encontrada" });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * PUT /citas/:id/reprogramar
 * body: { inicio }
 * Reprograma cita (solo si pertenece al propietario)
 * Si slot ya está tomado -> 409
 */
router.put("/:id/reprogramar", async (req, res) => {
  try {
    const propietarioId = req.user.id;
    const id = Number(req.params.id);
    const { inicio } = req.body ?? {};

    if (!id) return res.status(400).json({ error: "ID inválido" });
    if (!inicio) return res.status(400).json({ error: "Debe enviar inicio (ISO)" });

    try {
      const r = await pool.query(
        `update citas
         set inicio = $1, updated_at = now()
         where id = $2 and propietario_id = $3
         returning *`,
        [inicio, id, propietarioId]
      );

      if (r.rowCount === 0) return res.status(404).json({ error: "Cita no encontrada" });
      return res.json(r.rows[0]);
    } catch (err) {
      if (err?.code === "23505") {
        return res.status(409).json({ error: "SLOT_OCUPADO" });
      }
      throw err;
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
