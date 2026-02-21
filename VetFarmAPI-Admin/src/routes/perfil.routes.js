import { Router } from "express";
import {
    actualizarPerfil,
    cambiarPassword,
    obtenerPerfil,
} from "../controllers/perfil.controller.js";

const router = Router();

// ✅ GET /perfil/:identificacion
router.get("/:identificacion", obtenerPerfil);

// ✅ PUT /perfil/:identificacion
router.put("/:identificacion", actualizarPerfil);

// ✅ PUT /perfil/:identificacion/password
router.put("/:identificacion/password", cambiarPassword);

export default router;

