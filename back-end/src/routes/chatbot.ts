

import router from "./UsuariosRoutes";

interface BiaResponse {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

const API_URL = "http://localhost:3000/chatbot";

const KEYS = {
  CHAT_ENABLED: "admin_chat_enabled",
  CHAT_STATUS: "admin_chat_status",
  CHAT_GREETING: "admin_chat_greeting"
};

(function () {
  const mount = document.getElementById("chatbot-component");
  if (!mount) return;

  const chatEnabled = localStorage.getItem(KEYS.CHAT_ENABLED) !== "false";
  const chatStatus = localStorage.getItem(KEYS.CHAT_STATUS) || "online";
  const greeting = localStorage.getItem(KEYS.CHAT_GREETING) || "Olá! Como posso ajudar?";

  if (!chatEnabled) {
    mount.innerHTML = "";
    return;
  }


  mount.innerHTML = `
        <div id="bia-chatbot" class="minimized">

            <!-- Botão flutuante -->
            <div id="bia-button">
                <i class="ph ph-robot"></i>
                <span id="bia-unread"></span>
            </div>

            <!-- Janela -->
            <div id="bia-window">

                <div id="bia-header">
                    <div class="bia-title">
                        <div id="bia-avatar"><i class="ph ph-robot"></i></div>
                        <strong>Bia</strong>
                    </div>

                    <div id="bia-status" class="status-${chatStatus}">
                        ${chatStatus === "online"
      ? "🟢 Online"
      : chatStatus === "away"
        ? "🟡 Ausente"
        : "🔴 Offline"}
                    </div>

                    <div class="bia-actions">
                        <button id="bia-clear"><i class="ph ph-arrow-counter-clockwise"></i></button>
                        <button id="bia-close"><i class="ph ph-x"></i></button>
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

  const widget = document.getElementById("bia-chatbot") as HTMLElement;
  const unread = document.getElementById("bia-unread") as HTMLElement;
  const button = document.getElementById("bia-button") as HTMLElement;
  const closeBtn = document.getElementById("bia-close") as HTMLElement;
  const clearBtn = document.getElementById("bia-clear") as HTMLElement;
  const messagesBox = document.getElementById("bia-messages") as HTMLElement;
  const typing = document.getElementById("bia-typing") as HTMLElement;
  const form = document.getElementById("bia-form") as HTMLFormElement;
  const input = document.getElementById("bia-input") as HTMLInputElement;
  const statusEl = document.getElementById("bia-status") as HTMLElement;

  let minimized = true;


  function addMessage(text: string, from: "bia" | "user" = "bia") {
    const msg = document.createElement("div");
    msg.className = `bia-msg ${from === "user" ? "bia-user" : "bia-bia"}`;
    msg.textContent = text;
    messagesBox.appendChild(msg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }


  async function sendMessage(msg: string) {
    if (chatStatus === "offline") {
      addMessage("Estou indisponível no momento 😢", "bia");
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

      if (!res.ok) throw new Error("Erro no servidor");

      const data: BiaResponse = await res.json();

      setTimeout(() => {
        typing.style.display = "none";
        addMessage(data.text, "bia");
      }, 600 + Math.random() * 500);

      if (minimized) unread.style.display = "block";

    } catch (err) {
      typing.style.display = "none";
      addMessage("Acho que perdi a conexão por um instante 😥", "bia");
    }
  }

  button.onclick = () => {
    widget.classList.remove("minimized");
    minimized = false;
    unread.style.display = "none";

    if (!messagesBox.hasChildNodes()) {
      addMessage(greeting, "bia");
    }
  };

  closeBtn.onclick = () => {
    widget.classList.add("minimized");
    minimized = true;
  };

  clearBtn.onclick = () => {
    messagesBox.innerHTML = "";
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    sendMessage(input.value.trim());
  };

  (window as any).BiaChat = {
    setStatus(state: "online" | "away" | "offline") {
      statusEl.className = `status-${state}`;
      statusEl.textContent =
        state === "online"
          ? "🟢 Online"
          : state === "away"
            ? "🟡 Ausente"
            : "🔴 Offline";
    }
  };

})();

export default router;