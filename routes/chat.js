import { Router } from "express";
import Chat from "../controllers/controllerChat.js";

const router = Router();

// POST /api/chat
router.post('/api/chat', Chat.textToChat);

export default router;