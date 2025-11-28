/* ... (mantive o cabeçalho do arquivo igual) ... */

// -----------------------------
// Config
// -----------------------------
const API_BASE = 'http://localhost:3000';
const API_ENDPOINTS = {
  loans: API_BASE + '/emprestimos',
  users: API_BASE + '/usuarios',
  books: API_BASE + '/livros'
};

const BOOKS_KEY = 'bibliotheca_books_db';
const LOANS_KEY = 'bibliotheca_loans_db';
const USERS_KEY = 'bibliotheca_users_db';
const DEFAULT_BOOK_COUNT = 1248;

// Pools (mantive os seus links)
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

const fallbackCover = "https://placehold.co/60x80?text=Livro";
const fallbackAvatar = "https://placehold.co/60x60?text=User";

// State
let loansData = [];
let usersData = [];
let booksData = [];

// Utility functions
function timeoutPromise(ms, promise) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms);
        promise
            .then(res => { clearTimeout(timer); resolve(res); })
            .catch(err => { clearTimeout(timer); reject(err); });
    });
}

async function apiFetch(url, opts = {}) {
    try {
        const res = await timeoutPromise(6000, fetch(url, opts));
        if (!res.ok) throw new Error('Network response not ok ' + res.status);
        return await res.json();
    } catch (e) {
        console.warn('apiFetch failed for', url, e.message);
        throw e;
    }
}

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function resolveCover(title, index = 0) {
    if (title && coverPool[title]) return coverPool[title];
    const list = Object.keys(coverPool)
        .filter(key => key !== 'default')
        .map(key => coverPool[key]);
    return list[index % list.length] || coverPool.default;
}

const shuffledAvatars = shuffle([...avatarPool]);
function resolveAvatar(index = 0) {
    const pick = shuffledAvatars[index % shuffledAvatars.length];
    return pick || fallbackAvatar;
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

function saveStored(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Failed to save to localStorage', e.message);
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}


function parsePtBrShortDate(str) {
    if (!str || typeof str !== 'string') return null;
    // tenta ISO primeiro
    const iso = Date.parse(str);
    if (!isNaN(iso)) return iso;
    // tenta formato "12 Out" ou "05 novembro"
    const m = str.trim().toLowerCase().match(/(\\d{1,2})\\s*([a-zãõéêíóúç]+)/i);
    if (m) {
        const day = parseInt(m[1], 10);
        const monthToken = m[2].substring(0,3);
        const month = PT_BR_MONTHS[monthToken] ?? PT_BR_MONTHS[m[2]];
        if (typeof month === 'number') {
            const now = new Date();
            const year = now.getFullYear();
            return new Date(year, month, day).getTime();
        }
    }
    return null;
}

function extractTimestamp(loan) {
    // tenta várias propriedades
    const candList = [
        loan.date, loan.createdAt, loan.data_retirada, loan.retirada,
        loan.startDate, loan.__raw && (loan.__raw.date || loan.__raw.createdAt || loan.__raw.data_retirada)
    ].filter(Boolean);

    for (const cand of candList) {
        // 1) ISO parse
        const tryIso = Date.parse(cand);
        if (!isNaN(tryIso)) return tryIso;
        // 2) pt-br short
        const tryPt = parsePtBrShortDate(cand);
        if (tryPt) return tryPt;
    }
    return null;
}

// Normaliza nome do livro - tenta várias formas de leitura do objeto book/livro
function getBookTitleFromRaw(raw) {
    if (!raw) return '—';
    // se já é string
    if (typeof raw === 'string') return raw;
    // se for objeto com propriedades comuns
    if (typeof raw === 'object') {
        return raw.title || raw.name || raw.titulo || raw.nome || raw.label || null;
    }
    return null;
}

function getBookTitle(loanRaw) {
    // loanRaw pode ser string, objeto, ou ter bookId / livroId
    // prioriza propriedades já normalizadas
    if (loanRaw.book && typeof loanRaw.book === 'string') return loanRaw.book;
    // se loanRaw.book for objeto
    if (loanRaw.book && typeof loanRaw.book === 'object') {
        const t = getBookTitleFromRaw(loanRaw.book);
        if (t) return t;
        if (loanRaw.book.id || loanRaw.book._id) {
            const found = lookupBookTitle(loanRaw.book.id || loanRaw.book._id);
            if (found && found !== '—') return found;
        }
    }
    // propriedades em pt-br
    if (loanRaw.livro && typeof loanRaw.livro === 'string') return loanRaw.livro;
    if (loanRaw.livro && typeof loanRaw.livro === 'object') {
        const t = getBookTitleFromRaw(loanRaw.livro);
        if (t) return t;
        if (loanRaw.livro.id || loanRaw.livro._id) {
            const found = lookupBookTitle(loanRaw.livro.id || loanRaw.livro._id);
            if (found && found !== '—') return found;
        }
    }
    // ids
    if (loanRaw.bookId) {
        const found = lookupBookTitle(loanRaw.bookId);
        if (found && found !== '—') return found;
    }
    if (loanRaw.livroId) {
        const found = lookupBookTitle(loanRaw.livroId);
        if (found && found !== '—') return found;
    }
    // fallback para field `book` mesmo (pode ser undefined)
    return loanRaw.book || loanRaw.livro || '—';
}

// Normaliza nome do usuário (tenta objetos, ids, campos pt-br)
function getUserNameFromRaw(raw) {
    if (!raw) return '—';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
        return raw.name || raw.fullName || raw.nome || raw.username || raw.email || null;
    }
    return null;
}

function getUserName(loanRaw) {
    // prioriza user como string
    if (loanRaw.user && typeof loanRaw.user === 'string') return loanRaw.user;
    if (loanRaw.user && typeof loanRaw.user === 'object') {
        const u = getUserNameFromRaw(loanRaw.user);
        if (u) return u;
        if (loanRaw.user.id || loanRaw.user._id) {
            const found = lookupUserName(loanRaw.user.id || loanRaw.user._id);
            if (found && found !== '—') return found;
        }
    }
    if (loanRaw.usuario && typeof loanRaw.usuario === 'string') return loanRaw.usuario;
    if (loanRaw.usuario && typeof loanRaw.usuario === 'object') {
        const u = getUserNameFromRaw(loanRaw.usuario);
        if (u) return u;
        if (loanRaw.usuario.id || loanRaw.usuario._id) {
            const found = lookupUserName(loanRaw.usuario.id || loanRaw.usuario._id);
            if (found && found !== '—') return found;
        }
    }
    if (loanRaw.userId) {
        const found = lookupUserName(loanRaw.userId);
        if (found && found !== '—') return found;
    }
    if (loanRaw.usuarioId) {
        const found = lookupUserName(loanRaw.usuarioId);
        if (found && found !== '—') return found;
    }
    // fallback para qualquer campo que contenha texto
    return loanRaw.user || loanRaw.usuario || loanRaw.username || '—';
}

// -----------------------------
// Rendering helpers (mantidos / ajustados)
// -----------------------------
function renderSummaryCards() {
    const active = loansData.filter(item => item.status === 'active').length;
    const pending = loansData.filter(item => item.status !== 'active').length;
    const catalogCount = booksData.length || getCatalogCount();
    const usersCount = usersData.length || getStored(USERS_KEY, []).length;

    // Total de exemplares (Total de Livros) - tenta extrair de booksData
    let totalExemplares = 0;
    if (Array.isArray(booksData) && booksData.length > 0) {
        totalExemplares = booksData.reduce((acc, b) => {
            // procura por várias chaves comuns (PT/EN)
            const q = b.quantity ?? b.quantidade ?? b.exemplares ?? b.copies ?? b.count ?? b.stock ?? b.estoque ?? b.totalCopies ?? b.total;
            if (typeof q === 'number') return acc + q;
            // se o registro representar 1 exemplar (registro por exemplar), soma 1
            return acc + 1;
        }, 0);
    } else {
        totalExemplares = getCatalogCount(); // fallback conservador
    }

    setText('metricCatalog', catalogCount.toLocaleString('pt-BR')); // Acervo (títulos)
    setText('metricUsers', usersCount.toLocaleString('pt-BR')); // Usuários cadastrados
    setText('metricTotalLivros', typeof totalExemplares === 'number' ? totalExemplares.toLocaleString('pt-BR') : totalExemplares);
    setText('metricActiveLoans', active);
    setText('metricPending', pending);
}


function renderBars() {
    const container = document.getElementById('weeklyBars');
    if (!container) return;

    const days = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const weekly = days.map(day => ({ day, loans: 0, returns: 0 }));

    loansData.forEach((loan, idx) => {
        const ts = extractTimestamp(loan);
        if (ts) {
            const d = new Date(ts);
            const dow = d.getDay(); // 0..6 (dom..sab)
            const idxDay = (dow === 0) ? 6 : dow - 1;
            weekly[idxDay].loans += 1;
            // devolução: verifica fields comuns (raw e normalized)
            const raw = loan.__raw || {};
            const returned = !!(raw.returnedAt || raw.devolvido || raw.returned || raw.data_devolucao || loan.status === 'returned' || loan.status === 'done' || loan.status === 'completed');
            if (returned) weekly[idxDay].returns += 1;
        } else {
            const bucket = weekly[idx % weekly.length];
            bucket.loans += 1;
            if (loan.status !== 'active') bucket.returns += 1;
        }
    });

    const maxVal = Math.max(...weekly.map(d => Math.max(d.loans, d.returns))) || 1;
    container.innerHTML = '';

    weekly.forEach(item => {
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

function renderFeaturedLoans(limit = 4) {
    const container = document.getElementById('featuredLoans');
    if (!container) return;
    container.innerHTML = '';

    const withTs = loansData.map((l, i) => {
        const ts = extractTimestamp(l) || 0;
        return { loan: l, ts, idx: i };
    }).sort((a, b) => (b.ts || b.idx) - (a.ts || a.idx));

    const top = withTs.slice(0, limit).map(x => x.loan);

    top.forEach((l, idx) => {
        const statusLabels = {
            active: 'Em Dia',
            late: 'Atrasado',
            pending: 'Pendente',
            returned: 'Devolvido'
        };
        const row = document.createElement('div');
        row.className = 'featured-row';
        const cover = l.cover || resolveCover(getBookTitle(l), idx);
        const user = getUserName(l) || '—';
        const retirada = l.date || l.data_retirada || l.createdAt || (l.__raw && (l.__raw.date || l.__raw.createdAt)) || '—';
        const devolucao = l.deadline || l.data_devolucao || l.dueDate || (l.__raw && (l.__raw.deadline || l.__raw.dueDate)) || '—';
        const bookTitle = getBookTitle(l) || '—';
        row.innerHTML = `
            <div class="f-left">
                <img src="${cover}" alt="${bookTitle}" onerror="this.onerror=null;this.src='${fallbackCover}'">
            </div>
            <div class="f-body">
                <strong class="book-title">${bookTitle}</strong>
                <div class="meta">
                    <span class="user">${user}</span>
                    <span class="dots">•</span>
                    <span class="dates">Retirada: ${formatDateShort(retirada)} • Devolução: ${formatDateShort(devolucao)}</span>
                </div>
            </div>
            <div class="f-right">
                <span class="status-badge ${l.status}">${statusLabels[l.status] || l.status}</span>
            </div>
        `;
        container.appendChild(row);
    });
}


function formatDateShort(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
    return value;
}


function generateActivityFromLoans(limit = 6) {
    const feed = [];
    const enriched = loansData.map((l, i) => {
        const ts = extractTimestamp(l) || 0;
        return { l, ts, i };
    }).sort((a, b) => (b.ts || b.i) - (a.ts || a.i));

    for (let i = 0; i < Math.min(limit, enriched.length); i++) {
        const loan = enriched[i].l;
        const user = getUserName(loan);
        const book = getBookTitle(loan);
        const retirada = loan.date || loan.data_retirada || loan.createdAt || null;
        const devolucao = loan.deadline || loan.data_devolucao || loan.dueDate || null;
        const status = loan.status || 'pending';

        let title = '';
        let desc = '';
        let time = retirada ? formatDateShort(retirada) : 'Hoje';
        let type = 'info';

        if (status === 'late') {
            title = 'Devolução atrasada';
            desc = `${user} está com “${book}” além do prazo.`;
            type = 'warning';
            time = devolucao ? formatDateShort(devolucao) : time;
        } else if (status === 'pending') {
            title = 'Pedido de empréstimo';
            desc = `${user} solicitou “${book}”.`;
            type = 'info';
        } else if (status === 'active') {
            title = 'Empréstimo ativo';
            desc = `${user} retirou “${book}”.`;
            type = 'success';
        } else if (status === 'returned' || status === 'done' || status === 'completed') {
            title = 'Livro devolvido';
            desc = `${user} devolveu “${book}”.`;
            type = 'success';
            time = devolucao ? formatDateShort(devolucao) : time;
        } else {
            title = 'Atividade';
            desc = `${user} • ${book} • status: ${status}`;
            type = 'info';
        }

        feed.push({ title, desc, time, type });
    }

    return feed;
}


function formatUserName(raw) {
    if (!raw) return '—';
    if (typeof raw === 'object') {
        return raw.name || raw.fullName || raw.nome || '—';
    }
    const maybeId = (typeof raw === 'number' || !isNaN(Number(raw))) ? Number(raw) : null;
    if (maybeId !== null) {
        const u = usersData.find(x => x.id === maybeId || x._id === maybeId);
        if (u) return u.name || u.fullName || u.nome || '—';
    }
    if (typeof raw === 'string') {
        const byExact = usersData.find(x => (x.email && x.email === raw) || (x.name && x.name === raw));
        if (byExact) return byExact.name || byExact.fullName || raw;
        const lower = raw.toLowerCase();
        const byPartial = usersData.find(x => (x.name && x.name.toLowerCase().includes(lower)) ||
                                             (x.fullName && x.fullName.toLowerCase().includes(lower)));
        if (byPartial) return byPartial.name || byPartial.fullName || raw;
        return raw;
    }
    return '—';
}


function normalizeLoan(raw, index) {
 
    let bookTitle = '—';
  
    if (raw.book) {
        bookTitle = getBookTitleFromRaw(raw.book) || (typeof raw.book === 'string' ? raw.book : null);
    }
    if ((!bookTitle || bookTitle === '—') && raw.livro) {
        bookTitle = getBookTitleFromRaw(raw.livro) || (typeof raw.livro === 'string' ? raw.livro : null);
    }
    if ((!bookTitle || bookTitle === '—') && (raw.bookTitle || raw.titulo)) {
        bookTitle = raw.bookTitle || raw.titulo;
    }
    if ((!bookTitle || bookTitle === '—') && raw.bookId) {
        bookTitle = lookupBookTitle(raw.bookId);
    }
    if ((!bookTitle || bookTitle === '—') && raw.livroId) {
        bookTitle = lookupBookTitle(raw.livroId);
    }


    let userName = '—';
    if (raw.user) userName = getUserNameFromRaw(raw.user) || null;
    if ((!userName || userName === '—') && raw.usuario) userName = getUserNameFromRaw(raw.usuario) || null;
    if ((!userName || userName === '—') && raw.userName) userName = raw.userName;
    if ((!userName || userName === '—') && raw.userId) userName = lookupUserName(raw.userId);
    if ((!userName || userName === '—') && raw.usuarioId) userName = lookupUserName(raw.usuarioId);


    if ((!bookTitle || bookTitle === '—') && typeof raw.book === 'string') bookTitle = raw.book;
    if ((!userName || userName === '—') && typeof raw.user === 'string') userName = raw.user;

    return {
        id: raw.id || raw._id || index,
        book: bookTitle || '—',
        user: userName || '—',
        date: raw.date || raw.createdAt || raw.data_retirada || '',
        deadline: raw.deadline || raw.dueDate || raw.data_devolucao || '',
        status: (raw.status || 'pending').toLowerCase(),
        cover: resolveCover(bookTitle, index),
        avatar: resolveAvatar(index),
        __raw: raw
    };
}

function lookupBookTitle(bookId) {
    const b = (booksData || []).find(x => x.id == bookId || x._id == bookId);
    if (!b) return '—';
    return b.title || b.name || b.titulo || b.nome || '—';
}

function lookupUserName(userId) {
    const u = (usersData || []).find(x => x.id == userId || x._id == userId);
    if (!u) return '—';
    return u.name || u.fullName || u.nome || u.email || '—';
}

async function loadAllData({ useCache = true } = {}) {
    const storedBooks = getStored(BOOKS_KEY, []);
    const storedUsers = getStored(USERS_KEY, []);
    const storedLoans = getStored(LOANS_KEY, []);

    try {
        const [booksRes, usersRes] = await Promise.all([
            apiFetch(API_ENDPOINTS.books).catch(() => null),
            apiFetch(API_ENDPOINTS.users).catch(() => null)
        ]);

        booksData = Array.isArray(booksRes) ? booksRes : (storedBooks || []);
        usersData = Array.isArray(usersRes) ? usersRes : (storedUsers || []);

        if (Array.isArray(booksData)) saveStored(BOOKS_KEY, booksData);
        if (Array.isArray(usersData)) saveStored(USERS_KEY, usersData);

    } catch (e) {
        console.warn('books/users fetch failed, falling back to stored data', e.message);
        booksData = storedBooks;
        usersData = storedUsers;
    }

    try {
        const loansRes = await apiFetch(API_ENDPOINTS.loans).catch(() => null);
        const rawLoans = Array.isArray(loansRes) ? loansRes : (storedLoans || []);

        loansData = rawLoans.map((l, i) => normalizeLoan(l, i));
        saveStored(LOANS_KEY, loansData);

    } catch (e) {
        console.warn('loans fetch failed, falling back to stored data', e.message);
        loansData = storedLoans.map((l, i) => normalizeLoan(l, i));
    }

    loansData = loansData.map((loan, idx) => ({
        ...loan,
        cover: loan.cover || resolveCover(loan.book, idx),
        avatar: loan.avatar || resolveAvatar(idx)
    }));

    renderAll();
}

function renderAll() {
    updateDate();
    renderSummaryCards();
    renderBars();
    renderHighlights(generateActivityFromLoans());
    renderFeaturedLoans();
    renderTable();
    animateCharts();
}

function updateDate() {
    const date = new Date();
    const options = { day: 'numeric', month: 'long' };
    const el = document.getElementById('currentDate');
    if (el) el.innerText = date.toLocaleDateString('pt-BR', options);
}

function updateActivityList(history) {
  const ul = document.getElementById("activityList");
  ul.innerHTML = "";

  if (!history || history.length === 0) {
    ul.innerHTML = `<li class="empty">Nenhuma atividade registrada</li>`;
    return;
  }

  history.slice(0, 8).forEach(item => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="mini-icon ${item.acao}">
        <i class="ph ph-lightning"></i>
      </div>

      <div class="mini-info">
        <strong>${item.usuario || "Usuário não encontrado"}</strong>
        <p>${item.acao} • ${item.livro || "Livro não encontrado"}</p>
        <small>${formatDateBr(item.data_retirada)}</small>
      </div>
    `;

    ul.appendChild(li);
  });
}

function renderLoansTable(loans, users, books) {
  const tbody = document.getElementById("loansTableBody");
  tbody.innerHTML = "";

  loans.forEach(l => {
    const user = users.find(u => u.id === l.usuarioId);
    const book = books.find(b => b.id === l.livroId);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${book ? book.titulo : "-"}</td>
      <td>${user ? user.nome : "-"}</td>
      <td>${l.data_retirada ? formatDateBr(l.data_retirada) : "-"}</td>
      <td>${l.data_devolucao ? formatDateBr(l.data_devolucao) : "-"}</td>
      <td><span class="status-badge ${l.status}">${getStatusLabel(l.status)}</span></td>
      <td class="right"><button class="action-btn subtle"><i class="ph ph-arrow-right"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
}

const loanHistoryKey = "loanHistory";
let loanHistory = [];

// Carrega histórico
function loadLoanHistory() {
  const stored = localStorage.getItem(loanHistoryKey);
  loanHistory = stored ? JSON.parse(stored) : [];
  renderActivityList();
}

async function renderActivityList() {
  const list = document.getElementById("activityList");
  list.innerHTML = "";

  // Limita pra 3
  const items = loanHistory.slice(0, 3);

  if (!items.length) {
    list.innerHTML = "<li class='empty'>Nenhuma atividade registrada.</li>";
    return;
  }

  const users = await fetch("http://localhost:3000/usuarios").then(r => r.json());
  const books = await fetch("http://localhost:3000/livros").then(r => r.json());

  items.forEach(item => {
    const user = users.find(u => u.id === item.usuario_id);
    const book = books.find(b => b.id === item.livro_id);

    const usuarioNome = user ? user.nome : item.usuario || "—";
    const livroNome = book ? book.titulo : item.livro || "—";

    const data = item.data_retirada ? new Date(item.data_retirada) : new Date();
    const dataBR = data.toLocaleDateString("pt-BR");

    const statusTraduzido = {
      created: "Criado",
      updated: "Atualizado",
      deleted: "Deletado",
      active: "Ativo"
    }[item.acao] || item.acao;

    const li = document.createElement("li");
    li.classList.add("mini-item");

    li.innerHTML = `
      <div class="mini-icon"><i class="ph ph-lightning"></i></div>
      <div class="mini-info">
        <strong>${usuarioNome} — ${livroNome}</strong>
        <span>${statusTraduzido} • ${dataBR}</span>
        ${item.detalhes ? `<p class="details">${item.detalhes}</p>` : ""}
      </div>
    `;

    list.appendChild(li);
  });
}

loadLoanHistory();



function renderWeeklyBars(loans) {
  const container = document.getElementById("weeklyBars");
  container.innerHTML = "";

  const week = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const counts = week.map(() => ({
    emprestimos: 0,
    devolucoes: 0
  }));

  loans.forEach(l => {
    // Pega dia da semana (0 = Domingo)
    const d = new Date(l.data_retirada).getDay();
    const index = d === 0 ? 6 : d - 1;

    counts[index].emprestimos++;

    if (l.data_devolucao) {
      const dd = new Date(l.data_devolucao).getDay();
      const index2 = dd === 0 ? 6 : dd - 1;
      counts[index2].devolucoes++;
    }
  });

  counts.forEach((c, i) => {
    container.innerHTML += `
      <div class="bar-group">
        <div class="bar primary" style="height: ${c.emprestimos * 12}px"></div>
        <div class="bar neutral"  style="height: ${c.devolucoes * 12}px"></div>
        <span>${week[i]}</span>
      </div>
    `;
  });
}


window.DashboardAPI = {
    reload: () => loadAllData({ useCache: false }),
    getState: () => ({ loansData, usersData, booksData })
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    loansData = getStored(LOANS_KEY, []).map((l, i) => normalizeLoan(l, i));
    usersData = getStored(USERS_KEY, []);
    booksData = getStored(BOOKS_KEY, []);

    renderAll();

    loadAllData().catch(err => console.warn('Initial loadAllData failed', err.message));

    setInterval(() => loadAllData().catch(() => {}), 120000);
});


function normalizeUserObject(u) {
  if (!u) return null;
  return {
    id: u.id ?? u._id ?? u.userId ?? u.usuarioId ?? u.usuario_id ?? u.user_id ?? null,
    name: u.name ?? u.fullName ?? u.nome ?? u.usuario ?? u.username ?? u.email ?? null,
    email: u.email ?? null
  };
}

function normalizeBookObject(b) {
  if (!b) return null;
  return {
    id: b.id ?? b._id ?? b.bookId ?? b.livroId ?? b.livro_id ?? b.book_id ?? null,
    title: b.title ?? b.name ?? b.titulo ?? b.nome ?? b.label ?? null
  };
}

function findUserByCandidate(users, candidate) {
  if (!users || !candidate) return null;


  if (typeof candidate === 'object') {
    const nid = candidate.id ?? candidate._id ?? candidate.userId ?? candidate.usuarioId ?? candidate.usuario_id;
    if (nid != null) {
      const u = users.find(x => String(x.id) === String(nid) || String(x._id) === String(nid));
      if (u) return normalizeUserObject(u);
    }
    const name = candidate.name ?? candidate.nome ?? candidate.usuario ?? candidate.email;
    if (name) {
      const u = users.find(x => (x.name && x.name === name) || (x.nome && x.nome === name) || (x.email && x.email === name));
      if (u) return normalizeUserObject(u);
    }
  }


  if (!isNaN(Number(candidate))) {
    const u = users.find(x => String(x.id) === String(candidate) || String(x._id) === String(candidate));
    if (u) return normalizeUserObject(u);
  }


  if (typeof candidate === 'string') {
    const byExact = users.find(x => (x.name && x.name === candidate) || (x.nome && x.nome === candidate) || (x.email && x.email === candidate));
    if (byExact) return normalizeUserObject(byExact);

    const lower = candidate.toLowerCase();
    const byPartial = users.find(x =>
      (x.name && x.name.toLowerCase().includes(lower)) ||
      (x.nome && x.nome.toLowerCase().includes(lower)) ||
      (x.email && x.email.toLowerCase().includes(lower))
    );
    if (byPartial) return normalizeUserObject(byPartial);
  }

  return null;
}

function findBookByCandidate(books, candidate) {
  if (!books || !candidate) return null;

  if (typeof candidate === 'object') {
    const nid = candidate.id ?? candidate._id ?? candidate.bookId ?? candidate.livroId ?? candidate.livro_id ?? candidate.book_id;
    if (nid != null) {
      const b = books.find(x => String(x.id) === String(nid) || String(x._id) === String(nid));
      if (b) return normalizeBookObject(b);
    }
    const title = candidate.title ?? candidate.titulo ?? candidate.name ?? candidate.nome;
    if (title) {
      const b = books.find(x => (x.title && x.title === title) || (x.titulo && x.titulo === title) || (x.name && x.name === title));
      if (b) return normalizeBookObject(b);
    }
  }

  if (!isNaN(Number(candidate))) {
    const b = books.find(x => String(x.id) === String(candidate) || String(x._id) === String(candidate));
    if (b) return normalizeBookObject(b);
  }

  if (typeof candidate === 'string') {
    const byExact = books.find(x => (x.title && x.title === candidate) || (x.titulo && x.titulo === candidate) || (x.name && x.name === candidate));
    if (byExact) return normalizeBookObject(byExact);

    const lower = candidate.toLowerCase();
    const byPartial = books.find(x =>
      (x.title && x.title.toLowerCase().includes(lower)) ||
      (x.titulo && x.titulo.toLowerCase().includes(lower)) ||
      (x.name && x.name.toLowerCase().includes(lower))
    );
    if (byPartial) return normalizeBookObject(byPartial);
  }

  return null;
}

function mapStatusToPt(status) {
  if (!status) return '—';
  const s = String(status).toLowerCase();
  return {
    created: 'Criado',
    updated: 'Atualizado',
    deleted: 'Removido',
    active: 'Ativo',
    pending: 'Pendente',
    returned: 'Devolvido',
    returned_at: 'Devolvido',
    late: 'Atrasado',
    canceled: 'Cancelado',
    done: 'Concluído'
  }[s] || (s.charAt(0).toUpperCase() + s.slice(1));
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadHighlightedLoans() {
  try {
    const [loansResp, usersResp, booksResp] = await Promise.all([
      fetch('http://localhost:3000/emprestimos'),
      fetch('http://localhost:3000/usuarios'),
      fetch('http://localhost:3000/livros')
    ]);

    if (!loansResp.ok || !usersResp.ok || !booksResp.ok) {
      throw new Error('Um dos endpoints retornou erro');
    }

    const [loans, users, books] = await Promise.all([
      loansResp.json(),
      usersResp.json(),
      booksResp.json()
    ]);

    const TBody = document.getElementById('loansTableBody');
    if (!TBody) return;
    TBody.innerHTML = '';

    if (!Array.isArray(loans) || loans.length === 0) {
      TBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum empréstimo encontrado.</td></tr>`;
      return;
    }


    const usersArr = Array.isArray(users) ? users : [];
    const booksArr = Array.isArray(books) ? books : [];


    const loansSorted = [...loans].sort((a, b) => {
      const aDate = Date.parse(a.data_retirada || a.date || a.createdAt || '') || 0;
      const bDate = Date.parse(b.data_retirada || b.date || b.createdAt || '') || 0;
      return bDate - aDate;
    });


    const top = loansSorted.slice(0, 6);

    top.forEach(l => {

      const userCandidate = l.user ?? l.usuario ?? l.usuario_id ?? l.user_id ?? l.userId ?? l.usuarioId ?? l.userId;
      const bookCandidate = l.book ?? l.livro ?? l.livro_id ?? l.book_id ?? l.bookId ?? l.livroId;

      const foundUser = findUserByCandidate(usersArr, userCandidate) ||
                        findUserByCandidate(usersArr, l.usuario_id ?? l.userId ?? l.user_id) ||
                        findUserByCandidate(usersArr, l.user) ||
                        null;

      const foundBook = findBookByCandidate(booksArr, bookCandidate) ||
                        findBookByCandidate(booksArr, l.livro_id ?? l.bookId ?? l.book_id) ||
                        findBookByCandidate(booksArr, l.book) ||
                        null;

      const userName = foundUser?.name || (typeof l.user === 'string' ? l.user : (l.usuario || l.userName)) || '—';
      const bookTitle = foundBook?.title || (typeof l.book === 'string' ? l.book : (l.livro || l.bookTitle || l.titulo)) || '—';

      const retirada = l.data_retirada || l.date || l.createdAt || l.retirada || null;
      const devolucao = l.data_devolucao || l.deadline || l.dueDate || l.devolucao || null;

      const retiradaFmt = retirada ? new Date(retirada).toLocaleDateString('pt-BR') : '–';
      const devolucaoFmt = devolucao ? new Date(devolucao).toLocaleDateString('pt-BR') : '–';

      const statusLabel = mapStatusToPt(l.status ?? l.acao ?? l.state);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(bookTitle)}</td>
        <td>${escapeHtml(userName)}</td>
        <td>${escapeHtml(retiradaFmt)}</td>
        <td style="color:var(--text-muted)">${escapeHtml(devolucaoFmt)}</td>
        <td><span class="status-badge ${escapeHtml(String(l.status ?? '').toLowerCase())}">${escapeHtml(statusLabel)}</span></td>
      `;
      TBody.appendChild(tr);
    });

  } catch (err) {
    console.error('Erro ao carregar empréstimos em destaque:', err);
    
    try {
      if (Array.isArray(loansData) && loansData.length) {
        
        renderTable();
      }
    } catch (e) { /* silent */ }
  }
}

loadHighlightedLoans();
