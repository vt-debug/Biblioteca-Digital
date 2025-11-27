import { Request, Response } from "express";
import supabase from "../supabase";

// ======= CRIAR EMPRESTIMO =======
export const criarEmprestimo = async (req: Request, res: Response) => {
  try {
    const { livro, usuario, data_retirada, data_devolucao, status, observacao } = req.body;

    const { data, error } = await supabase
      .from("emprestimos")
      .insert([{ livro, usuario, data_retirada, data_devolucao, status, observacao }])
      .select()
      .single(); // retorna o objeto criado direto

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ======= BUSCAR TODOS =======
export const buscarEmprestimos = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("emprestimos").select("*");
    if (error) throw error;

    return res.status(200).json(data); // retorna array direto
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ======= BUSCAR POR ID =======
export const buscarEmprestimoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("emprestimos").select("*").eq("id", id).single();
    if (error) throw error;

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ======= ATUALIZAR EMPRESTIMO =======
export const atualizarEmprestimo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { livro, usuario, data_retirada, data_devolucao, status, observacao } = req.body;

    const { data, error } = await supabase
      .from("emprestimos")
      .update({ livro, usuario, data_retirada, data_devolucao, status, observacao })
      .eq("id", id)
      .select()
      .single(); // retorna objeto atualizado

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ======= DELETAR EMPRESTIMO =======
export const excluirEmprestimo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("emprestimos").delete().eq("id", id);
    if (error) throw error;

    return res.status(204).send(); // sem conteúdo, frontend só precisa atualizar
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
