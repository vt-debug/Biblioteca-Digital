const LOANS_KEY = 'bibliotheca_loans_db';
const TIMELINE_KEY = 'bibliotheca_loans_timeline';

const initialLoans = [
  { id: 1, book: "Duna", user: "Ana Clara", out: "2025-02-01", ret: "2025-02-08", status: "active", note: "" },
  { id: 2, book: "1984", user: "Lucas Prado", out: "2025-01-28", ret: "2025-02-04", status: "late", note: "" },
  { id: 3, book: "O Hobbit", user: "Sofia M.", out: "2025-02-10", ret: "2025-02-17", status: "pending", note: "" }
];

let loansData = [];
let timelineData = [];
let editId = null;
let deleteId = null;

const modal = document.getElementById('loanModal');
const deleteModal = document.getElementById('deleteLoanConfirm');
const form = document.getElementById('loanForm');
const feedback = document.getElementById('loanFormFeedback');


document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderTable();
  renderTimeline();
  updateMetrics();
  setupListeners();
});

function loadData() {
  const storedLoans = localStorage.getItem(LOANS_KEY);
  loansData = storedLoans ? JSON.parse(storedLoans) : [...initialLoans];

  const storedTimeline = localStorage.getItem(TIMELINE_KEY);
  timelineData = storedTimeline ? JSON.parse(storedTimeline) : [];
}

function saveData() {
  localStorage.setItem(LOANS_KEY, JSON.stringify(loansData));
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(timelineData));
  updateMetrics();
  renderTable();
}


function renderTable(filterText = '', filterStatus = 'all') {
  const tbody = document.getElementById('loansTableBody');
  tbody.innerHTML = '';

  const search = filterText.toLowerCase().trim();

  const filtered = loansData.filter(loan => {
    const matchText = (loan.book.toLowerCase().includes(search) || loan.user.toLowerCase().includes(search));
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
                    <strong style="color:var(--text-main)">${loan.book}</strong>
                    <span class="loan-sub" style="font-size:0.85rem; color:var(--text-muted)">
                        ${loan.note ? loan.note : '—'}
                    </span>
                </div>
            </td>
            <td><strong>${loan.user}</strong></td>
            <td style="color:var(--text-muted)">${formatDateBr(loan.out)}</td>
            <td style="color:var(--text-muted)">${formatDateBr(loan.ret)}</td>
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

window.openLoanModal = function () {
  editId = null;
  resetForm();
  document.getElementById('loanModalTitle').textContent = "Novo Empréstimo";
  document.getElementById('btnSaveLoan').textContent = "Salvar";

  document.getElementById('inpLoanOut').value = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
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

  document.getElementById('inpLoanBook').value = loan.book;
  document.getElementById('inpLoanUser').value = loan.user;
  document.getElementById('inpLoanOut').value = loan.out;
  document.getElementById('inpLoanReturn').value = loan.ret;
  document.getElementById('inpLoanStatus').value = loan.status;
  document.getElementById('inpLoanNote').value = loan.note;

  openModal(modal);
};

function handleFormSubmit(e) {
  e.preventDefault();

  const book = document.getElementById('inpLoanBook').value.trim();
  const user = document.getElementById('inpLoanUser').value.trim();

  if (!book || !user) {
    feedback.textContent = "Preencha o nome do livro e do usuário.";
    return;
  }

  const formData = {
    id: editId || Date.now(),
    book: book,
    user: user,
    out: document.getElementById('inpLoanOut').value,
    ret: document.getElementById('inpLoanReturn').value,
    status: document.getElementById('inpLoanStatus').value,
    note: document.getElementById('inpLoanNote').value
  };

  if (editId) {
    const index = loansData.findIndex(l => l.id === editId);
    if (index !== -1) {
      loansData[index] = formData;
      addToTimeline('updated', `Editado: ${book} (${user})`);
    }
  } else {
    loansData.unshift(formData);
    addToTimeline('created', `Novo empréstimo: ${book} para ${user}`);
  }

  saveData();
  closeModal(modal);
}


function addToTimeline(type, text) {
  const entry = {
    type,
    text,
    date: new Date().toISOString()
  };
  timelineData.unshift(entry);
  if (timelineData.length > 20) timelineData.pop();
  saveData();
  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('loanTimeline');
  container.innerHTML = '';

  if (timelineData.length === 0) {
    container.innerHTML = `<li class="mini-item" style="justify-content:center; color:#aaa;">Sem histórico recente.</li>`;
    return;
  }

  timelineData.forEach(item => {
    let dotClass = 'info';
    if (item.type === 'created') dotClass = 'success';
    if (item.type === 'deleted') dotClass = 'danger';
    if (item.type === 'returned') dotClass = 'success';

    const li = document.createElement('li');
    li.className = 'mini-item';
    li.innerHTML = `
            <div class="dot ${dotClass}"></div>
            <div style="flex:1">
                <strong>${item.text}</strong>
                <p style="font-size:0.75rem; opacity:0.7">${formatTime(item.date)} - ${formatDateBr(item.date)}</p>
            </div>
        `;
    container.appendChild(li);
  });
}

window.clearLoanTimeline = function () {
  timelineData = [];
  saveData();
  renderTimeline();
}

window.openDelete = function (id) {
  deleteId = id;
  const loan = loansData.find(l => l.id === Number(id));
  if (loan) {
    document.getElementById('deleteLoanText').textContent = `${loan.book} - ${loan.user}`;
  }
  openModal(deleteModal);
};

window.confirmLoanDelete = function () {
  if (deleteId) {
    const loan = loansData.find(l => l.id === Number(deleteId));
    if (loan) addToTimeline('deleted', `Excluído: ${loan.book}`);

    loansData = loansData.filter(l => l.id !== Number(deleteId));
    saveData();
    closeModal(deleteModal);
  }
};

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

function resetForm() {
  form.reset();
  feedback.textContent = '';
  const errs = form.querySelectorAll('.input-error');
  errs.forEach(e => e.classList.remove('input-error'));
}

function setupListeners() {
  form.addEventListener('submit', handleFormSubmit);

  document.getElementById('loanSearchInput').addEventListener('input', (e) => {
    renderTable(e.target.value, document.getElementById('loanStatusFilter').value);
  });
  document.getElementById('loanStatusFilter').addEventListener('change', (e) => {
    renderTable(document.getElementById('loanSearchInput').value, e.target.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(modal); closeModal(deleteModal); }
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) { closeModal(modal); closeModal(deleteModal); }
    });
  });
}

function updateMetrics() {
  const active = loansData.filter(l => l.status === 'active').length;
  const late = loansData.filter(l => l.status === 'late').length;
  const returned = loansData.filter(l => l.status === 'returned').length;

  document.getElementById('metricActiveLoans').textContent = active;
  document.getElementById('metricLateLoans').textContent = late;
  document.getElementById('metricReturned').textContent = returned;
}

function formatDateBr(isoDate) {
  if (!isoDate) return '--';
  if (isoDate.includes('T')) isoDate = isoDate.split('T')[0];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusLabel(status) {
  const map = {
    active: 'Ativo',
    pending: 'Pendente',
    late: 'Atrasado',
    returned: 'Devolvido'
  };
  return map[status] || status;
} 