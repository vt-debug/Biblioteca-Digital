
export type Categoria = 'Ficção' | 'Fantasia' | 'Romance' | 'Sci-Fi' | 'Terror' | 'Desenvolvimento' | 'Thriller' | 'Técnico';



export interface Livros {
    id: string;
    titulo: string;
    autor: string;
    categoria: Categoria;
    isbn: string;
    estoque: number;
    capa: string;
    observacao: string;
}