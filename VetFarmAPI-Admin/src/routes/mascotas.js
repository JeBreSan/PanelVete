import { Router } from "express";
import {
  listarMascotas,
  crearMascota,
  actualizarMascota,
  eliminarMascota,
} from "../controllers/mascotas.controller.js";

const router = Router();

router.get("/", listarMascotas);
router.post("/", crearMascota);
router.put("/:id", actualizarMascota);
router.delete("/:id", eliminarMascota);

export default router;
