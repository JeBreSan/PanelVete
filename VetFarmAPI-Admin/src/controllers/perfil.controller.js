import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

// ✅ GET /perfil/:identificacion
export const obtenerPerfil = async (req, res) => {
  const { identificacion } = req.params;

  if (!identificacion?.trim()) {
    return res.status(400).json({ mensaje: "Identificación requerida." });
  }

  try {
    const result = await pool.query(
      `SELECT id, identificacion, nombre, telefono, correo, rol
       FROM propietarios
       WHERE identificacion = $1
       LIMIT 1`,
      [identificacion.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    return res.json({ perfil: result.rows[0] });
  } catch (e) {
    console.error("obtenerPerfil error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// ✅ PUT /perfil/:identificacion  (nombre/telefono/correo)
export const actualizarPerfil = async (req, res) => {
  const { identificacion } = req.params;
  const { nombre, telefono, correo } = req.body;

  if (!identificacion?.trim()) {
    return res.status(400).json({ mensaje: "Identificación requerida." });
  }

  if (!nombre?.trim() || !telefono?.trim() || !correo?.trim()) {
    return res
      .status(400)
      .json({ mensaje: "Datos incompletos. Por favor complete todos los campos." });
  }

  const correoOk = /\S+@\S+\.\S+/.test(correo.trim());
  if (!correoOk) {
    return res.status(400).json({ mensaje: "Correo inválido. Revise sus datos." });
  }

  try {
    const existe = await pool.query(
      "SELECT id FROM propietarios WHERE identificacion = $1 LIMIT 1",
      [identificacion.trim()]
    );

    if (existe.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    // Evitar correo duplicado en OTRO usuario
    const correoUsado = await pool.query(
      "SELECT id FROM propietarios WHERE correo = $1 AND identificacion <> $2 LIMIT 1",
      [correo.trim(), identificacion.trim()]
    );

    if (correoUsado.rows.length > 0) {
      return res
        .status(409)
        .json({ mensaje: "El correo ya está registrado. Revise sus datos." });
    }

    await pool.query(
      `UPDATE propietarios
       SET nombre = $1, telefono = $2, correo = $3
       WHERE identificacion = $4`,
      [nombre.trim(), telefono.trim(), correo.trim(), identificacion.trim()]
    );

    return res.json({ mensaje: "Perfil actualizado correctamente." });
  } catch (e) {
    console.error("actualizarPerfil error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// ✅ PUT /perfil/:identificacion/password
export const cambiarPassword = async (req, res) => {
  const { identificacion } = req.params;
  const { passwordActual, passwordNueva } = req.body;

  if (!identificacion?.trim()) {
    return res.status(400).json({ mensaje: "Identificación requerida." });
  }

  if (!passwordActual?.trim() || !passwordNueva?.trim()) {
    return res.status(400).json({ mensaje: "Datos incompletos." });
  }

  if (passwordNueva.trim().length < 6) {
    return res
      .status(400)
      .json({ mensaje: "La contraseña nueva debe tener al menos 6 caracteres." });
  }

  try {
    const r = await pool.query(
      "SELECT password FROM propietarios WHERE identificacion = $1 LIMIT 1",
      [identificacion.trim()]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const hash = r.rows[0].password;
    const ok = await bcrypt.compare(passwordActual, hash);

    if (!ok) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas." });
    }

    const nuevaHash = await bcrypt.hash(passwordNueva.trim(), 10);

    await pool.query(
      "UPDATE propietarios SET password = $1 WHERE identificacion = $2",
      [nuevaHash, identificacion.trim()]
    );

    return res.json({ mensaje: "Contraseña actualizada correctamente." });
  } catch (e) {
    console.error("cambiarPassword error:", e);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
