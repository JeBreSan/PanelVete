import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

/**
 * GET /historial/mascotas
 * Devuelve mascotas activas del usuario logueado (x-user-id)
 */
router.get("/mascotas", async (req, res) => {
  try {
    const userId = req.user?.id;

    const q = `
      select id, nombre, especie, raza, edad
      from public.mascotas
      where propietario_id = $1 and activo = true
      order by nombre asc
    `;
    const r = await pool.query(q, [userId]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /historial/:mascotaId
 * Devuelve historial clínico de esa mascota (solo si pertenece al usuario)
 */
router.get("/:mascotaId", async (req, res) => {
  try {
    const userId = req.user?.id;
    const mascotaId = Number(req.params.mascotaId);

    if (!mascotaId) return res.status(400).json({ message: "Mascota inválida" });

    // ✅ validar que la mascota pertenece al usuario
    const ownerCheck = await pool.query(
      `select id from public.mascotas where id = $1 and propietario_id = $2`,
      [mascotaId, userId]
    );
    if (ownerCheck.rowCount === 0) return res.status(403).json({ message: "No autorizado" });

    const q = `
      select id, propietario_id, mascota_id, tipo, fecha, titulo, detalle
      from public.historial_clinico
      where mascota_id = $1 and propietario_id = $2
      order by fecha desc
      limit 200
    `;
    const r = await pool.query(q, [mascotaId, userId]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
