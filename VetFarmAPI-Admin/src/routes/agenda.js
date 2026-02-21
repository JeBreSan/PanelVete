import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

/**
 * GET /agenda/reglas?inicio=ISO&fin=ISO
 * Devuelve reglas activas relevantes.
 */
router.get("/reglas", async (req, res) => {
  try {
    const { inicio, fin } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ error: "Debe enviar inicio y fin (ISO)" });
    }

    // Traer:
    // - SIEMPRE_ABIERTO (sin rango)
    // - CERRADO / HORARIO_ESPECIAL que se crucen con el rango solicitado
    const q = `
      select id, tipo, inicio, fin, activo, nota
      from agenda_reglas
      where activo = true
        and (
          (tipo = 'SIEMPRE_ABIERTO' and inicio is null and fin is null)
          or
          (inicio < $2 and fin > $1)
        )
      order by tipo asc, inicio asc
    `;

    const r = await pool.query(q, [inicio, fin]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
