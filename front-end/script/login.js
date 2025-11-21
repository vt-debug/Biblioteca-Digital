// --- APLICAR PREFERÊNCIAS GLOBAIS (Cole no final de todos os arquivos JS) ---
function applyGlobalPreferences() {
    // 1. Tema Escuro
    const isDark = localStorage.getItem('bibliotheca_darkmode') === 'true';
    if (isDark) document.documentElement.classList.add('dark-mode');
    else document.documentElement.classList.remove('dark-mode');

    // 2. Cursor Customizado
    const cursorPref = localStorage.getItem('bibliotheca_cursor');
    if (cursorPref === 'false') document.documentElement.classList.add('no-custom-cursor');
    else document.documentElement.classList.remove('no-custom-cursor');

    // 3. Foto de Perfil (Avatar)
    const savedAvatar = localStorage.getItem('bibliotheca_avatar');
    if (savedAvatar) {
        // Atualiza avatar do header e avatares pequenos nos cards
        document.querySelectorAll('.avatar, .avatar-small').forEach(img => {
            // Verifica se a imagem é do usuário atual (para não trocar foto de outros usuários no feed)
            // Uma forma simples é verificar se o src atual é o padrão ou se está numa área de "perfil"
            if(img.closest('.profile-wrapper') || img.closest('.create-post-card')) {
                img.src = savedAvatar;
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalPreferences(); // <--- CHAME AQUI PRIMEIRO
    // ... resto do seu código init ...
});

const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button');
        const originalText = submitBtn.innerText;

        submitBtn.innerText = "Processando...";
        submitBtn.style.opacity = "0.8";

        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1000);
    });
});

const actionBtns = document.querySelectorAll('.form-container button');
actionBtns.forEach(btn => {
    if (!btn.classList.contains('hidden')) {
        btn.addEventListener('click', () => {
            btn.innerText = "Processando...";
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        });
    }
});