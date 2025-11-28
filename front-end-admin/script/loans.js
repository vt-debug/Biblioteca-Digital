let loansData = [];
let editId = null;
let deleteId = null;

const modal = document.getElementById('loanModal');
const deleteModal = document.getElementById('deleteLoanConfirm');
const form = document.getElementById('loanForm');
const feedback = document.getElementById('loanFormFeedback');
const timelineData = [];

// ===================== API =====================
async function fetchLoans() {
  try {
    const res = await fetch('http://localhost:3000/emprestimos');
    const json = await res.json();
    loansData = json || [];
    renderTable();
    updateMetrics();
    updateLoanTimeline(); 
  } catch (err) {
    console.error("Erro ao carregar empréstimos:", err);
  }
}

async function createLoan(data) {
  try {
    const res = await fetch('http://localhost:3000/emprestimos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error("Erro ao criar empréstimo:", err);
  }
}

async function updateLoan(id, data) {
  try {
    const res = await fetch(`http://localhost:3000/emprestimos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error("Erro ao atualizar empréstimo:", err);
  }
}

async function deleteLoan(id) {
  try {
    await fetch(`http://localhost:3000/emprestimos/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error("Erro ao deletar empréstimo:", err);
  }
}

// ===================== Render Table =====================
function renderTable(filterText = '', filterStatus = 'all') {
  const tbody = document.getElementById('loansTableBody');
  tbody.innerHTML = '';

  const search = filterText.toLowerCase().trim();

  const filtered = loansData.filter(loan => {
    const matchText = (loan.livro.toLowerCase().includes(search) || loan.usuario.toLowerCase().includes(search));
    const matchStatus = filterStatus === 'all' || loan.status === filterStatus;
    return matchText && matchStatus;
  });

  document.getElementById('totalLoansCount').textContent = loansData.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#888;">Nenhum registro encontrado.</td></tr>`;
    return;
  }

  filtered.forEach(loan => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="loan-meta">
          <strong style="color:var(--text-main)">${loan.livro}</strong>
          <span class="loan-sub" style="font-size:0.85rem; color:var(--text-muted)">
            ${loan.observacao || '—'}
          </span>
        </div>
      </td>
      <td><strong>${loan.usuario}</strong></td>
      <td style="color:var(--text-muted)">${formatDateBr(loan.data_retirada)}</td>
      <td style="color:var(--text-muted)">${formatDateBr(loan.data_devolucao)}</td>
      <td><span class="status-badge ${loan.status}">${getStatusLabel(loan.status)}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-action edit" onclick="openEdit(${loan.id})"><i class="ph-bold ph-pencil-simple"></i></button>
          <button class="btn-action delete" onclick="openDelete(${loan.id})"><i class="ph-bold ph-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ===================== Modal =====================
window.openLoanModal = function () {
  editId = null;
  resetForm();
  document.getElementById('loanModalTitle').textContent = "Novo Empréstimo";
  document.getElementById('btnSaveLoan').textContent = "Salvar";

  const today = new Date();
  document.getElementById('inpLoanOut').value = today.toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  document.getElementById('inpLoanReturn').value = nextWeek.toISOString().split('T')[0];

  openModal(modal);
};

window.openEdit = function (id) {
  const loan = loansData.find(l => l.id === Number(id));
  if (!loan) return;

  editId = loan.id;
  resetForm();

  document.getElementById('loanModalTitle').textContent = "Editar Empréstimo";
  document.getElementById('btnSaveLoan').textContent = "Atualizar";

  document.getElementById('inpLoanBook').value = loan.livro;
  document.getElementById('inpLoanUser').value = loan.usuario;
  document.getElementById('inpLoanOut').value = loan.data_retirada;
  document.getElementById('inpLoanReturn').value = loan.data_devolucao;
  document.getElementById('inpLoanStatus').value = loan.status;
  document.getElementById('inpLoanNote').value = loan.observacao;

  openModal(modal);
};

// ===================== Form =====================
async function handleFormSubmit(e) {
  e.preventDefault();

  const livro = document.getElementById('inpLoanBook').value.trim();
  const usuario = document.getElementById('inpLoanUser').value.trim();

  if (!livro || !usuario) {
    feedback.textContent = "Preencha o nome do livro e do usuário.";
    return;
  }

  const formData = {
    livro,
    usuario,
    data_retirada: document.getElementById('inpLoanOut').value,
    data_devolucao: document.getElementById('inpLoanReturn').value,
    status: document.getElementById('inpLoanStatus').value,
    observacao: document.getElementById('inpLoanNote').value
  };

  try {
    if (editId) {
      await updateLoan(editId, formData);
    } else {
      await createLoan(formData);
    }

    await fetchLoans();  // Atualiza todos os empréstimos
    updateLoanTimeline();
    closeModal(modal);
  } catch (err) {
    feedback.textContent = "Erro ao salvar empréstimo.";
    console.error(err);
  }
}

// ===================== Delete =====================
window.openDelete = function (id) {
  deleteId = id;
  const loan = loansData.find(l => l.id === Number(id));
  if (loan) document.getElementById('deleteLoanText').textContent = `${loan.livro} - ${loan.usuario}`;
  openModal(deleteModal);
};

window.confirmLoanDelete = async function () {
  if (deleteId) {
    await deleteLoan(deleteId);
    await fetchLoans();
    closeModal(deleteModal);
  }
};

// ===================== Metrics =====================
function updateMetrics() {
  const active = loansData.filter(l => l.status === 'active').length;
  const late = loansData.filter(l => l.status === 'late').length;
  const returned = loansData.filter(l => l.status === 'returned').length;

  document.getElementById('metricActiveLoans').textContent = active;
  document.getElementById('metricLateLoans').textContent = late;
  document.getElementById('metricReturned').textContent = returned;
}

// ===================== Helpers =====================
function resetForm() {
  form.reset();
  feedback.textContent = '';
}

function setupListeners() {
  form.addEventListener('submit', handleFormSubmit);

  document.getElementById('loanSearchInput').addEventListener('input', e => {
    renderTable(e.target.value, document.getElementById('loanStatusFilter').value);
  });
  document.getElementById('loanStatusFilter').addEventListener('change', e => {
    renderTable(document.getElementById('loanSearchInput').value, e.target.value);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(modal); closeModal(deleteModal); }
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) { closeModal(modal); closeModal(deleteModal); } });
  });
}

function openModal(el) {
  el.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal(el) {
  el.classList.remove('open');
  document.body.classList.remove('modal-open');
  editId = null;
  deleteId = null;
}

window.closeLoanModal = () => closeModal(modal);
window.closeDeleteLoanModal = () => closeModal(deleteModal);

function formatDateBr(date) {
  if (!date) return '--';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

function getStatusLabel(status) {
  return { active: 'Ativo', pending: 'Pendente', late: 'Atrasado', returned: 'Devolvido' }[status] || status;
}

// ===================== Inicialização =====================
document.addEventListener('DOMContentLoaded', () => {
  fetchLoans();
  setupListeners();
});


// ===================== Atividades Recentes com LocalStorage =====================
const loanHistoryKey = 'loanHistory'; // chave no localStorage
const loanHistory = [];

// Carrega histórico do localStorage ao iniciar
function loadLoanHistory() {
  const stored = localStorage.getItem(loanHistoryKey);
  if (stored) {
    loanHistory.push(...JSON.parse(stored));
    updateLoanTimeline();
  }
}

// Salva histórico no localStorage
function saveLoanHistory() {
  localStorage.setItem(loanHistoryKey, JSON.stringify(loanHistory));
}

// Função de log detalhado
function logLoanAction(oldData, newData, acao) {
  let detalhes = '';

  if (acao === 'updated' && oldData && newData) {
    const changes = [];
    if (oldData.livro !== newData.livro) changes.push(`livro: "${oldData.livro}" → "${newData.livro}"`);
    if (oldData.usuario !== newData.usuario) changes.push(`cliente: "${oldData.usuario}" → "${newData.usuario}"`);
    if (oldData.status !== newData.status) changes.push(`status: "${getStatusLabel(oldData.status)}" → "${getStatusLabel(newData.status)}"`);
    if (oldData.data_retirada !== newData.data_retirada) changes.push(`retirada: "${formatDateBr(oldData.data_retirada)}" → "${formatDateBr(newData.data_retirada)}"`);
    if (oldData.data_devolucao !== newData.data_devolucao) changes.push(`devolução: "${formatDateBr(oldData.data_devolucao)}" → "${formatDateBr(newData.data_devolucao)}"`);
    if (oldData.observacao !== newData.observacao) changes.push(`observação: "${oldData.observacao || '—'}" → "${newData.observacao || '—'}"`);
    detalhes = changes.join(', ');
  }

  loanHistory.unshift({
    usuario: newData.usuario,
    livro: newData.livro,
    acao,
    detalhes,
    data_retirada: new Date()
  });

  saveLoanHistory(); // salva no localStorage
  updateLoanTimeline();
}

// Interceptação automática
const originalCreateLoan = createLoan;
createLoan = async function(data) {
  const res = await originalCreateLoan(data);
  if (res) logLoanAction(null, data, 'created');
  return res;
};

const originalUpdateLoan = updateLoan;
updateLoan = async function(id, data) {
  const oldLoan = loansData.find(l => l.id === id);
  const res = await originalUpdateLoan(id, data);
  if (res) logLoanAction(oldLoan, data, 'updated');
  return res;
};

const originalDeleteLoan = deleteLoan;
deleteLoan = async function(id) {
  const loan = loansData.find(l => l.id === id);
  const res = await originalDeleteLoan(id);
  if (loan) logLoanAction(loan, loan, 'deleted');
  return res;
};

// Função para limpar atividades recentes
function clearLoanTimeline() {
  loanHistory.length = 0;
  saveLoanHistory();
  updateLoanTimeline();
}

// Timeline estilizada com ícones modernos
function updateLoanTimeline() {
  const timeline = document.getElementById('loanTimeline');
  timeline.innerHTML = '';

  loanHistory.slice(0, 4).forEach(loan => {
    const li = document.createElement('li');
    li.style.padding = '12px 16px';
    li.style.marginBottom = '10px';
    li.style.borderRadius = '8px';
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.fontFamily = 'Arial, sans-serif';
    li.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
    li.style.transition = 'all 0.3s ease';

    let actionText = '';
    let icon = '';
    let bgColor = '';

    switch (loan.acao) {
      case 'created':
        actionText = `O cliente <strong>${loan.usuario}</strong> pegou o livro <em>${loan.livro}</em>`;
        icon = '📖';
        bgColor = '#e0f7fa';
        break;
      case 'returned':
        actionText = `O cliente <strong>${loan.usuario}</strong> devolveu o livro <em>${loan.livro}</em>`;
        icon = '📬';
        bgColor = '#e8f5e9';
        break;
      case 'deleted':
        actionText = `O empréstimo do cliente <strong>${loan.usuario}</strong> para o livro <em>${loan.livro}</em> foi excluído`;
        icon = '🗑️';
        bgColor = '#ffebee';
        break;
      case 'updated':
        actionText = `O empréstimo do cliente <strong>${loan.usuario}</strong> foi atualizado` 
                     + (loan.detalhes ? `: ${loan.detalhes}` : '');
        icon = '📝';
        bgColor = '#fff3e0';
        break;
      default:
        actionText = `Houve uma ação no empréstimo do cliente <strong>${loan.usuario}</strong> para o livro <em>${loan.livro}</em>`;
        icon = 'ℹ️';
        bgColor = '#f5f5f5';
    }

    li.style.backgroundColor = bgColor;
    li.innerHTML = `
      <span style="margin-right:12px; font-size:20px;">${icon}</span>
      <div>
        ${actionText} <br>
        <small style="color:#555;">${formatDateBr(loan.data_retirada)}</small>
      </div>
    `;

    timeline.appendChild(li);
  });
}

// Chamar ao carregar a página para carregar histórico
document.addEventListener('DOMContentLoaded', () => {
  loadLoanHistory();
});





