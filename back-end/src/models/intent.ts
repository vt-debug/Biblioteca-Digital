
import { GoogleGenerativeAI } from "@google/generative-ai";
import supabase from "../supabase";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_NAME = "gemini-2.0-flash";
const model = client.getGenerativeModel({ model: MODEL_NAME });


export type IntentName =
    | "COUNT_BOOKS"
    | "LIST_BOOKS"
    | "LIST_AVAILABLE_BOOKS"
    | "COUNT_USERS"
    | "COUNT_ACTIVE_LOANS"
    | "NAVIGATE"
    | "SMALLTALK"
    | "UNKNOWN";

export interface IntentResult {
    intent: IntentName;
    confidence: number;
    entities: Record<string, any>;
}


function buildIntentPrompt(userMessage: string) {
    return `
Você é um classificador de intenções para o sistema administrativo da **Biblioteca**.

Retorne **somente JSON válido**, no formato EXATO:
{
 "intent": "X",
 "confidence": 0.0,
 "entities": { ... }
}

INTENTS VÁLIDAS:
- COUNT_BOOKS → quando perguntar quantidade de livros
- LIST_BOOKS → listar livros / por título / autor
- LIST_AVAILABLE_BOOKS → listar somente os disponíveis
- COUNT_USERS → perguntar total de usuários cadastrados
- COUNT_ACTIVE_LOANS → perguntar total de empréstimos ativos
- NAVIGATE → abrir uma página do sistema (entities.path)
- SMALLTALK → conversas humanas ("oi", "bom dia", "tudo bem", etc.)
- UNKNOWN → não identificado

REGRAS IMPORTANTES:
- SMALLTALK deve ativar quando o usuário fala casualmente.
- NAVIGATE deve retornar entities.path, ex: "/livros", "/users", "/emprestimos".
- LIST_BOOKS pode retornar entities.titulo, entities.autor e entities.limit.
- Se não souber, retorne intent="UNKNOWN" e confidence < 0.6.

Mensagem do admin:
"${userMessage.replace(/"/g, '\\"')}"
`.trim();
}


export async function parseIntent(msg: string): Promise<IntentResult> {
    try {
        const prompt = buildIntentPrompt(msg);
        const result = await model.generateContent(prompt);

        const raw = result.response.text();

        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return { intent: "UNKNOWN", confidence: 0, entities: {} };

        const parsed = JSON.parse(match[0]);

        return {
            intent: parsed.intent ?? "UNKNOWN",
            confidence: Number(parsed.confidence ?? 0),
            entities: parsed.entities ?? {}
        };

    } catch (err) {
        console.error("parseIntent error:", err);
        return { intent: "UNKNOWN", confidence: 0, entities: {} };
    }
}


export async function handleIntent(intent: IntentResult) {
    const { intent: name, entities } = intent;

    try {
        switch (name) {

            case "COUNT_BOOKS": {
                const { count } = await supabase
                    .from("livros")
                    .select("*", { count: "exact", head: true });

                return {
                    type: "ok",
                    text: `Atualmente temos **${count ?? 0} livros** cadastrados.`
                };
            }

            case "LIST_BOOKS": {
                const limit = Number(entities?.limit) || 10;

                let query = supabase
                    .from("livros")
                    .select("titulo, autor, status")
                    .limit(limit);

                if (entities?.titulo) query.ilike("titulo", `%${entities.titulo}%`);
                if (entities?.autor) query.ilike("autor", `%${entities.autor}%`);

                const { data } = await query;

                if (!data || data.length === 0) {
                    return { type: "ok", text: "Nenhum livro encontrado com esse filtro." };
                }

                const list = data
                    .map(l => `• **${l.titulo}** — ${l.autor} (${l.status})`)
                    .join("\n");

                return { type: "ok", text: `Aqui está o que encontrei:\n\n${list}` };
            }

            case "LIST_AVAILABLE_BOOKS": {
                const { data } = await supabase
                    .from("livros")
                    .select("titulo, autor")
                    .eq("status", "Disponível");

                if (!data || data.length === 0) {
                    return { type: "ok", text: "No momento não temos livros disponíveis 😕" };
                }

                const list = data.map(l => `• ${l.titulo} — ${l.autor}`).join("\n");

                return {
                    type: "ok",
                    text: `Esses estão liberados agora:\n\n${list}`
                };
            }

            case "COUNT_USERS": {
                const { count } = await supabase
                    .from("usuarios")
                    .select("*", { count: "exact", head: true });

                return {
                    type: "ok",
                    text: `Temos atualmente **${count ?? 0} usuários** cadastrados.`
                };
            }

            case "COUNT_ACTIVE_LOANS": {
                const { count } = await supabase
                    .from("emprestimos")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "Ativo");

                return {
                    type: "ok",
                    text: `Existem **${count ?? 0} empréstimos ativos** no momento.`
                };
            }

            case "NAVIGATE":
                return {
                    type: "ok",
                    text: `Perfeito! Pode acessar: **${entities.path ?? "/"}**`
                };

            case "SMALLTALK":
                return {
                    type: "ok",
                    text: "Estou aqui, qualquer coisa só me chamar 💛"
                };

            default:
                return null;
        }

    } catch (err) {
        console.error("handleIntent error:", err);
        return { type: "ok", text: "Tive um probleminha aqui, tenta de novo?" };
    }
}
