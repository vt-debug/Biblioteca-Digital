import { Router } from "express";
import { 
    listarUsuarios, 
    inserirUsuario, 
    atualizarUsuario, 
    excluirUsuario 
} from "../controllers/UsuariosController";

const router = Router();

// ---------------------- ROTAS ----------------------

// Listar todos os usuários
router.get("/", listarUsuarios);

// Inserir um novo usuário
router.post("/", inserirUsuario);

// Atualizar usuário existente (recebe ID na URL)
router.put("/:id", atualizarUsuario);

// Excluir usuário (recebe ID na URL)
router.delete("/:id", excluirUsuario);

export default router;
