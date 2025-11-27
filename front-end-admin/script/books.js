const CATEGORIES = [
    "Ficção",
    "Fantasia",
    "Romance",
    "Sci-Fi",
    "Terror",
    "Desenvolvimento",
    "Thriller",
    "Técnico"
];

const API_BASE = 'http://localhost:3000/livros';

let booksData = [];
let deleteModal = null;
let modal = null;
let form = null;
let feedback = null;
let bookIdToDelete = null;
let isEditingId = null;

const PAGE_SIZE = 7;
let currentPage = 1;
let currentSort = 'title-asc';
let lastTotalPages = 1;
let currentFilters = { text: '', cat: 'all', status: 'all' };

document.addEventListener('DOMContentLoaded', async () => {
    modal = document.getElementById('bookModal');
    deleteModal = document.getElementById('deleteConfirmModal');
    form = document.getElementById('bookForm');
    feedback = document.getElementById('formFeedback');

    hydrateCategorySelects();
    setupFilters();
    setupSortAndToolbar();
    setupForm();
    setupImagePreview();
    setupModalClosing();
    setupPaginationControls();

    await loadBooks();
});

async function loadBooks() {
    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Falha ao buscar livros');
        booksData = await res.json();
        currentPage = 1;
        renderTable();
        updateMetrics();
    } catch (err) {
        console.error('Erro ao buscar livros:', err);
    }
}

function getFilteredAndSortedBooks() {
    const search = (currentFilters.text || '').toLowerCase().trim();
    const filterCat = currentFilters.cat || 'all';
    const filterStatus = currentFilters.status || 'all';

    let filtered = booksData.filter(book => {
        const matchText =
            book.titulo.toLowerCase().includes(search) ||
            book.autor.toLowerCase().includes(search) ||
            (book.isbn || '').toLowerCase().includes(search);

        const matchCat = filterCat === 'all' || book.categoria === filterCat;

        let matchStatus = true;
        if (filterStatus === 'available') matchStatus = book.estoque > 0;
        if (filterStatus === 'low') matchStatus = book.estoque > 0 && book.estoque < 3;
        if (filterStatus === 'out') matchStatus = book.estoque === 0;

        return matchText && matchCat && matchStatus;
    });

    const [field, dir] = currentSort.split('-');
    const isAsc = dir === 'asc';

    filtered.sort((a, b) => {
        let va, vb;
        switch (field) {
            case 'author':
                va = (a.autor || '').toLowerCase();
                vb = (b.autor || '').toLowerCase();
                break;
            case 'stock':
                va = a.estoque || 0;
                vb = b.estoque || 0;
                break;
            case 'category':
                va = (a.categoria || '').toLowerCase();
                vb = (b.categoria || '').toLowerCase();
                break;
            case 'title':
            default:
                va = (a.titulo || '').toLowerCase();
                vb = (b.titulo || '').toLowerCase();
                break;
        }
        if (va < vb) return isAsc ? -1 : 1;
        if (va > vb) return isAsc ? 1 : -1;
        return 0;
    });

    return filtered;
}

function renderTable() {
    const tbody = document.getElementById('booksTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    setText('totalBooksCount', booksData.length);

    const filtered = getFilteredAndSortedBooks();
    const total = filtered.length;

    lastTotalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > lastTotalPages) currentPage = lastTotalPages;

    const startIndex = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
    const endIndex = total === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, total);
    const pageItems = filtered.slice(startIndex, endIndex);

    if (!pageItems.length) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-muted); padding:18px;">Nenhum resultado encontrado.</td>`;
        tbody.appendChild(row);
        updatePaginationUI(0, 0, 0, 0);
        return;
    }

    pageItems.forEach(book => {
        const status = getStockStatus(book.estoque);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="book-cell-large">
                    <img src="${book.capa || 'https://placehold.co/200x300?text=Sem+Capa'}" class="book-cover-md"
                         alt="Capa de ${escapeHtml(book.titulo)}"
                         onerror="this.src='https://placehold.co/200x300?text=Sem+Capa'">
                    <div class="book-info-text">
                        <span class="book-title">${escapeHtml(book.titulo)}</span>
                        <span class="book-author">${escapeHtml(book.autor)}</span>
                    </div>
                </div>
            </td>
            <td><span class="status-tag" style="background:#f3f4f6; color:#6b7280;">${escapeHtml(book.categoria)}</span></td>
            <td style="font-family:monospace; color:var(--text-muted);">${escapeHtml(book.isbn || '')}</td>
            <td>
                <div class="stock-cell">
                    <span class="stock-badge ${status.class}">${book.estoque} un.</span>
                    <div class="stock-quick-edit">
                        <button class="btn-stock" type="button" data-id="${book.id}" data-delta="-1" title="Diminuir 1"><i class="ph ph-minus"></i></button>
                        <button class="btn-stock" type="button" data-id="${book.id}" data-delta="1" title="Adicionar 1"><i class="ph ph-plus"></i></button>
                    </div>
                </div>
            </td>
            <td><span class="status-tag ${status.tagClass}">${status.label}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action edit" type="button" onclick="editBook('${book.id}')" title="Editar"><i class="ph-bold ph-pencil-simple"></i></button>
                    <button class="btn-action delete" type="button" onclick="deleteBook('${book.id}')" title="Excluir"><i class="ph-bold ph-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePaginationUI(total, startIndex + 1, endIndex, lastTotalPages);
}

// Event Delegation para botões de estoque (+ / -)
document.getElementById('booksTableBody').addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-stock');
    if (!btn) return;

    const id = btn.dataset.id;
    const delta = Number(btn.dataset.delta);
    
    // Encontrar livro pelo ID (comparação solta para string/number)
    const book = booksData.find(b => b.id == id);
    if (!book) return;

    book.estoque = Math.max(0, (book.estoque || 0) + delta);
    await updateBook(book);
    await loadBooks();
});

function getStockStatus(qty) {
    if (qty === 0) return { label: 'Esgotado', class: 'out', tagClass: 'late' };
    if (qty < 3) return { label: 'Baixo', class: 'low', tagClass: 'pending' };
    return { label: 'Disponível', class: '', tagClass: 'active' };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==================== MODAL ====================

window.openBookModal = function (editId = null) {
    if (!modal) return;

    modal.classList.add('open');
    document.body.classList.add('modal-open');

    if (form) form.reset();
    updatePreview('');

    const titleEl = document.getElementById('modalTitle');
    if (editId) {
        isEditingId = editId;
        if (titleEl) titleEl.innerText = "Editar Livro";
        loadBookData(editId);
    } else {
        isEditingId = null;
        if (titleEl) titleEl.innerText = "Novo Livro";
    }

    setTimeout(() => document.getElementById('inpTitle')?.focus(), 80);
};

window.closeBookModal = function () {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    isEditingId = null;
};

window.deleteBook = function (id) {
    bookIdToDelete = id;
    const book = booksData.find(b => b.id === id);
    const target = document.getElementById("deleteBookName");
    if (book && target) {
        target.innerHTML = `<strong>${escapeHtml(book.titulo)}</strong><span style="color: var(--text-muted); font-weight: 500;">(autor: ${escapeHtml(book.autor)})</span>`;
    }
    deleteModal.classList.add('open');
    document.body.classList.add('modal-open');
};

window.closeDeleteModal = function () {
    if (!deleteModal) return;
    deleteModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    bookIdToDelete = null;
};

window.confirmDelete = async function () {
    if (bookIdToDelete) {
        await deleteBookById(bookIdToDelete);
        await loadBooks();
        closeDeleteModal();
    }
};

window.editBook = function (id) {
    openBookModal(id);
};

// ==================== FORM ====================

function setupForm() {
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = buildFormData();
        if (!data) return;

        if (isEditingId) {
            await updateBook(data);
        } else {
            await createBook(data);
        }

        await loadBooks();
        closeBookModal();
    });
}

function buildFormData() {
    const title = document.getElementById('inpTitle');
    const author = document.getElementById('inpAuthor');
    const category = document.getElementById('inpCategory');
    const isbn = document.getElementById('inpISBN');
    const stock = document.getElementById('inpStock');
    const cover = document.getElementById('inpCover');
    const desc = document.getElementById('inpDesc');

    [title, author, category].forEach(el => el?.classList.remove('input-error'));

    if (!title || !author || !category || !stock) return null;

    const missing = [title, author, category].filter(el => !el.value.trim());
    if (missing.length) {
        missing.forEach(el => el.classList.add('input-error'));
        setFeedback('Preencha os campos obrigatórios.');
        return null;
    }

    clearFeedback();

    return {
        id: isEditingId || undefined,
        titulo: title.value.trim(),
        autor: author.value.trim(),
        categoria: category.value.trim(),
        isbn: isbn?.value.trim() || '',
        estoque: Math.max(0, parseInt(stock.value, 10) || 0),
        capa: cover?.value.trim() || 'https://placehold.co/200x300?text=Sem+Capa',
        observacao: desc?.value || ''
    };
}

function loadBookData(id) {
    // Comparação solta (==) para garantir match entre string e number
    const book = booksData.find(b => b.id == id);
    if (!book) {
        console.error("Livro não encontrado para edição. ID:", id);
        return;
    }

    document.getElementById('inpTitle').value = book.titulo;
    document.getElementById('inpAuthor').value = book.autor;
    document.getElementById('inpCategory').value = book.categoria;
    document.getElementById('inpISBN').value = book.isbn || '';
    document.getElementById('inpStock').value = book.estoque;
    document.getElementById('inpCover').value = book.capa || '';
    document.getElementById('inpDesc').value = book.observacao || '';
    updatePreview(book.capa || '');
}

// ==================== IMAGE PREVIEW ====================

function setupImagePreview() {
    const inp = document.getElementById('inpCover');
    if (!inp) return;
    inp.addEventListener('input', (e) => updatePreview(e.target.value));
}

function updatePreview(url) {
    const wrapper = document.getElementById('coverPreview');
    if (!wrapper) return;

    const img = wrapper.querySelector('img');
    const icon = wrapper.querySelector('i');
    const span = wrapper.querySelector('span');

    if (url) {
        img && (img.src = url, img.classList.remove('hidden'));
        icon && (icon.style.display = 'none');
        span && (span.style.display = 'none');
    } else {
        img && img.classList.add('hidden');
        icon && (icon.style.display = 'block');
        span && (span.style.display = 'block');
    }
}

function updateMetrics() {
    const totalStock = booksData.reduce((sum, b) => sum + (b.estoque || 0), 0);
    const low = booksData.filter(b => b.estoque > 0 && b.estoque < 3).length;
    const out = booksData.filter(b => b.estoque === 0).length;

    setText('metricInventoryValue', `${totalStock} itens`);
    setText('metricLowStock', `${low} críticos`);
    setText('metricBorrowed', `+${out}`);

    setText('toolbarTotalTitles', booksData.length);
    setText('toolbarLowStock', low);
    setText('toolbarOutOfStock', out);

    const booksPill = document.querySelector('[data-count="books"]');
    if (booksPill) {
        booksPill.textContent = booksData.length;
    }
}

// ==================== FILTERS, SORT & PAGINATION ====================

function hydrateCategorySelects() {
    const selFilter = document.getElementById('categoryFilter');
    const selForm = document.getElementById('inpCategory');

    const addOptions = (selectEl, includeAll) => {
        if (!selectEl) return;
        selectEl.innerHTML = includeAll ? `<option value="all">Todas Categorias</option>` : "";
        CATEGORIES.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            selectEl.appendChild(opt);
        });
    };

    addOptions(selFilter, true);
    addOptions(selForm, false);
}

function setupFilters() {
    const search = document.getElementById('searchInput');
    const cat = document.getElementById('categoryFilter');
    const status = document.getElementById('statusFilter');
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (!search || !cat || !status) return;

    const apply = () => {
        currentFilters = { text: search.value, cat: cat.value, status: status.value };
        currentPage = 1;
        renderTable();
    };

    search.addEventListener('input', apply);
    cat.addEventListener('change', apply);
    status.addEventListener('change', apply);

    clearBtn?.addEventListener('click', () => {
        search.value = '';
        cat.value = 'all';
        status.value = 'all';
        currentFilters = { text: '', cat: 'all', status: 'all' };
        currentPage = 1;
        renderTable();
    });

    apply();
}

function setupSortAndToolbar() {
    document.getElementById('sortSelect')?.addEventListener('change', e => {
        currentSort = e.target.value;
        currentPage = 1;
        renderTable();
    });

    document.getElementById('exportCsvBtn')?.addEventListener('click', exportBooksToCsv);
    document.getElementById('printBtn')?.addEventListener('click', () => window.print());
}

function setupPaginationControls() {
    document.getElementById('prevPageBtn')?.addEventListener('click', () => { if(currentPage>1){currentPage--;renderTable();} });
    document.getElementById('nextPageBtn')?.addEventListener('click', () => { if(currentPage<lastTotalPages){currentPage++;renderTable();} });
}

function updatePaginationUI(totalItems, from, to, totalPages) {
    const infoEl = document.getElementById('paginationInfo');
    const pageEl = document.getElementById('pageIndicator');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if(totalItems===0){
        if(infoEl) infoEl.textContent='Nenhum item para exibir';
        if(pageEl) pageEl.textContent='Pág. 0 de 0';
        if(prevBtn) prevBtn.disabled=true;
        if(nextBtn) nextBtn.disabled=true;
        return;
    }
    if(infoEl) infoEl.textContent=`Mostrando ${from}–${to} de ${totalItems}`;
    if(pageEl) pageEl.textContent=`Pág. ${currentPage} de ${totalPages}`;
    if(prevBtn) prevBtn.disabled=currentPage<=1;
    if(nextBtn) nextBtn.disabled=currentPage>=totalPages;
}

// ==================== MODAL CLOSE ESC ====================

function setupModalClosing() {
    document.querySelectorAll('[data-modal-overlay]').forEach(overlay => {
        overlay.addEventListener('click', e => { if(e.target===overlay){ overlay.id==='bookModal'?closeBookModal():closeDeleteModal(); } });
    });
    document.addEventListener('keydown', e => { if(e.key==='Escape'){ closeBookModal(); closeDeleteModal(); } });
}

// ==================== FEEDBACK ====================

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setFeedback(msg){ feedback && (feedback.textContent=msg);}
function clearFeedback(){ feedback && (feedback.textContent='');}

// ==================== API CRUD ====================

// ==================== API CRUD ====================

async function createBook(book){ 
    const res=await fetch(API_BASE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(book)}); 
    return res.json(); 
}
async function updateBook(book){ 
    const res=await fetch(`${API_BASE}/${book.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(book)}); 
    return res.json(); 
}
async function deleteBookById(id){ await fetch(`${API_BASE}/${id}`,{method:'DELETE'}); }

// ==================== EXPORT CSV ====================

function exportBooksToCsv(){
    const rows=[['Título','Autor','Categoria','ISBN','Estoque'],...booksData.map(b=>[b.titulo,b.autor,b.categoria,b.isbn,b.estoque])];
    const csv=rows.map(r=>r.map(f=>`"${String(f).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='books.csv';
    a.click();
    URL.revokeObjectURL(url);
}
