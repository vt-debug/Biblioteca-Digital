const KEYS = {
    DARK: 'admin_darkmode',
    CURSOR: 'admin_cursor',
    AVATAR: 'admin_avatar',

    CHAT_ENABLED: 'admin_chat_enabled',
    CHAT_STATUS: 'admin_chat_status',
    CHAT_GREETING: 'admin_chat_greeting',

    DB_BOOKS: 'bibliotheca_books_db',
    DB_USERS: 'bibliotheca_users_db',
    DB_LOANS: 'bibliotheca_loans_db'
};

document.addEventListener('DOMContentLoaded', () => {
    initToggles();
    initAvatar();
    initChatSettings();
    initBackup();

    document.getElementById('btnSaveSettings').addEventListener('click', saveAllSettings);
});

function initToggles() {
    const toggleDark = document.getElementById('toggleDark');
    const toggleCursor = document.getElementById('toggleCursor');

    toggleDark.checked = localStorage.getItem(KEYS.DARK) === 'true';
    toggleCursor.checked = localStorage.getItem(KEYS.CURSOR) !== 'false';

    toggleDark.addEventListener('change', () => {
        localStorage.setItem(KEYS.DARK, toggleDark.checked);
        window.applyAdminPreferences(); // Chama func do admin-global
        updatePill('prefDarkState', toggleDark.checked ? 'Escuro' : 'Claro');
    });

    toggleCursor.addEventListener('change', () => {
        localStorage.setItem(KEYS.CURSOR, toggleCursor.checked);
        window.applyAdminPreferences();
        updatePill('prefCursorState', toggleCursor.checked ? 'Ativo' : 'Padrão');
    });

    updatePill('prefDarkState', toggleDark.checked ? 'Escuro' : 'Claro');
    updatePill('prefCursorState', toggleCursor.checked ? 'Ativo' : 'Padrão');
}

function initAvatar() {
    const input = document.getElementById('avatarInput');
    const img = document.getElementById('avatarPreview');
    const saved = localStorage.getItem(KEYS.AVATAR);

    if (saved) {
        input.value = saved;
        img.src = saved;
    }

    input.addEventListener('input', (e) => {
        if (e.target.value.length > 10) img.src = e.target.value;
    });
}

function initChatSettings() {
    const toggleChat = document.getElementById('toggleChat');
    const chatStatus = document.getElementById('chatStatus');
    const chatGreeting = document.getElementById('chatGreeting');
    const previewMsg = document.getElementById('chatPreviewMessage');
    const liveBadge = document.getElementById('chatLiveStatus');

    toggleChat.checked = localStorage.getItem(KEYS.CHAT_ENABLED) !== 'false';
    chatStatus.value = localStorage.getItem(KEYS.CHAT_STATUS) || 'online';
    chatGreeting.value = localStorage.getItem(KEYS.CHAT_GREETING) || '';

    chatGreeting.addEventListener('input', (e) => {
        previewMsg.textContent = e.target.value || "Olá! Como posso ajudar?";
    });

    const updateBadge = () => {
        const isOnline = toggleChat.checked && chatStatus.value !== 'offline';
        liveBadge.textContent = isOnline ? 'Online' : 'Offline';
        liveBadge.className = `status-badge ${isOnline ? 'active' : 'late'}`;
        updatePill('prefChatState', isOnline ? 'Online' : 'Off');
    };

    toggleChat.addEventListener('change', updateBadge);
    chatStatus.addEventListener('change', updateBadge);

    previewMsg.textContent = chatGreeting.value || "Olá! Como posso ajudar?";
    updateBadge();
}

function initBackup() {
    document.getElementById('btnExport').addEventListener('click', () => {
        const data = {
            books: JSON.parse(localStorage.getItem(KEYS.DB_BOOKS) || '[]'),
            users: JSON.parse(localStorage.getItem(KEYS.DB_USERS) || '[]'),
            loans: JSON.parse(localStorage.getItem(KEYS.DB_LOANS) || '[]'),
            date: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bibliotheca_backup.json`;
        a.click();
        showToast('Backup realizado!');
    });

    const fileInput = document.getElementById('fileImport');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.books) localStorage.setItem(KEYS.DB_BOOKS, JSON.stringify(data.books));
                if (data.users) localStorage.setItem(KEYS.DB_USERS, JSON.stringify(data.users));
                if (data.loans) localStorage.setItem(KEYS.DB_LOANS, JSON.stringify(data.loans));
                showToast('Dados importados com sucesso!');
            } catch (err) { alert('Erro ao ler arquivo.'); }
        };
        reader.readAsText(file);
    });
}

function saveAllSettings() {
    localStorage.setItem(KEYS.CHAT_ENABLED, document.getElementById('toggleChat').checked);
    localStorage.setItem(KEYS.CHAT_STATUS, document.getElementById('chatStatus').value);
    localStorage.setItem(KEYS.CHAT_GREETING, document.getElementById('chatGreeting').value);

    const avatarUrl = document.getElementById('avatarInput').value.trim();
    if (avatarUrl) {
        localStorage.setItem(KEYS.AVATAR, avatarUrl);
        window.applyAdminAvatar();
    }

    showToast('Preferências salvas!');
}

function updatePill(id, text) {
    const el = document.getElementById(id);
    if (el) el.querySelector('strong').textContent = text;
}

function showToast(msg) {
    const toast = document.getElementById('adminToast');
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}