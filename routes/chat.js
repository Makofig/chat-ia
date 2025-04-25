import { Router } from "express";
import Chat from "../controllers/controllerChat.js";
import multer from "multer";


const router = Router();
const upload = multer({ dest: "uploads/" });
// POST /api/chat
router.post('/api/chat', Chat.textToChat);

router.post('/api/audio', upload.single('audio'), Chat.audioGrabar); 

export default router;