import { Router } from "express";
import {
  actualizarUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerUsuario,
} from "../controllers/usuarios.controller.js";

const router = Router();

router.get("/", listarUsuarios);
router.get("/:id", obtenerUsuario);
router.put("/:id", actualizarUsuario);
router.delete("/:id", eliminarUsuario);

export default router;
