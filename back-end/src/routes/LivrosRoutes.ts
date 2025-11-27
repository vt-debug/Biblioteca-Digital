import { Router } from "express";
import { listarLivros, inserirLivro, atualizarLivro, excluirLivro } from "../controllers/LivrosController";


const router = Router();

// Listar todos os usuários
router.get("/", listarLivros);

// Inserir um novo usuário
router.post("/", inserirLivro);

// Atualizar um usuário existente
router.put("/:id", atualizarLivro);

// Excluir um usuário
router.delete("/:id", excluirLivro);

export default router;