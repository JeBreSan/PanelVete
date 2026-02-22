import { pool } from "../config/db.js";

function requireStaff(req, res) {
  const rol = String(req.user?.rol || "").toLowerCase();
  const ok = ["admin", "doctor", "staff"].includes(rol);
  if (!ok) {
    res.status(403).json({ mensaje: "Prohibido. Solo admin/doctor/staff." });
    return false;
  }
  return true;
}

function parseId(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// GET /admin/propietarios
export async function adminListarPropietarios(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const r = await pool.query(
      `select id, identificacion, nombre
       from propietarios
       order by id desc`
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// GET /admin/propietarios/:id/mascotas
export async function adminListarMascotas(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    if (!propietarioId) return res.status(400).json({ mensaje: "Id inválido." });

    const r = await pool.query(
      `select id, nombre, especie
       from mascotas
       where propietario_id = $1 and activo = true
       order by id desc`,
      [propietarioId]
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// GET /admin/propietarios/:id/citas/proximas
export async function adminListarCitasProximas(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    if (!propietarioId) return res.status(400).json({ mensaje: "Id inválido." });

    const q = `
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
    `;

    const r = await pool.query(q, [propietarioId]);
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// POST /admin/propietarios/:id/citas
export async function adminCrearCita(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    if (!propietarioId) return res.status(400).json({ mensaje: "Id inválido." });

    const { mascota_id, inicio, comentario } = req.body ?? {};
    if (!mascota_id || !inicio) return res.status(400).json({ mensaje: "Debe enviar mascota_id e inicio." });

    // mascota debe pertenecer a ese propietario
    const m = await pool.query(
      `select id from mascotas where id = $1 and propietario_id = $2 and activo = true`,
      [mascota_id, propietarioId]
    );
    if (m.rowCount === 0) return res.status(403).json({ mensaje: "Mascota no válida para ese propietario." });

    try {
      const r = await pool.query(
        `insert into citas (propietario_id, mascota_id, inicio, comentario, estado)
         values ($1, $2, $3, $4, 'programada')
         returning *`,
        [propietarioId, mascota_id, inicio, comentario ?? null]
      );
      res.json(r.rows[0]);
    } catch (err) {
      if (err?.code === "23505") return res.status(409).json({ mensaje: "SLOT_OCUPADO" });
      throw err;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// PUT /admin/propietarios/:id/citas/:citaId/reprogramar
export async function adminReprogramarCita(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    const citaId = parseId(req.params.citaId);
    const { inicio } = req.body ?? {};
    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido." });
    if (!inicio) return res.status(400).json({ mensaje: "Debe enviar inicio." });

    try {
      const r = await pool.query(
        `update citas
         set inicio = $1, updated_at = now()
         where id = $2 and propietario_id = $3
         returning *`,
        [inicio, citaId, propietarioId]
      );
      if (r.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada." });
      res.json(r.rows[0]);
    } catch (err) {
      if (err?.code === "23505") return res.status(409).json({ mensaje: "SLOT_OCUPADO" });
      throw err;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// PUT /admin/propietarios/:id/citas/:citaId/cancelar
export async function adminCancelarCita(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    const citaId = parseId(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido." });

    const r = await pool.query(
      `update citas
       set estado = 'cancelada', updated_at = now()
       where id = $1 and propietario_id = $2
       returning id`,
      [citaId, propietarioId]
    );

    if (r.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada." });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// DELETE /admin/propietarios/:id/citas/:citaId  (hard delete)
export async function adminEliminarCita(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    const citaId = parseId(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido." });

    const r = await pool.query(
      `delete from citas where id = $1 and propietario_id = $2 returning id`,
      [citaId, propietarioId]
    );
    if (r.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada." });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// GET /admin/propietarios/:id/mascotas/:mascotaId/historial
export async function adminHistorialMascota(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    const mascotaId = parseId(req.params.mascotaId);
    if (!propietarioId || !mascotaId) return res.status(400).json({ mensaje: "Id inválido." });

    // validar mascota pertenece a propietario
    const ownerCheck = await pool.query(
      `select id from mascotas where id = $1 and propietario_id = $2`,
      [mascotaId, propietarioId]
    );
    if (ownerCheck.rowCount === 0) return res.status(403).json({ mensaje: "No autorizado." });

    const r = await pool.query(
      `select id, propietario_id, mascota_id, tipo, fecha, titulo, detalle
       from historial_clinico
       where mascota_id = $1 and propietario_id = $2
       order by fecha desc
       limit 200`,
      [mascotaId, propietarioId]
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}

// POST /admin/propietarios/:id/citas/:citaId/atender
// crea historial + marca cita completada
export async function adminAtenderCita(req, res) {
  try {
    if (!requireStaff(req, res)) return;

    const propietarioId = parseId(req.params.id);
    const citaId = parseId(req.params.citaId);
    if (!propietarioId || !citaId) return res.status(400).json({ mensaje: "Id inválido." });

    const { titulo, notas, diagnostico, medicamentos, recomendaciones, tipo } = req.body ?? {};
    if (!titulo?.trim()) return res.status(400).json({ mensaje: "Título requerido." });

    // traer cita y mascota_id
    const c = await pool.query(
      `select id, mascota_id from citas where id = $1 and propietario_id = $2 limit 1`,
      [citaId, propietarioId]
    );
    if (c.rowCount === 0) return res.status(404).json({ mensaje: "Cita no encontrada." });

    const mascotaId = c.rows[0].mascota_id;

    const detalle = [
      notas?.trim() ? `Notas:\n${notas.trim()}` : null,
      diagnostico?.trim() ? `Diagnóstico:\n${diagnostico.trim()}` : null,
      medicamentos?.trim() ? `Medicamentos:\n${medicamentos.trim()}` : null,
      recomendaciones?.trim() ? `Recomendaciones:\n${recomendaciones.trim()}` : null,
    ].filter(Boolean).join("\n\n");

    // insertar historial
    await pool.query(
      `insert into historial_clinico (propietario_id, mascota_id, tipo, fecha, titulo, detalle)
       values ($1, $2, $3, now(), $4, $5)`,
      [propietarioId, mascotaId, (tipo || "consulta"), titulo.trim(), detalle || null]
    );

    // marcar cita completada
    await pool.query(
      `update citas set estado = 'completada', updated_at = now()
       where id = $1 and propietario_id = $2`,
      [citaId, propietarioId]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
}
