document.addEventListener('DOMContentLoaded', () => {
    applyGlobalPreferences();
    initUI();
    initSettingsLogic();
});

function applyGlobalPreferences() {
    const isDark = localStorage.getItem('bibliotheca_darkmode') === 'true';
    document.documentElement.classList.toggle('dark-mode', isDark);

    const cursorPref = localStorage.getItem('bibliotheca_cursor');
    const isCursorEnabled = cursorPref !== 'false';
    document.documentElement.classList.toggle('no-custom-cursor', !isCursorEnabled);

    loadSavedAvatar();
}

function loadSavedAvatar() {
    const savedAvatar = localStorage.getItem('bibliotheca_avatar');
    if (savedAvatar) {
        document.querySelectorAll('.avatar, #settingsAvatar, #headerAvatar').forEach(img => {
            img.src = savedAvatar;
        });
    }
}

function initSettingsLogic() {
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.checked = document.documentElement.classList.contains('dark-mode');
        darkToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            localStorage.setItem('bibliotheca_darkmode', isEnabled);
            applyGlobalPreferences();
            showToast(isEnabled ? 'Modo Escuro Ativado 🌙' : 'Modo Claro Ativado ☀️');
        });
    }

    const cursorToggle = document.getElementById('customCursorToggle');
    if (cursorToggle) {
        cursorToggle.checked = !document.documentElement.classList.contains('no-custom-cursor');
        cursorToggle.addEventListener('change', (e) => {
            const isEnabled = e.target.checked;
            localStorage.setItem('bibliotheca_cursor', isEnabled);
            applyGlobalPreferences();
            showToast(isEnabled ? 'Cursor Ativado' : 'Cursor Padrão');
        });
    }

    const avatarInput = document.getElementById('avatarUpload');
    const avatarContainer = document.querySelector('.avatar-container');

    if (avatarContainer && avatarInput) {
        avatarContainer.addEventListener('click', () => avatarInput.click());

        avatarInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const newSrc = e.target.result;
                    localStorage.setItem('bibliotheca_avatar', newSrc);
                    loadSavedAvatar();
                    showToast('Foto de perfil atualizada! 📸');
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

window.clearCache = function () {
    if (confirm("Resetar todo o sistema?")) {
        localStorage.clear();
        location.reload();
    }
};

window.downloadData = function () {
    const data = { ...localStorage };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const el = document.createElement('a');
    el.setAttribute("href", dataStr);
    el.setAttribute("download", "bibliotheca_backup.json");
    document.body.appendChild(el);
    el.click();
    el.remove();
    showToast('Backup baixado!');
};

function showToast(msg) {
    const t = document.getElementById('toast');
    if (t) {
        t.querySelector('span').innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
}


function initUI() {
    initCursor();
    initSpotlightEffect();
    initMobileMenu();

    // ANIMAÇÕES NOVAS (CORRIGIDO)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("start-animation");
                observer.unobserve(entry.target);
            }
        });
    });

    document.querySelectorAll('.animate-enter').forEach(el => {
        observer.observe(el);
    });
}

function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');
    if (!dot || !outline) return;

    window.addEventListener('mousemove', (e) => {
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;

        outline.animate({
            left: `${e.clientX}px`,
            top: `${e.clientY}px`
        }, { duration: 400, fill: "forwards" });
    });

    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .click-shrink, .toggle-switch'))
            document.body.classList.add('hovering');
        else
            document.body.classList.remove('hovering');
    });
}

function initSpotlightEffect() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    document.addEventListener('mousemove', (e) => {
        const target = e.target.closest('.spotlight-item');
        if (target) {
            const rect = target.getBoundingClientRect();
            target.style.setProperty('--x', `${e.clientX - rect.left}px`);
            target.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.querySelector('.close-sidebar-btn');

    function toggle() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    if (btn) btn.onclick = toggle;
    if (closeBtn) closeBtn.onclick = toggle;
    if (overlay) overlay.onclick = toggle;
}
