
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

const initialBooks = [
    { id: 101, title: "Duna", author: "Frank Herbert", isbn: "978-0441013593", category: "Sci-Fi", stock: 5, cover: "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg" },
    { id: 102, title: "1984", author: "George Orwell", isbn: "978-0451524935", category: "Ficção", stock: 2, cover: "https://m.media-amazon.com/images/I/91b8oNwaV1L._AC_UF1000,1000_QL80_.jpg" },
    { id: 103, title: "O Hobbit", author: "J.R.R. Tolkien", isbn: "978-0547928227", category: "Fantasia", stock: 0, cover: "https://m.media-amazon.com/images/I/91b8oNwaV1L._AC_UF1000,1000_QL80_.jpg" },
    { id: 104, title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0062316097", category: "Técnico", stock: 12, cover: "https://m.media-amazon.com/images/I/713jIoMO3UL._AC_UF1000,1000_QL80_.jpg" },
    { id: 105, title: "Verity", author: "Colleen Hoover", isbn: "978-1538724736", category: "Romance", stock: 1, cover: "https://m.media-amazon.com/images/I/818+2m6h23L._AC_UF1000,1000_QL80_.jpg" }
];

const BOOKS_KEY = 'bibliotheca_books_db';
let booksData = JSON.parse(localStorage.getItem(BOOKS_KEY)) || initialBooks;

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
let currentFilters = {
    text: '',
    cat: 'all',
    status: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
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

    updateMetrics();
});

function getFilteredAndSortedBooks() {
    const search = (currentFilters.text || '').toLowerCase().trim();
    const filterCat = currentFilters.cat || 'all';
    const filterStatus = currentFilters.status || 'all';

    let filtered = booksData.filter(book => {
        const matchText =
            book.title.toLowerCase().includes(search) ||
            book.author.toLowerCase().includes(search) ||
            book.isbn.toLowerCase().includes(search);

        const matchCat = filterCat === 'all' || book.category === filterCat;

        let matchStatus = true;
        if (filterStatus === 'available') matchStatus = book.stock > 0;
        if (filterStatus === 'low') matchStatus = book.stock > 0 && book.stock < 3;
        if (filterStatus === 'out') matchStatus = book.stock === 0;

        return matchText && matchCat && matchStatus;
    });

    const [field, dir] = currentSort.split('-');
    const isAsc = dir === 'asc';

    filtered.sort((a, b) => {
        let va, vb;

        switch (field) {
            case 'author':
                va = (a.author || '').toLowerCase();
                vb = (b.author || '').toLowerCase();
                break;
            case 'stock':
                va = a.stock || 0;
                vb = b.stock || 0;
                break;
            case 'category':
                va = (a.category || '').toLowerCase();
                vb = (b.category || '').toLowerCase();
                break;
            case 'title':
            default:
                va = (a.title || '').toLowerCase();
                vb = (b.title || '').toLowerCase();
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
        row.innerHTML = `
            <td colspan="6" style="text-align:center; color:var(--text-muted); padding:18px;">
                Nenhum resultado encontrado.
            </td>`;
        tbody.appendChild(row);
        updatePaginationUI(0, 0, 0, 0);
        return;
    }

    pageItems.forEach(book => {
        const status = getStockStatus(book.stock);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="book-cell-large">
                    <img src="${book.cover}" class="book-cover-md"
                         alt="Capa de ${escapeHtml(book.title)}"
                         onerror="this.src='https://placehold.co/200x300?text=Sem+Capa'">
                    <div class="book-info-text">
                        <span class="book-title">${escapeHtml(book.title)}</span>
                        <span class="book-author">${escapeHtml(book.author)}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-tag" style="background:#f3f4f6; color:#6b7280;">
                    ${escapeHtml(book.category)}
                </span>
            </td>
            <td style="font-family:monospace; color:var(--text-muted);">
                ${escapeHtml(book.isbn)}
            </td>
            <td>
                <div class="stock-cell">
                    <span class="stock-badge ${status.class}">
                        ${book.stock} un.
                    </span>
                    <div class="stock-quick-edit">
                        <button class="btn-stock" type="button" data-id="${book.id}" data-delta="-1" title="Diminuir 1">
                            <i class="ph ph-minus"></i>
                        </button>
                        <button class="btn-stock" type="button" data-id="${book.id}" data-delta="1" title="Adicionar 1">
                            <i class="ph ph-plus"></i>
                        </button>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-tag ${status.tagClass}">
                    ${status.label}
                </span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-action edit" type="button"
                            onclick="editBook(${book.id})" title="Editar">
                        <i class="ph-bold ph-pencil-simple"></i>
                    </button>
                    <button class="btn-action delete" type="button"
                            onclick="deleteBook(${book.id})" title="Excluir">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('.btn-stock').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const delta = Number(btn.dataset.delta);
            const book = booksData.find(b => b.id === id);
            if (!book) return;
            book.stock = Math.max(0, (book.stock || 0) + delta);
            persistBooks();
            updateMetrics();
            renderTable();
        });
    });

    updatePaginationUI(total, startIndex + 1, endIndex, lastTotalPages);
}

function updatePaginationUI(totalItems, from, to, totalPages) {
    const infoEl = document.getElementById('paginationInfo');
    const pageEl = document.getElementById('pageIndicator');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (totalItems === 0) {
        if (infoEl) infoEl.textContent = 'Nenhum item para exibir';
        if (pageEl) pageEl.textContent = 'Pág. 0 de 0';
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
    }

    if (infoEl) {
        infoEl.textContent = `Mostrando ${from}–${to} de ${totalItems}`;
    }
    if (pageEl) {
        pageEl.textContent = `Pág. ${currentPage} de ${totalPages}`;
    }
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

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

function setupFilters() {
    const search = document.getElementById('searchInput');
    const cat = document.getElementById('categoryFilter');
    const status = document.getElementById('statusFilter');
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (!search || !cat || !status) return;

    const apply = () => {
        currentFilters = {
            text: search.value,
            cat: cat.value,
            status: status.value
        };
        currentPage = 1;
        renderTable();
    };

    search.addEventListener('input', apply);
    cat.addEventListener('change', apply);
    status.addEventListener('change', apply);

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            search.value = '';
            cat.value = 'all';
            status.value = 'all';
            currentFilters = { text: '', cat: 'all', status: 'all' };
            currentPage = 1;
            renderTable();
        });
    }

    apply();
}

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

function setupSortAndToolbar() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            currentPage = 1;
            renderTable();
        });
    }

    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportBooksToCsv);
    }

    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

function setupPaginationControls() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < lastTotalPages) {
                currentPage++;
                renderTable();
            }
        });
    }
}

window.openBookModal = function (editId = null) {
    if (!modal) return;

    modal.classList.add('open');
    document.body.classList.add('modal-open');
    clearFeedback();

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

    setTimeout(() => {
        const firstInput = document.getElementById('inpTitle');
        firstInput?.focus();
    }, 80);
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
        target.innerHTML = `
            <strong>${escapeHtml(book.title)}</strong>
            <span style="color: var(--text-muted); font-weight: 500;">
                (autor: ${escapeHtml(book.author)})
            </span>
        `;
    }

    deleteModal.classList.add('open');
    document.body.classList.add('modal-open');
};


window.closeDeleteModal = function () {
    if (!deleteModal) return;
    deleteModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    bookIdToDelete = null;
    const summaryEl = document.getElementById('deleteBookSummary');
    if (summaryEl) summaryEl.innerHTML = '';
};

window.confirmDelete = function () {
    if (bookIdToDelete !== null) {
        booksData = booksData.filter(b => b.id !== bookIdToDelete);
        persistBooks();
        updateMetrics();
        currentPage = 1;
        renderTable();
        closeDeleteModal();
    }
};

window.editBook = function (id) {
    openBookModal(id);
};

function setupModalClosing() {
    const overlays = document.querySelectorAll('[data-modal-overlay]');
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                if (overlay.id === 'bookModal') closeBookModal();
                if (overlay.id === 'deleteConfirmModal') closeDeleteModal();
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBookModal();
            closeDeleteModal();
        }
    });
}

function setupForm() {
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = buildFormData();
        if (!data) return;

        if (isEditingId) {
            const index = booksData.findIndex(b => b.id === isEditingId);
            if (index !== -1) booksData[index] = data;
        } else {
            booksData.push(data);
        }

        persistBooks();
        updateMetrics();
        renderTable();
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

    const requiredInputs = [title, author, category];
    requiredInputs.forEach(el => el?.classList.remove('input-error'));

    if (!title || !author || !category || !stock) return null;

    const missing = requiredInputs.filter(el => !el.value.trim());

    if (missing.length) {
        missing.forEach(el => el.classList.add('input-error'));
        setFeedback('Preencha os campos obrigatórios.');
        return null;
    }

    const stockVal = Math.max(0, parseInt(stock.value, 10) || 0);

    clearFeedback();

    return {
        id: isEditingId || Date.now(),
        title: title.value.trim(),
        author: author.value.trim(),
        category: category.value.trim(),
        isbn: (isbn?.value || '').trim(),
        stock: stockVal,
        cover: (cover?.value || '').trim() || 'https://placehold.co/200x300?text=Sem+Capa',
        desc: desc?.value || ''
    };
}

function loadBookData(id) {
    const book = booksData.find(b => b.id === id);
    if (!book) return;

    const title = document.getElementById('inpTitle');
    const author = document.getElementById('inpAuthor');
    const category = document.getElementById('inpCategory');
    const isbn = document.getElementById('inpISBN');
    const stock = document.getElementById('inpStock');
    const cover = document.getElementById('inpCover');
    const desc = document.getElementById('inpDesc');

    if (title) title.value = book.title;
    if (author) author.value = book.author;
    if (category) category.value = book.category;
    if (isbn) isbn.value = book.isbn;
    if (stock) stock.value = book.stock;
    if (cover) cover.value = book.cover;
    if (desc) desc.value = book.desc || '';

    updatePreview(book.cover);
}

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
        if (img) {
            img.src = url;
            img.classList.remove('hidden');
        }
        if (icon) icon.style.display = 'none';
        if (span) span.style.display = 'none';
    } else {
        if (img) img.classList.add('hidden');
        if (icon) icon.style.display = 'block';
        if (span) span.style.display = 'block';
    }
}

function persistBooks() {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(booksData));
}

function updateMetrics() {
    const totalStock = booksData.reduce((sum, b) => sum + (b.stock || 0), 0);
    const low = booksData.filter(b => b.stock > 0 && b.stock < 3).length;
    const out = booksData.filter(b => b.stock === 0).length;

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

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setFeedback(message) {
    if (feedback) feedback.textContent = message;
}

function clearFeedback() {
    if (feedback) feedback.textContent = '';
}

function exportBooksToCsv() {
    const rows = [
        ['Título', 'Autor', 'Categoria', 'ISBN', 'Estoque'],
        ...booksData.map(b => [
            b.title || '',
            b.author || '',
            b.category || '',
            b.isbn || '',
            String(b.stock ?? 0)
        ])
    ];

    const csv = rows
        .map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'acervo_bibliotheca.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
