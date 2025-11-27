import { Request, Response } from "express";
import supabase from "../supabase";

export const listarLivros = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase.from("livros").select("*");
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao listar livros" });
    }
};

export const inserirLivro = async (req: Request, res: Response) => {
    try {
        const { titulo, autor, categoria, isbn, estoque, observacao } = req.body;
        const { data, error } = await supabase.from("livros").insert({
            titulo,
            autor,
            categoria,
            isbn,
            estoque,
            observacao
        });
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao inserir livro" });
    }
};

export const atualizarLivro = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { titulo, autor, categoria, isbn, estoque, observacao } = req.body;
        const { data, error } = await supabase.from("livros").update({
            titulo,
            autor,
            categoria,
            isbn,
            estoque,
            observacao
        }).eq("id", id);
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao atualizar livro" });
    }
};

export const excluirLivro = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from("livros").delete().eq("id", id);
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao excluir livro" });
    }
};
