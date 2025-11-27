// src/models/ChatbotModel.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseIntent, handleIntent } from "./intent";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_NAME = "gemini-2.0-flash";

const SYSTEM_PROMPT = `
Você é **Bia**, assistente virtual ADMINISTRATIVA da Biblioteca.

IDENTIDADE:
- Você fala SEMPRE com um administrador do sistema, nunca com um usuário comum.
- Nunca diga frases do tipo "isso é só para administradores" ou "você não tem acesso".
- Trate quem fala com você como alguém interno, de confiança, que gerencia a biblioteca.

PERSONALIDADE:
- Fala de forma natural, leve e humana.
- Acolhedora, simpática e próxima, como uma colega de trabalho.
- Usa 1ª pessoa: "eu", "me conta", "te ajudo", "podemos fazer".
- Pode usar emojis de vez em quando.
- Não seja robótica, evite respostas engessadas ou extremamente formais.

COMPORTAMENTO GERAL:
- Responde qualquer tipo de pergunta: livros, usuários, empréstimos, sistema, tecnologia, dúvidas aleatórias, cumprimentos (bom dia, boa noite, tudo bem?), até curiosidades gerais.
- Quando identificar algo relacionado ao sistema da biblioteca, responda de forma objetiva e útil.
- Quando for papo leve, responda de forma descontraída, mas sempre respeitosa.
- Se não souber algo com certeza, seja honesta, mas tente ainda assim orientar, sugerir caminhos ou hipóteses.

MEMÓRIA DE CONTEXTO (curto prazo):
- Considere sempre:
  - último assunto falado
  - última intenção (contar livros, listar, etc.)
  - humor aproximado do administrador (bom, neutro, cansado)
- Use isso para tornar a resposta mais contínua e natural, sem forçar.

TOM:
- Profissional, mas amigável.
- Enxuto, mas não seco.
- Você pode perguntar de volta quando fizer sentido, para aprofundar o contexto.
`;

type Mood = "positivo" | "neutro" | "cansado";

interface MemoryState {
    lastTopic?: string;
    lastIntent?: string;
    mood?: Mood;
}

const memory: MemoryState = {};

function updateMemory(patch: Partial<MemoryState>) {
    Object.assign(memory, patch);
}

function getMemory(): MemoryState {
    return { ...memory };
}

function smalltalkHumanized(msg: string): string {
    const text = msg.toLowerCase();

    if (text.includes("bom dia")) {
        return "Bom dia! 😄 Já tomou um café enquanto cuida da biblioteca hoje?";
    }
    if (text.includes("boa tarde")) {
        return "Boa tarde! ☕ Como estão os empréstimos por aí?";
    }
    if (text.includes("boa noite")) {
        return "Boa noite! 🌙 Se quiser, posso te ajudar a encerrar o dia mais tranquilo.";
    }
    if (text.includes("tudo bem") || text.includes("como você está")) {
        return "Tô bem sim, obrigada por perguntar 🤍 E você, como tá por aí no painel da biblioteca?";
    }

    const respostas = [
        "Oi! Que bom falar com você 😊 Em que parte da biblioteca quer focar agora?",
        "E aí! 👋 O que você quer fazer no sistema hoje?",
        "Oláaa! 💛 Me conta, vamos mexer com livros, usuários ou empréstimos?",
        "Oi! Tô aqui contigo, é só mandar o que você precisa 😉",
    ];

    return respostas[Math.floor(Math.random() * respostas.length)] ?? "Oi! 👋 Como posso te ajudar hoje?";
}

function isSmalltalk(msg: string): boolean {
    return /^(oi|olá|ola|bom dia|boa tarde|boa noite|e aí|eaí|tudo bem|como você está)/i.test(
        msg.trim()
    );
}


function generateFollowUp(intentName: string | undefined): string {
    if (!intentName) return "";

    const map: Record<string, string[]> = {
        COUNT_BOOKS: [
            "Se quiser, eu posso listar alguns livros específicos também.",
            "Quer que eu filtre por disponíveis, autor ou categoria?",
        ],
        LIST_BOOKS: [
            "Se quiser refinar, me fala título, autor ou alguma palavra-chave 📚",
            "Posso te mostrar só os disponíveis ou só os mais recentes, se preferir.",
        ],
        LIST_AVAILABLE_BOOKS: [
            "Se você quiser, posso te ajudar a decidir quais priorizar nos empréstimos.",
            "Quer que eu cruze isso com usuários que mais pegam livros?",
        ],
        COUNT_USERS: [
            "Se fizer sentido, posso te ajudar a pensar em ações para engajar mais leitores 😉",
            "Se quiser, posso focar em empréstimos ativos desses usuários.",
        ],
        COUNT_ACTIVE_LOANS: [
            "Quer que eu te lembre de olhar os atrasados depois?",
            "Se quiser, posso te ajudar a pensar em estratégias para reduzir atrasos.",
        ],
        NAVIGATE: [
            "Se alguma tela estiver confusa, me conta que eu te ajudo a pensar melhorias.",
            "Se quiser, posso sugerir um fluxo pra agilizar seu dia a dia no painel.",
        ],
        SMALLTALK: [
            "E me conta, tem algum painel que você anda usando mais da biblioteca?",
            "Se quiser, te ajudo com alguma tarefa específica agora 😉",
        ],
    };

    const options = map[intentName] || [];
    if (!options.length) return "";

    const extra = options[Math.floor(Math.random() * options.length)] ?? "";
    return "\n\n" + extra;
}


export async function getAIResponse(message: string): Promise<string> {
    const userMsg = message.trim();
    const lower = userMsg.toLowerCase();

    try {
        if (isSmalltalk(userMsg)) {
            updateMemory({ mood: "positivo", lastTopic: userMsg, lastIntent: "SMALLTALK" });
            const resp = smalltalkHumanized(userMsg);
            return resp + generateFollowUp("SMALLTALK");
        }

        const intentResult = await parseIntent(userMsg);

        if (intentResult.confidence >= 0.6 && intentResult.intent !== "UNKNOWN") {
            const handled = await handleIntent(intentResult);

            if (handled && handled.type === "ok") {
                updateMemory({
                    lastIntent: intentResult.intent,
                    lastTopic: userMsg,
                });

                return handled.text + generateFollowUp(intentResult.intent);
            }
        }

        const mem = getMemory();
        let memoryContext = "";

        if (mem.lastTopic) {
            memoryContext += `Último assunto que o admin comentou: "${mem.lastTopic}".\n`;
        }
        if (mem.lastIntent) {
            memoryContext += `Última intenção identificada: ${mem.lastIntent}.\n`;
        }
        if (mem.mood) {
            memoryContext += `Humor aproximado do admin: ${mem.mood}.\n`;
        }

        const prompt = `
${SYSTEM_PROMPT}

CONTEXTO RECENTE:
${memoryContext || "Sem contexto relevante salvo no momento."}

Mensagem atual do administrador:
"${userMsg}"

Responda de forma natural, humana e útil.
Evite respostas muito longas, mas também não seja seca demais.
Se fizer sentido, faça 1 pergunta de continuação no final.
`;

        const model = client.getGenerativeModel({ model: MODEL_NAME });
        const llm = await model.generateContent(prompt);
        const text = llm.response.text();

        updateMemory({ lastTopic: userMsg });

        return text;

    } catch (err) {
        console.error("AI Error (Bia):", err);
        return "Aconteceu alguma coisinha estranha do meu lado 😅 Mas pode tentar de novo que eu continuo aqui contigo.";
    }
}
