const coverPool = {
    "Duna": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=360&q=80",
    "1984": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=360&q=80",
    "O Hobbit": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=360&q=80",
    "Sapiens": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=360&q=80",
    "Verity": "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=360&q=80",
    "default": "https://images.unsplash.com/photo-1455884981818-54cb785db6fc?auto=format&fit=crop&w=360&q=80"
};

const avatarPool = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1524504388940-9f8a5c0b0bff?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1524504388940-1e1899c0f5b7?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
];

const defaultLoans = [
    { id: 1, book: "Duna", user: "Ana Clara", date: "12 Out", deadline: "19 Out", status: "active" },
    { id: 2, book: "1984", user: "Lucas P.", date: "05 Out", deadline: "12 Out", status: "late" },
    { id: 3, book: "O Hobbit", user: "Sofia M.", date: "14 Out", deadline: "21 Out", status: "pending" },
    { id: 4, book: "Sapiens", user: "Pedro H.", date: "10 Out", deadline: "17 Out", status: "active" },
    { id: 5, book: "Verity", user: "Mariana", date: "20 Out", deadline: "27 Out", status: "active" }
];

const weeklyFlow = [
    { day: "Seg", loans: 12, returns: 9 },
    { day: "Ter", loans: 16, returns: 11 },
    { day: "Qua", loans: 10, returns: 12 },
    { day: "Qui", loans: 18, returns: 15 },
    { day: "Sex", loans: 13, returns: 10 },
    { day: "Sáb", loans: 7, returns: 5 },
    { day: "Dom", loans: 5, returns: 4 }
];

const activityFeed = [
    { title: "Renovação solicitada", desc: "Ana Clara pediu +3 dias para “Duna”.", time: "09:20", type: "info" },
    { title: "Devolução atrasada", desc: "Lucas P. está com “1984” há 3 dias.", time: "08:15", type: "warning" },
    { title: "Novo cadastro", desc: "Sofia M. completou registro e-verificação.", time: "Ontem", type: "success" }
];

const defaultUsers = [
    { id: 1, name: "Ana Clara", email: "ana@example.com", role: "Leitor", status: "active" },
    { id: 2, name: "Lucas Prado", email: "lucas@example.com", role: "Editor", status: "pending" },
    { id: 3, name: "Sofia Martins", email: "sofia@example.com", role: "Leitor", status: "active" },
    { id: 4, name: "Carlos Almeida", email: "carlos@example.com", role: "Admin", status: "active" },
    { id: 5, name: "Fernanda Lopes", email: "fernanda@example.com", role: "Leitor", status: "suspended" }
];

const BOOKS_KEY = 'bibliotheca_books_db';
const LOANS_KEY = 'bibliotheca_loans_db';
const USERS_KEY = 'bibliotheca_users_db';
const DEFAULT_BOOK_COUNT = 1248;

const fallbackCover = "https://placehold.co/60x80?text=Livro";
const fallbackAvatar = "https://placehold.co/60x60?text=User";

const shuffledAvatars = shuffle([...avatarPool]);

let loansData = getStored(LOANS_KEY, defaultLoans.map(item => ({ ...item })));
const usingStoredLoans = !!localStorage.getItem(LOANS_KEY);

if (!usingStoredLoans) {
    loansData = loansData.map((loan, index) => ({
        ...loan,
        cover: resolveCover(loan.book, index),
        avatar: resolveAvatar(index)
    }));
}

let usersData = getStored(USERS_KEY, defaultUsers);

function resolveCover(title, index = 0) {
    if (title && coverPool[title]) return coverPool[title];
    const list = Object.keys(coverPool)
        .filter(key => key !== 'default')
        .map(key => coverPool[key]);
    return list[index % list.length] || coverPool.default;
}

function resolveAvatar(index = 0) {
    const pick = shuffledAvatars[index % shuffledAvatars.length];
    return pick || fallbackAvatar;
}

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function getStored(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
}

function getCatalogCount() {
    try {
        const raw = localStorage.getItem(BOOKS_KEY);
        if (!raw) return DEFAULT_BOOK_COUNT;
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return DEFAULT_BOOK_COUNT;
        return list.length || DEFAULT_BOOK_COUNT;
    } catch (e) {
        return DEFAULT_BOOK_COUNT;
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    renderSummaryCards();
    renderBars();
    renderHighlights();
    renderTable();
    animateCharts();
});

function updateDate() {
    const date = new Date();
    const options = { day: 'numeric', month: 'long' };
    const el = document.getElementById('currentDate');
    if (el) el.innerText = date.toLocaleDateString('pt-BR', options);
}

function renderSummaryCards() {
    const active = loansData.filter(item => item.status === 'active').length;
    const pending = loansData.filter(item => item.status !== 'active').length;
    const catalogCount = getCatalogCount();
    const usersCount = usersData.length || defaultUsers.length;
    const online = Math.max(1, Math.round(usersCount * 0.08));

    setText('metricCatalog', catalogCount.toLocaleString('pt-BR'));
    setText('metricUsers', usersCount.toLocaleString('pt-BR'));
    setText('metricOnline', online.toString());
    setText('metricActiveLoans', active);
    setText('metricPending', pending);
}

function renderBars() {
    const container = document.getElementById('weeklyBars');
    if (!container) return;

    const maxVal = Math.max(...weeklyFlow.map(d => Math.max(d.loans, d.returns)));
    container.innerHTML = '';

    weeklyFlow.forEach(item => {
        const loansHeight = Math.round((item.loans / maxVal) * 100);
        const returnsHeight = Math.round((item.returns / maxVal) * 100);

        const col = document.createElement('div');
        col.className = 'bar-col';
        col.innerHTML = `
            <div class="bar-group">
                <span class="bar loans" style="height:${loansHeight}%;" aria-label="Empréstimos ${item.day}"></span>
                <span class="bar returns" style="height:${returnsHeight}%;" aria-label="Devoluções ${item.day}"></span>
            </div>
            <span class="bar-label">${item.day}</span>
        `;
        container.appendChild(col);
    });
}

function renderHighlights() {
    const list = document.getElementById('activityList');
    if (!list) return;
    list.innerHTML = '';

    activityFeed.forEach(item => {
        const li = document.createElement('li');
        li.className = 'mini-item';
        li.innerHTML = `
            <div class="dot ${item.type}"></div>
            <div>
                <strong>${item.title}</strong>
                <p>${item.desc}</p>
            </div>
            <span class="time">${item.time}</span>
        `;
        list.appendChild(li);
    });

    const goal = 72;
    const goalBar = document.getElementById('goalBar');
    const goalValue = document.getElementById('goalValue');
    if (goalBar) goalBar.style.width = `${goal}%`;
    if (goalValue) goalValue.textContent = `${goal}%`;
}

function renderTable() {
    const tbody = document.getElementById('loansTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    loansData.forEach((item, index) => {
        const statusLabels = {
            active: 'Em Dia',
            late: 'Atrasado',
            pending: 'Pendente'
        };

        const cover = item.cover || resolveCover(item.book, index);
        const avatar = item.avatar || resolveAvatar(index);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="book-info">
                    <img src="${cover}" alt="${item.book}"
                         onerror="this.onerror=null;this.src='${fallbackCover}'">
                    <span>${item.book}</span>
                </div>
            </td>
            <td>
                <div class="user-info">
                    <img src="${avatar}" alt="${item.user}"
                         onerror="this.onerror=null;this.src='${fallbackAvatar}'">
                    <span>${item.user}</span>
                </div>
            </td>
            <td>${item.date}</td>
            <td style="color:var(--text-muted)">${item.deadline}</td>
            <td>
                <span class="status-badge ${item.status}">
                    ${statusLabels[item.status] || item.status}
                </span>
            </td>
            <td style="text-align:right;">
                <button class="btn-text" title="Ações rápidas">
                    <i class="ph-bold ph-dots-three"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function animateCharts() {
    setTimeout(() => {
        document.querySelectorAll('.bar').forEach(bar => {
            const target = bar.style.height;
            bar.style.height = '0px';
            requestAnimationFrame(() => {
                bar.style.height = target;
            });
        });
    }, 130);
}
