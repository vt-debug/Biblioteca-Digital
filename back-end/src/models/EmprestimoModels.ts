export type Status = 'Ativo (Em andamento)'| 'Pendente' | 'Atrasado' | 'Devolvido';


export interface Emprestimo {
    id: string;
    nome: string;
    usuario: string;
    livro: string;
    data_retirada: Date;
    data_devolucao: Date;
    status: Status;
    observacao: string;
}