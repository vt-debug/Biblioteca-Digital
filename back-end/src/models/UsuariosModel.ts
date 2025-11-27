export type Papel = 'leitor' | 'editor' | 'admin';
export type Status = 'ativo' | 'pendente' | 'suspenso';

export interface Usuarios {
    id: string;
    nome: string;
    email: string;
    papel: Papel;
    status: Status;
    observacao: string;
}

