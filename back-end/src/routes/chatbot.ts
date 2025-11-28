// src/routes/chatbot.ts

import { Router, Request, Response } from "express";
import { getAIResponse } from "../models/ChatbotModel";

const router = Router();

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

// POST /chatbot - Recebe mensagem do usuário e retorna resposta da Bia
router.post("/", async (req: Request, res: Response) => {
  try {
    const { message } = req.body as ChatRequest;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Mensagem inválida ou vazia"
      });
    }

    // Chama o modelo de IA para gerar resposta
    const aiResponse = await getAIResponse(message.trim());

    const response: ChatResponse = {
      id: Date.now(),
      text: aiResponse,
      sender: "bia",
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error("Erro no endpoint /chatbot:", error);
    return res.status(500).json({
      error: "Erro ao processar mensagem",
      text: "Desculpe, ocorreu um erro inesperado. Tente novamente."
    });
  }
});

export default router;