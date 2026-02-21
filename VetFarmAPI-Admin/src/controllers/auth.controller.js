import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

// ✅ POST /auth/registro
export const registro = async (req, res) => {
  const { identificacion, nombre, telefono, correo, password } = req.body;

  if (
    !identificacion?.trim() ||
    !nombre?.trim() ||
    !telefono?.trim() ||
    !correo?.trim() ||
    !password?.trim()
  ) {
    return res.status(400).json({
      mensaje: "Datos incompletos. Por favor complete todos los campos.",
    });
  }

  // Validación básica de correo
  const correoOk = /\S+@\S+\.\S+/.test(correo.trim());
  if (!correoOk) {
    return res.status(400).json({ mensaje: "Correo inválido. Revise sus datos." });
  }

  try {
    // ✅ Identificación única
    const existeId = await pool.query(
      "SELECT id FROM propietarios WHERE identificacion = $1 LIMIT 1",
      [identificacion.trim()]
    );

    if (existeId.rows.length > 0) {
      return res.status(409).json({
        mensaje: "La identificación ya está registrada. Revise sus datos.",
      });
    }

    // ✅ Correo único lógico (aunque tu BD no lo tenga UNIQUE)
    const existeCorreo = await pool.query(
      "SELECT id FROM propietarios WHERE correo = $1 LIMIT 1",
      [correo.trim()]
    );

    if (existeCorreo.rows.length > 0) {
      return res.status(409).json({
        mensaje: "El correo ya está registrado. Revise sus datos.",
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await pool.query(
      `INSERT INTO propietarios (identificacion, nombre, telefono, correo, password, rol)
       VALUES ($1, $2, $3, $4, $5, 'usuario')`,
      [
        identificacion.trim(),
        nombre.trim(),
        telefono.trim(),
        correo.trim(),
        passwordHash,
      ]
    );

    return res.status(201).json({
      mensaje: "Registro exitoso. Ya puede iniciar sesión.",
    });
  } catch (error) {
    console.error("registro error:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// ✅ POST /auth/login
export const login = async (req, res) => {
  const { identificacion, password } = req.body;

  if (!identificacion?.trim() || !password?.trim()) {
    return res.status(400).json({ mensaje: "Credenciales incompletas." });
  }

  try {
    const result = await pool.query(
      `SELECT id, identificacion, nombre, telefono, correo, password, rol
       FROM propietarios
       WHERE identificacion = $1
       LIMIT 1`,
      [identificacion.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas." });
    }

    const usuario = result.rows[0];

    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas." });
    }

    return res.json({
      mensaje: "Inicio de sesión exitoso.",
      usuario: {
        id: usuario.id,
        identificacion: usuario.identificacion,
        nombre: usuario.nombre,
        telefono: usuario.telefono,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
