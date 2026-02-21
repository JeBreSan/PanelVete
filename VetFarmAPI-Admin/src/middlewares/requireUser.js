export function requireUser(req, res, next) {
  const rawId = req.header("x-user-id");
  const rol = req.header("x-user-rol");

  const id = Number(rawId);

  if (!rawId || !Number.isFinite(id) || id <= 0) {
    return res.status(401).json({ mensaje: "No autenticado. Falta x-user-id." });
  }

  // ✅ Roles válidos del sistema
  const ROLES_VALIDOS = ["usuario", "admin", "doctor", "staff"];

  if (!rol || !ROLES_VALIDOS.includes(rol)) {
    return res.status(401).json({ mensaje: "No autenticado. Falta x-user-rol." });
  }

  req.user = { id, rol };
  next();
}
