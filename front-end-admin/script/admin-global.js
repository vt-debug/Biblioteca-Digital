const PREF_KEYS = {
    DARK: 'admin_darkmode',
    CURSOR: 'admin_cursor',
    AVATAR: 'admin_avatar'
};

let cursorDot, cursorOutline;
let isTouchDevice = false;

document.addEventListener('DOMContentLoaded', () => {
    isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    applyGlobalTheme();
    applyGlobalAvatar();

    if (!isTouchDevice) {
        initCustomCursor();
    }
});

window.addEventListener('storage', (e) => {
    if (e.key === PREF_KEYS.DARK || e.key === PREF_KEYS.CURSOR) applyGlobalTheme();
    if (e.key === PREF_KEYS.AVATAR) applyGlobalAvatar();
});

window.applyAdminPreferences = applyGlobalTheme;
window.applyAdminAvatar = applyGlobalAvatar;


function applyGlobalTheme() {
    const isDark = localStorage.getItem(PREF_KEYS.DARK) === 'true';
    const cursorEnabled = localStorage.getItem(PREF_KEYS.CURSOR) !== 'false';

    document.documentElement.classList.toggle('dark-mode', isDark);

    document.documentElement.classList.toggle('no-custom-cursor', !cursorEnabled || isTouchDevice);
}

function applyGlobalAvatar() {
    const savedSrc = localStorage.getItem(PREF_KEYS.AVATAR);
    if (!savedSrc) return;

    const images = document.querySelectorAll('.admin-profile img, [data-admin-avatar]');
    images.forEach(img => img.src = savedSrc);
}


function initCustomCursor() {
    if (document.querySelector('.cursor-dot')) return;

    cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    cursorOutline = document.createElement('div');
    cursorOutline.className = 'cursor-outline';

    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorOutline);

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;

        // Cursor dot segue imediatamente
        cursorDot.style.left = `${targetX}px`;
        cursorDot.style.top = `${targetY}px`;
        cursorDot.style.opacity = 1;
    });

    // Cursor outline segue com suavidade (efeito de perseguição)
    function animateOutline() {
        // Interpolação suave com atraso maior (0.08 = mais lento, mais atraso)
        // Quanto menor o valor, mais lento e mais atraso
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        cursorOutline.style.left = `${currentX}px`;
        cursorOutline.style.top = `${currentY}px`;
        cursorOutline.style.opacity = 1;

        requestAnimationFrame(animateOutline);
    }
    animateOutline();

    const interactives = `a, button, input, textarea, select, label, .clickable, .menu-link, .action-btn, .switch, .pref-pill, .settings-card, .btn-action, .health-card, .close-modal-light`;

    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactives)) {
            document.body.classList.add('hovering');
        } else {
            document.body.classList.remove('hovering');
        }
    });

    document.addEventListener('mousedown', () => document.body.classList.add('cursor-clicked'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-clicked'));

    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = 0;
        cursorOutline.style.opacity = 0;
    });

    document.addEventListener('mouseenter', () => {
        if (!document.documentElement.classList.contains('no-custom-cursor')) {
            cursorDot.style.opacity = 1;
            cursorOutline.style.opacity = 1;
        }
    });
}