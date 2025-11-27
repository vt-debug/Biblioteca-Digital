// usuarios.controller.ts
import { Request, Response } from "express";
import supabase from "../supabase";
import { Usuarios } from "../models/UsuariosModel";

// Listar todos os usuários
export const listarUsuarios = async (req: Request, res: Response) => {
    const { data, error } = await supabase.from("usuarios").select("*");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data as Usuarios[]);
};

// Inserir um novo usuário
export const inserirUsuario = async (req: Request, res: Response) => {
    const { nome, email, papel, status, observacao } = req.body;

    // Validação mínima de tipos
    if (!['leitor', 'editor', 'admin'].includes(papel)) {
        return res.status(400).json({ error: "Papel inválido" });
    }
    if (!['ativo', 'inativo'].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
    }

    const { data, error } = await supabase.from("usuarios").insert([
        { nome, email, papel, status, observacao }
    ]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data as Usuarios[] | null);
};

// Atualizar usuário existente
export const atualizarUsuario = async (req: Request, res: Response) => {
    const { nome, email, papel, status, observacao } = req.body;

    if (!['leitor', 'editor', 'admin'].includes(papel)) {
        return res.status(400).json({ error: "Papel inválido" });
    }
    if (!['ativo', 'inativo'].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
    }

    const { data, error } = await supabase.from("usuarios")
        .update({ nome, email, papel, status, observacao })
        .eq("id", req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data as Usuarios[] | null);
};

// Excluir usuário
export const excluirUsuario = async (req: Request, res: Response) => {
    const { data, error } = await supabase.from("usuarios")
        .delete()
        .eq("id", req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data as Usuarios[] | null);
};
