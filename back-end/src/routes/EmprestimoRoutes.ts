import { Router } from "express";
import { criarEmprestimo, buscarEmprestimos, buscarEmprestimoById, atualizarEmprestimo, excluirEmprestimo } from "../controllers/EmprestimoController";


const emprestimoRoutes = Router();

emprestimoRoutes.get('/', buscarEmprestimos);
emprestimoRoutes.get('/:id', buscarEmprestimoById);
emprestimoRoutes.post('/', criarEmprestimo);
emprestimoRoutes.put('/:id', atualizarEmprestimo);
emprestimoRoutes.delete('/:id', excluirEmprestimo);


export default emprestimoRoutes;
