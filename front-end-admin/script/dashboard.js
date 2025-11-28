// ============================================================
// Dashboard.js - Refatorado e Otimizado
// ============================================================

// -----------------------------
// Configuração da API
// -----------------------------
const API_BASE = 'http://localhost:3000';
const API_ENDPOINTS = {
  loans: `${API_BASE}/emprestimos`,
  users: `${API_BASE}/usuarios`,
  books: `${API_BASE}/livros`
};

// Chaves do localStorage
const BOOKS_KEY = 'bibliotheca_books_db';
const LOANS_KEY = 'bibliotheca_loans_db';
const USERS_KEY = 'bibliotheca_users_db';

// State global
let loansData = [];
let usersData = [];
let booksData = [];
let weeklyChart = null;

// Histórico de empréstimos (para atividades recentes)
const loanHistoryKey = "loanHistory";
let loanHistory = [];

// -----------------------------
// Utility Functions
// -----------------------------
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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
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

// -----------------------------
// Data Loading
// -----------------------------
async function loadAllData() {
  try {
    // Fetch de todos os dados das APIs
    const [booksRes, usersRes, loansRes] = await Promise.all([
      apiFetch(API_ENDPOINTS.books).catch(() => null),
      apiFetch(API_ENDPOINTS.users).catch(() => null),
      apiFetch(API_ENDPOINTS.loans).catch(() => null)
    ]);

    // Atualiza os dados globais
    booksData = Array.isArray(booksRes) ? booksRes : getStored(BOOKS_KEY, []);
    usersData = Array.isArray(usersRes) ? usersRes : getStored(USERS_KEY, []);
    loansData = Array.isArray(loansRes) ? loansRes : getStored(LOANS_KEY, []);

    // Salva no localStorage para cache
    if (Array.isArray(booksData)) saveStored(BOOKS_KEY, booksData);
    if (Array.isArray(usersData)) saveStored(USERS_KEY, usersData);
    if (Array.isArray(loansData)) saveStored(LOANS_KEY, loansData);

    console.log('✅ Dados carregados:', {
      livros: booksData.length,
      usuarios: usersData.length,
      emprestimos: loansData.length
    });

    // Renderiza tudo
    renderAll();
  } catch (e) {
    console.warn('Erro ao carregar dados, usando cache', e.message);
    // Usa dados do cache
    booksData = getStored(BOOKS_KEY, []);
    usersData = getStored(USERS_KEY, []);
    loansData = getStored(LOANS_KEY, []);
    renderAll();
  }
}

// -----------------------------
// KPIs - Métricas do Dashboard
// -----------------------------
function renderSummaryCards() {
  // 1. Livros no acervo (total de títulos/registros cadastrados)
  const catalogCount = booksData.length;

  // 2. Usuários cadastrados (todos, ativos ou não)
  const usersCount = usersData.length;

  // 3. Total de Livros em estoque (soma das quantidades/exemplares)
  let totalExemplares = 0;
  if (Array.isArray(booksData) && booksData.length > 0) {
    totalExemplares = booksData.reduce((acc, book) => {
      // Tenta várias propriedades comuns para quantidade
      const qty = book.quantidade ?? 
                  book.quantity ?? 
                  book.exemplares ?? 
                  book.estoque ?? 
                  book.stock ?? 
                  book.total ?? 
                  book.copies ?? 
                  1; // Se não tiver quantidade, assume 1
      return acc + (typeof qty === 'number' ? qty : 1);
    }, 0);
  }

  // 4. Empréstimos ativos (status = 'active' ou similar)
  const activeLoans = loansData.filter(loan => {
    const status = (loan.status || '').toLowerCase();
    return status === 'active' || status === 'ativo' || status === 'em andamento';
  }).length;

  // 5. Empréstimos pendentes (outros status que não sejam ativos)
  const pendingLoans = loansData.filter(loan => {
    const status = (loan.status || '').toLowerCase();
    return status === 'pending' || status === 'pendente';
  }).length;

  // Atualiza os elementos HTML
  setText('metricCatalog', catalogCount.toLocaleString('pt-BR'));
  setText('metricUsers', usersCount.toLocaleString('pt-BR'));
  setText('metricTotalLivros', totalExemplares.toLocaleString('pt-BR'));
  setText('metricActiveLoans', activeLoans.toLocaleString('pt-BR'));
  setText('metricPending', pendingLoans.toLocaleString('pt-BR'));
}

// -----------------------------
// Chart - Gráfico de Fluxo Semanal (ApexCharts)
// -----------------------------
async function loadWeeklyLoanChart() {
  // Remove gráfico anterior se existir
  if (weeklyChart) {
    weeklyChart.destroy();
    weeklyChart = null;
  }

  // Limpa o container
  const container = document.querySelector("#weeklyBars");
  if (!container) return;
  container.innerHTML = "";

  if (!Array.isArray(loansData) || loansData.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted);">Nenhum empréstimo encontrado</p>';
    return;
  }

  // Função para extrair data de retirada
  const getLoanDate = (loan) => 
    loan.data_retirada || 
    loan.date || 
    loan.createdAt || 
    loan.retirada || 
    null;

  // Contadores por dia da semana (Seg → Dom)
  const weeklyCount = {
    Seg: 0,
    Ter: 0,
    Qua: 0,
    Qui: 0,
    Sex: 0,
    Sáb: 0,
    Dom: 0
  };

  loansData.forEach((loan) => {
    const dateStr = getLoanDate(loan);
    if (!dateStr) return;

    const date = new Date(dateStr);
    if (isNaN(date)) return;

    // Mapa de dia da semana (0 = Domingo, 1 = Segunda, etc.)
    const dayMap = {
      0: "Dom",
      1: "Seg",
      2: "Ter",
      3: "Qua",
      4: "Qui",
      5: "Sex",
      6: "Sáb"
    };

    const dayName = dayMap[date.getDay()];
    if (weeklyCount[dayName] !== undefined) {
      weeklyCount[dayName]++;
    }
  });

  // Dados na ordem correta (Seg → Dom)
  const data = [
    weeklyCount.Seg,
    weeklyCount.Ter,
    weeklyCount.Qua,
    weeklyCount.Qui,
    weeklyCount.Sex,
    weeklyCount.Sáb,
    weeklyCount.Dom
  ];

  // Configuração do ApexCharts com estilização premium
  const options = {
    series: [{ 
      name: "Empréstimos", 
      data 
    }],
    chart: {
      type: "bar",
      height: 280,
      toolbar: { show: false },
      fontFamily: 'Outfit, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        borderRadiusApplication: 'end',
        columnWidth: "55%",
        distributed: false,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ["#667eea"],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ['#764ba2'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.9,
        stops: [0, 100]
      }
    },
    dataLabels: { 
      enabled: true,
      formatter: function(val) {
        return val > 0 ? val : '';
      },
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: ["#667eea"],
        fontWeight: 600
      }
    },
    xaxis: {
      categories: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '13px',
          fontWeight: 500
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '12px'
        },
        formatter: function(val) {
          return Math.floor(val);
        }
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 3,
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      },
      xaxis: {
        lines: { show: false }
      },
      yaxis: {
        lines: { show: true }
      }
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '13px',
        fontFamily: 'Outfit, sans-serif'
      },
      y: {
        formatter: function(val) {
          return val + (val === 1 ? " empréstimo" : " empréstimos");
        }
      },
      marker: {
        show: true
      }
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.15
        }
      },
      active: {
        filter: {
          type: 'darken',
          value: 0.15
        }
      }
    }
  };

  // Cria o gráfico
  weeklyChart = new ApexCharts(container, options);
  weeklyChart.render();
}

// -----------------------------
// Renderização Principal
// -----------------------------
function renderAll() {
  updateDate();
  renderSummaryCards();
  loadWeeklyLoanChart();
  // NÃO MEXA: Funções que já estão funcionais
  loadLoanHistory();
  renderActivityList();
  loadHighlightedLoans();
}

function updateDate() {
  const date = new Date();
  const options = { day: 'numeric', month: 'long' };
  const el = document.getElementById('currentDate');
  if (el) el.innerText = date.toLocaleDateString('pt-BR', options);
}

// -----------------------------
// ATIVIDADES RECENTES (NÃO MEXA - 100% FUNCIONAL)
// -----------------------------
function loadLoanHistory() {
  const stored = localStorage.getItem(loanHistoryKey);
  loanHistory = stored ? JSON.parse(stored) : [];
}

async function renderActivityList() {
  const list = document.getElementById("activityList");
  if (!list) return;
  list.innerHTML = "";

  // Limita para 4 itens
  const items = loanHistory.slice(0, 4);

  if (!items.length) {
    list.innerHTML = "<li class='empty'>Nenhuma atividade registrada.</li>";
    return;
  }

  try {
    const users = await fetch("http://localhost:3000/usuarios").then(r => r.json()).catch(() => []);
    const books = await fetch("http://localhost:3000/livros").then(r => r.json()).catch(() => []);

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
  } catch (error) {
    console.error('Erro ao renderizar atividades:', error);
    list.innerHTML = "<li class='empty'>Erro ao carregar atividades.</li>";
  }
}

// -----------------------------
// EMPRÉSTIMOS EM DESTAQUE (NÃO MEXA - 100% FUNCIONAL)
// -----------------------------
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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
      TBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhum empréstimo encontrado.</td></tr>`;
      return;
    }

    const usersArr = Array.isArray(users) ? users : [];
    const booksArr = Array.isArray(books) ? books : [];

    // Ordena por data mais recente
    const loansSorted = [...loans].sort((a, b) => {
      const aDate = Date.parse(a.data_retirada || a.date || a.createdAt || '') || 0;
      const bDate = Date.parse(b.data_retirada || b.date || b.createdAt || '') || 0;
      return bDate - aDate;
    });

    // Pega os 3 mais recentes
    const top = loansSorted.slice(0, 3);

    top.forEach(l => {
      const userCandidate = l.user ?? l.usuario ?? l.usuario_id ?? l.user_id ?? l.userId ?? l.usuarioId;
      const bookCandidate = l.book ?? l.livro ?? l.livro_id ?? l.book_id ?? l.bookId ?? l.livroId;

      const foundUser = findUserByCandidate(usersArr, userCandidate) ||
                        findUserByCandidate(usersArr, l.usuario_id ?? l.userId ?? l.user_id) ||
                        null;

      const foundBook = findBookByCandidate(booksArr, bookCandidate) ||
                        findBookByCandidate(booksArr, l.livro_id ?? l.bookId ?? l.book_id) ||
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
    const TBody = document.getElementById('loansTableBody');
    if (TBody) {
      TBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Erro ao carregar dados.</td></tr>';
    }
  }
}

// -----------------------------
// API Pública (para reload manual)
// -----------------------------
window.DashboardAPI = {
  reload: () => loadAllData(),
  getState: () => ({ loansData, usersData, booksData })
};

// -----------------------------
// Inicialização
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard inicializado');

  // Carrega dados do cache primeiro (render rápido)
  loansData = getStored(LOANS_KEY, []);
  usersData = getStored(USERS_KEY, []);
  booksData = getStored(BOOKS_KEY, []);

  renderAll();

  // Depois busca dados atualizados da API
  loadAllData().catch(err => console.warn('Initial loadAllData failed', err.message));

  // Auto-reload a cada 2 minutos
  setInterval(() => loadAllData().catch(() => {}), 120000);
});
