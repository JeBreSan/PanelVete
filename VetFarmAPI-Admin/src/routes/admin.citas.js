import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

/**
 * GET /admin/propietarios
 * Lista propietarios (propietarios) para selector del panel
 */
router.get("/propietarios", async (_req, res) => {
  try {
    // Ajustá el nombre de la tabla si no es "propietarios"
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
 * Lista mascotas del propietario (para agendar)
 */
router.get("/propietarios/:id/mascotas", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    if (!propietarioId) return res.status(400).json({ error: "propietario_id inválido" });

    // Ajustá el nombre de la tabla/columnas si difieren
    const q = await pool.query(
      `SELECT id, nombre, especie, raza, edad
       FROM mascotas
       WHERE propietario_id = $1
       ORDER BY nombre ASC`,
      [propietarioId]
    );

    res.json(q.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/**
 * GET /admin/propietarios/:id/citas/proximas
 * Próximas citas del propietario (para panel)
 */
router.get("/propietarios/:id/citas/proximas", async (req, res) => {
  try {
    const propietarioId = Number(req.params.id);
    if (!propietarioId) return res.status(400).json({ error: "propietario_id inválido" });

    // Ajustá tabla/columnas si difieren
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

export default router;

