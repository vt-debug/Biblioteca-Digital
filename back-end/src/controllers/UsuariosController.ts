import { Request, Response } from "express";
import supabase from "../supabase";

// ---------------- LISTAR USUÁRIOS ----------------
export const listarUsuarios = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase.from("usuarios").select("*");
        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        console.log("Erro listarUsuarios:", err);
        return res.status(500).json({ error: String(err) });
    }
};

// ---------------- CRIAR USUÁRIO ----------------
export const inserirUsuario = async (req: Request, res: Response) => {
    try {
        const { nome, email, papel, status, observacao } = req.body;

        if (!nome || !email || !papel || !status)
            return res.status(400).json({ error: "Campos obrigatórios faltando" });

        const papelLower = papel.toLowerCase();
        const statusLower = status.toLowerCase();

        if (!["leitor", "editor", "admin"].includes(papelLower))
            return res.status(400).json({ error: "Papel inválido" });
        if (!["active", "pending", "suspended"].includes(statusLower))
            return res.status(400).json({ error: "Status inválido" });

        const { data, error } = await supabase.from("usuarios")
            .insert([{ nome, email, papel: papelLower, status: statusLower, observacao }])
            .select(); // retorna o registro criado

        if (error) throw error;

        return res.status(201).json(data);
    } catch (err) {
        console.log("Erro inserirUsuario:", err);
        return res.status(500).json({ error: String(err) });
    }
};

// ---------------- ATUALIZAR USUÁRIO ----------------
export const atualizarUsuario = async (req: Request, res: Response) => {
    try {
        const { nome, email, papel, status, observacao } = req.body;
        const { id } = req.params;

        const papelLower = papel?.toLowerCase();
        const statusLower = status?.toLowerCase();

        const { data, error } = await supabase.from("usuarios")
            .update({ nome, email, papel: papelLower, status: statusLower, observacao })
            .eq("id", id)
            .select();

        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        console.log("Erro atualizarUsuario:", err);
        return res.status(500).json({ error: String(err) });
    }
};

// ---------------- EXCLUIR USUÁRIO ----------------
export const excluirUsuario = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from("usuarios").delete().eq("id", id);
        if (error) throw error;
        return res.status(200).json({ message: "Usuário excluído", data });
    } catch (err) {
        console.log("Erro excluirUsuario:", err);
        return res.status(500).json({ error: String(err) });
    }
};
