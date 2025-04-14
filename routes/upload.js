import {Router} from "express";
import upload from "../middlewares/upload.js";
import { analizarArchivo } from "../controllers/controllerArchivo.js";


const router = Router();

router.post('/api/upload', upload.single('archivo'), analizarArchivo); // Cambia 'file' por el nombre del campo en tu formulario

export default router;