import { pool } from "../config/db.js";

// ✅ helper: solo admin
function requireAdmin(req, res) {
  const rol = String(req.user?.rol || "usuario").toLowerCase();
  if (rol !== "admin") {
    res.status(403).json({ mensaje: "Prohibido. Solo admin." });
    return false;
  }
  return true;
}

// ✅ helper: validar id
function parseId(param) {
  const n = Number(param);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// GET /usuarios  (realmente propietarios)
export const listarUsuarios = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const r = await pool.query(
      `SELECT id, identificacion, nombre, telefono, correo, rol
       FROM propietarios
       ORDER BY id DESC`
    );

    return res.json(r.rows);
  } catch (e) {
    console.error("listarUsuarios error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// GET /usuarios/:id
export const obtenerUsuario = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const userId = parseId(req.params.id);
    if (!userId) return res.status(400).json({ mensaje: "Id inválido." });

    const r = await pool.query(
      `SELECT id, identificacion, nombre, telefono, correo, rol
       FROM propietarios
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    return res.json(r.rows[0]);
  } catch (e) {
    console.error("obtenerUsuario error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// PUT /usuarios/:id
export const actualizarUsuario = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const userId = parseId(req.params.id);
    if (!userId) return res.status(400).json({ mensaje: "Id inválido." });

    // ✅ verificar que exista
    const existe = await pool.query(
      `SELECT id FROM propietarios WHERE id = $1 LIMIT 1`,
      [userId]
    );
    if (existe.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const { identificacion, nombre, telefono, correo, rol } = req.body ?? {};

    const fields = [];
    const values = [];
    let idx = 1;

    if (typeof identificacion !== "undefined") {
      const i = String(identificacion).trim();
      if (!i) return res.status(400).json({ mensaje: "Identificación inválida." });
      fields.push(`identificacion = $${idx++}`);
      values.push(i);
    }

    if (typeof nombre !== "undefined") {
      const n = String(nombre).trim();
      if (!n) return res.status(400).json({ mensaje: "Nombre inválido." });
      fields.push(`nombre = $${idx++}`);
      values.push(n);
    }

    if (typeof telefono !== "undefined") {
      const t = String(telefono).trim();
      fields.push(`telefono = $${idx++}`);
      values.push(t ? t : null);
    }

    if (typeof correo !== "undefined") {
      const c = String(correo).trim();
      fields.push(`correo = $${idx++}`);
      values.push(c ? c : null);
    }

    if (typeof rol !== "undefined") {
  const r = String(rol).trim().toLowerCase();
  const ROLES_VALIDOS = ["admin", "staff", "doctor", "usuario"];

  if (!ROLES_VALIDOS.includes(r)) {
    return res.status(400).json({ mensaje: "Rol inválido (admin|staff|doctor|usuario)." });
  }


      // ✅ opcional: evitar que te quites el admin a ti mismo sin querer
      // (si querés permitirlo, borrá este bloque)
      if (Number(req.user?.id) === userId && r !== "admin") {
        return res.status(400).json({ mensaje: "No podés quitarte el rol admin a vos mismo." });
      }

      fields.push(`rol = $${idx++}`);
      values.push(r);
    }

    if (fields.length === 0) {
      return res.status(400).json({ mensaje: "No hay campos para actualizar." });
    }

    values.push(userId);

    const q = `
      UPDATE propietarios
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING id, identificacion, nombre, telefono, correo, rol
    `;

    const updated = await pool.query(q, values);
    return res.json(updated.rows[0]);
  } catch (e) {
  console.error("actualizarUsuario error:", e);
  return res.status(500).json({ mensaje: "Error interno del servidor.", detail: String(e?.message || e) });
}
};

// DELETE /usuarios/:id  (hard delete porque no hay activo)
export const eliminarUsuario = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const userId = parseId(req.params.id);
    if (!userId) return res.status(400).json({ mensaje: "Id inválido." });

    // ✅ evitar que borres tu propia cuenta admin por accidente
    if (Number(req.user?.id) === userId) {
      return res.status(400).json({ mensaje: "No podés eliminar tu propio usuario." });
    }

    // ✅ verificar existencia
    const existe = await pool.query(
      `SELECT id FROM propietarios WHERE id = $1 LIMIT 1`,
      [userId]
    );
    if (existe.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    await pool.query(`DELETE FROM propietarios WHERE id = $1`, [userId]);

    return res.json({ mensaje: "Usuario eliminado." });
  } catch (e) {
    console.error("eliminarUsuario error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
