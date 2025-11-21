function applyGlobalPreferences() {
    const isDark = localStorage.getItem('bibliotheca_darkmode') === 'true';
    if (isDark) document.documentElement.classList.add('dark-mode');
    else document.documentElement.classList.remove('dark-mode');

    const cursorPref = localStorage.getItem('bibliotheca_cursor');
    if (cursorPref === 'false') document.documentElement.classList.add('no-custom-cursor');
    else document.documentElement.classList.remove('no-custom-cursor');

    const savedAvatar = localStorage.getItem('bibliotheca_avatar');
    if (savedAvatar) {
        document.querySelectorAll('.avatar, .avatar-small').forEach(img => {
            if (img.closest('.profile-wrapper') || img.closest('.create-post-card')) {
                img.src = savedAvatar;
            }
        });
    }
}

const initialLists = [
    {
        id: 1,
        name: "Favoritos da Vida",
        count: 12,
        color: "var(--primary)",
        covers: [
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80",
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=200&q=80"
        ]
    },
    {
        id: 2,
        name: "Para Ler 2025",
        count: 5,
        color: "#ef4444",
        covers: [
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=200&q=80",
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&q=80"
        ]
    },
    {
        id: 3,
        name: "Clube do Livro",
        count: 3,
        color: "#3b82f6",
        covers: [
            "https://images.unsplash.com/photo-1629196914375-f7e48f477b6d?auto=format&fit=crop&w=200&q=80"
        ]
    }
];

let myLists = JSON.parse(localStorage.getItem('bibliotheca_lists')) || initialLists;

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalPreferences();
    renderLists();
    initUI();
    setupCreateForm();
});

function renderLists() {
    const container = document.getElementById('listsContainer');
    if (!container) return;

    container.innerHTML = '';

    const addCard = document.createElement('div');
    addCard.className = 'list-card add-new-card click-shrink spotlight-item';
    addCard.onclick = openCreateModal;
    addCard.innerHTML = `
        <i class="ph ph-plus-circle add-icon"></i>
        <h3>Criar Nova Coleção</h3>
        <p style="font-size:0.9rem">Organize seus livros por tema</p>
    `;
    container.appendChild(addCard);

    myLists.forEach(list => {
        const card = document.createElement('div');
        card.className = 'list-card spotlight-item';

        let coversHTML = '';
        const fallbackImg = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=200&q=60";

        if (list.covers && list.covers.length > 0) {
            list.covers.slice(0, 3).forEach(cover => {
                coversHTML += `<img src="${cover}" class="mini-cover" onerror="this.src='${fallbackImg}'">`;
            });
            if (list.covers.length < 3) {
                coversHTML += `<div class="mini-cover" style="background:rgba(0,0,0,0.05); border:1px dashed rgba(0,0,0,0.1)"></div>`;
            }
        } else {
            coversHTML = `<i class="ph ph-books empty-placeholder"></i>`;
            card.querySelector('.list-visual')?.classList.add('empty');
        }

        card.innerHTML = `
            <div class="list-visual ${list.covers.length === 0 ? 'empty' : ''}">
                ${coversHTML}
            </div>
            <div class="list-info">
                <h3 style="color: ${list.color || 'var(--secondary)'}">
                    ${list.name} <i class="ph ph-caret-right" style="font-size:1rem; opacity:0.5"></i>
                </h3>
                <div class="list-meta">
                    <span>${list.covers.length > 0 ? 'Atualizado recentemente' : 'Vazio'}</span>
                    <span class="book-count">${list.count} livros</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            alert(`Abrindo coleção: ${list.name}\n(Funcionalidade futura)`);
        });

        container.appendChild(card);
    });

    initSpotlightEffect();
}

const createModal = document.getElementById('createListModal');

window.openCreateModal = function () {
    createModal.classList.add('open');
};

window.closeCreateModal = function () {
    createModal.classList.remove('open');
    document.getElementById('createListForm').reset();
};

function setupCreateForm() {
    const form = document.getElementById('createListForm');
    if (!form) return;

    const colorDots = document.querySelectorAll('.color-dot');
    let selectedColor = 'var(--primary)';

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            selectedColor = dot.getAttribute('data-color');
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('listName').value;

        const newList = {
            id: Date.now(),
            name: name,
            count: 0,
            color: selectedColor,
            covers: []
        };

        myLists.push(newList);
        localStorage.setItem('bibliotheca_lists', JSON.stringify(myLists));

        renderLists();
        closeCreateModal();
        showToast(`Lista "${name}" criada!`);
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (msg) toast.querySelector('span').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function initUI() {
    initCursor();
    initSpotlightEffect();
    initMobileMenu();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-enter').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');
    if (!dot) return;
    window.addEventListener('mousemove', (e) => {
        dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`;
        outline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 400, fill: "forwards" });
    });
    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .click-shrink, .list-card')) document.body.classList.add('hovering');
        else document.body.classList.remove('hovering');
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
    function toggle() { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); }
    if (btn) btn.onclick = toggle; if (closeBtn) closeBtn.onclick = toggle; if (overlay) overlay.onclick = toggle;
}