import { Request, Response } from "express";
import supabase from "../supabase";

export const criarEmprestimo = async (req: Request, res: Response) => {
    const { nome, usuario, livro, data_retirada, data_devolucao, status, observacao } = req.body;
    const { data, error } = await supabase.from('emprestimos').insert({
        nome,
        usuario,
        livro,
        data_retirada,
        data_devolucao,
        status,
        observacao
    });
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(201).json({ data });
};

export const buscarEmprestimos = async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('emprestimos').select('*');
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ data });
};

export const buscarEmprestimoById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('emprestimos').select('*').eq('id', id);
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ data });
};

export const atualizarEmprestimo = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nome, usuario, livro, data_retirada, data_devolucao, status, observacao } = req.body;
    const { data, error } = await supabase.from('emprestimos').update({
        nome,
        usuario,
        livro,
        data_retirada,
        data_devolucao,
        status,
        observacao
    }).eq('id', id);
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ data });
};

export const excluirEmprestimo = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('emprestimos').delete().eq('id', id);
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ data });
};
    