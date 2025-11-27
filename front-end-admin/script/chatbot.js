(function () {

    /* ===== IMPORTA AS CHAVES DO SISTEMA ===== */
    const KEYS = {
        CHAT_ENABLED: 'admin_chat_enabled',
        CHAT_STATUS: 'admin_chat_status',
        CHAT_GREETING: 'admin_chat_greeting'
    };

    /* ===== URL DO SERVIDOR NODE (CORREÇÃO DO 405) ===== */
    const API_URL = "http://localhost:3000/chatbot";

    const mount = document.getElementById("chatbot-component");


    /* ======= LER CONFIGURAÇÕES SALVAS ======= */
    const CHAT_ENABLED = localStorage.getItem(KEYS.CHAT_ENABLED) !== "false";
    const CHAT_STATUS = localStorage.getItem(KEYS.CHAT_STATUS) || "online";
    const CHAT_GREETING = localStorage.getItem(KEYS.CHAT_GREETING) || "Olá! Como posso ajudar?";


    /* -- SE O CHAT ESTIVER DESATIVADO — REMOVE E SAI -- */
    if (!CHAT_ENABLED) {
        mount.innerHTML = "";
        return;
    }


    /* ========== HTML DO CHATBOT ========== */
    mount.innerHTML = `
        <div id="bia-chatbot" class="minimized">

            <!-- Bolha flutuante -->
            <div id="bia-button">
                <i class="ph ph-robot"></i>
                <span id="bia-unread"></span>
            </div>

            <!-- Janela -->
            <div id="bia-window">

                <div id="bia-header">
                    <div class="bia-title">
                        <div id="bia-avatar"><i class="ph ph-user"></i></div>
                        <div>
                            <strong>Bia</strong><br>
                            <span id="bia-status"></span>
                        </div>
                    </div>

                    <div class="bia-actions">
                        <button id="bia-clear" title="Limpar"><i class="ph ph-arrow-counter-clockwise"></i></button>
                        <button id="bia-close" title="Fechar"><i class="ph ph-x"></i></button>
                    </div>
                </div>

                <div id="bia-messages"></div>
                <div id="bia-typing">Bia está digitando…</div>

                <form id="bia-form">
                    <input id="bia-input" placeholder="Digite sua mensagem..." />
                    <button id="bia-send"><i class="ph ph-paper-plane-right"></i></button>
                </form>
            </div>
        </div>
    `;


    /* ======= ELEMENTOS ======= */
    const widget = document.getElementById("bia-chatbot");
    const unread = document.getElementById("bia-unread");
    const button = document.getElementById("bia-button");
    const closeBtn = document.getElementById("bia-close");
    const clearBtn = document.getElementById("bia-clear");
    const messages = document.getElementById("bia-messages");
    const typing = document.getElementById("bia-typing");
    const input = document.getElementById("bia-input");
    const form = document.getElementById("bia-form");
    const statusEl = document.getElementById("bia-status");

    let minimized = true;


    /* ========= STATUS ATUAL ========= */
    function applyStatus() {
        if (CHAT_STATUS === "online") {
            statusEl.textContent = "🟢 Online";
            statusEl.className = "status-online";
        }
        if (CHAT_STATUS === "away") {
            statusEl.textContent = "🟡 Ausente";
            statusEl.className = "status-away";
        }
        if (CHAT_STATUS === "offline") {
            statusEl.textContent = "🔴 Offline";
            statusEl.className = "status-offline";
        }
    }
    applyStatus();


    /* ========= FUNÇÕES ========= */

    function autoScroll() {
        messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, from = "bia") {
        const msg = document.createElement("div");
        msg.className = `bia-msg ${from === "user" ? "bia-user" : "bia-bia"}`;
        msg.textContent = text;
        messages.appendChild(msg);
        autoScroll();
    }


    async function sendMessage(msg) {

        if (CHAT_STATUS === "offline") {
            addMessage("Parece que estou offline agora 😴 — mas volto em breve!", "bia");
            return;
        }

        addMessage(msg, "user");
        input.value = "";

        typing.style.display = "block";

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg })
            });

            const data = await res.json();

            setTimeout(() => {
                typing.style.display = "none";
                addMessage(data.text, "bia");
            }, 350 + Math.random() * 400);

            if (minimized) unread.style.display = "block";

        } catch (err) {
            typing.style.display = "none";
            console.error(err);
            addMessage("Hmmm… não consegui falar com o servidor agora 😥", "bia");
        }
    }


    /* ========= EVENTOS ========= */

    button.onclick = () => {
        widget.classList.remove("minimized");
        minimized = false;
        unread.style.display = "none";

        if (messages.children.length === 0) {
            setTimeout(() => addMessage(CHAT_GREETING, "bia"), 200);
        }
    };

    closeBtn.onclick = () => {
        widget.classList.add("minimized");
        minimized = true;
    };

    clearBtn.onclick = () => {
        messages.innerHTML = "";
        addMessage("Prontinho! Conversa limpa ✨", "bia");
    };

    form.onsubmit = e => {
        e.preventDefault();
        if (!input.value.trim()) return;
        sendMessage(input.value.trim());
    };

})();
