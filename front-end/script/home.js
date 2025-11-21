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

const initialBooks = [
    {
        id: 1,
        title: "A Sombra do Vento",
        author: "Carlos Ruiz Zafón",
        category: "Romance",
        cover: "https://m.media-amazon.com/images/I/91xOzA3VHtL.jpg",
        rating: "4.9",
        pages: 400,
        desc: "Um mistério literário ambientado na Barcelona da primeira metade do século XX, onde um jovem escolhe um livro que mudará sua vida."
    },
    {
        id: 2,
        title: "O Hobbit",
        author: "J.R.R. Tolkien",
        category: "Fantasia",
        cover: "https://m.media-amazon.com/images/I/91b8oNwaV1L._AC_UF1000,1000_QL80_.jpg",
        rating: "5.0",
        pages: 310,
        desc: "Bilbo Bolseiro vive uma vida pacata no Condado, até que o mago Gandalf o convoca para uma aventura inesperada com anões e um dragão."
    },
    {
        id: 3,
        title: "Duna",
        author: "Frank Herbert",
        category: "Sci-Fi",
        cover: "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg",
        rating: "4.8",
        pages: 680,
        desc: "A épica jornada de Paul Atreides no planeta deserto de Arrakis, envolvendo política, religião e ecologia."
    }
];

let myBooks = JSON.parse(localStorage.getItem('bibliotheca_books')) || initialBooks;

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalPreferences();
    renderBooks();
    updateStats();
    initCursor();
    initSpotlightEffect();
    initScrollAnimations();
    initStickyHeader();
    initCarousel();
    initMobileMenu();
    initNotifications();
    initChartAnimation();
    setupSearch();
    setupTags();
    setupAddBookForm();
});

function renderBooks(filterCategory = 'all', searchTerm = '') {
    const grid = document.getElementById('booksGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = myBooks.filter(book => {
        const matchCat = filterCategory === 'all' || book.category === filterCategory;
        const matchSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });

    filtered.forEach(book => {
        const el = document.createElement('div');
        el.className = 'book-item spotlight-item fade-in';
        el.onclick = () => openBookDetails(book);

        el.innerHTML = `
            <div class="book-cover-wrapper">
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='https://placehold.co/200x300?text=Sem+Capa'">
                <div class="progress-badge">${book.category}</div>
            </div>
            <div class="book-info">
                <h4>${book.title}</h4>
                <span>${book.author}</span>
            </div>
        `;
        grid.appendChild(el);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'book-item spotlight-item add-new click-shrink';
    addBtn.onclick = openAddModal;
    addBtn.innerHTML = `<div class="dashed-box"><i class="ph ph-plus" style="font-size: 2rem;"></i><span>Adicionar</span></div>`;
    grid.appendChild(addBtn);
    initSpotlightEffect();
}

function updateStats() {
    const countEls = document.querySelectorAll('.stat-num');
    if (countEls.length > 0) countEls[0].innerText = myBooks.length;
}

function saveBooks() {
    localStorage.setItem('bibliotheca_books', JSON.stringify(myBooks));
    updateStats();
}

function setupAddBookForm() {
    const form = document.getElementById('addBookForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newBook = {
            id: Date.now(),
            title: document.getElementById('inpTitle').value,
            author: document.getElementById('inpAuthor').value,
            category: document.getElementById('inpCategory').value,
            cover: document.getElementById('inpCover').value || 'https://placehold.co/200x300?text=Capa',
            desc: document.getElementById('inpDesc').value || 'Sem descrição.',
            rating: "0.0",
            pages: 0
        };
        myBooks.push(newBook);
        saveBooks();
        renderBooks();
        closeAddModal();
    });
}

const bookModal = document.getElementById('bookModal');
const addModal = document.getElementById('addBookModal');
let currentBookId = null;

function openBookDetails(book) {
    currentBookId = book.id;
    document.getElementById('m-cover').src = book.cover;
    document.getElementById('m-title').innerText = book.title;
    document.getElementById('m-author').innerText = book.author;
    document.getElementById('m-desc').innerText = book.desc;
    document.getElementById('m-rating').innerText = book.rating || '-';
    document.getElementById('m-pages').innerText = book.pages || '-';
    const tagEl = document.querySelector('#m-tag');
    if (tagEl) tagEl.innerText = book.category;
    bookModal.classList.add('open');
}

window.openAddModal = function () { addModal.classList.add('open'); }
window.closeAddModal = function () { addModal.classList.remove('open'); document.getElementById('addBookForm').reset(); }
window.closeModal = function () { bookModal.classList.remove('open'); currentBookId = null; }

const deleteBtn = document.getElementById('btnDeleteBook');
if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja excluir este livro?")) {
            myBooks = myBooks.filter(b => b.id !== currentBookId);
            saveBooks();
            renderBooks();
            closeModal();
        }
    });
}

[bookModal, addModal].forEach(modal => {
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
});

function initCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    if (slides.length === 0) return;
    let current = 0;
    let timer;
    const show = (idx) => {
        slides.forEach(s => s.classList.remove('active'));
        indicators.forEach(i => i.classList.remove('active'));
        if (idx >= slides.length) current = 0; else if (idx < 0) current = slides.length - 1; else current = idx;
        slides[current].classList.add('active');
        indicators[current].classList.add('active');
    };
    const next = () => show(current + 1);
    const start = () => timer = setInterval(next, 5000);
    const stop = () => clearInterval(timer);
    window.goToSlide = (i) => { stop(); show(i); start(); };
    const container = document.getElementById('heroCarousel');
    if (container) { container.addEventListener('mouseenter', stop); container.addEventListener('mouseleave', start); }
    start();
}

function initChartAnimation() {
    const bars = document.querySelectorAll('.bar');
    setTimeout(() => {
        bars.forEach(bar => {
            const finalHeight = bar.getAttribute('data-val');
            bar.style.height = finalHeight;
        });
    }, 500);
}

function initSpotlightEffect() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const items = document.querySelectorAll('.spotlight-item');
    items.forEach(el => {
        el.onmousemove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            el.style.setProperty('--x', `${x}px`);
            el.style.setProperty('--y', `${y}px`);
        };
    });
}

function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');
    if (!dot || !outline) return;
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        outline.animate({ left: `${x}px`, top: `${y}px` }, { duration: 400, fill: "forwards" });
    });
    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .book-item, input, .click-shrink')) document.body.classList.add('hovering');
        else document.body.classList.remove('hovering');
    });
}

function initStickyHeader() {
    const header = document.getElementById('topBar');
    const main = document.querySelector('.main-content');
    if (!header || !main) return;
    main.addEventListener('scroll', () => {
        if (main.scrollTop > 20) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', (e) => {
        const activeTag = document.querySelector('.tag-chip.active');
        const category = activeTag ? activeTag.getAttribute('data-filter') : 'all';
        renderBooks(category, e.target.value);
    });
}

function setupTags() {
    const tags = document.querySelectorAll('.tag-chip');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            const cat = tag.getAttribute('data-filter');
            const term = document.getElementById('searchInput').value;
            renderBooks(cat, term);
        });
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.querySelector('.close-sidebar-btn');
    function toggle() { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); }
    if (btn) btn.onclick = toggle;
    if (closeBtn) closeBtn.onclick = toggle;
    if (overlay) overlay.onclick = toggle;
}

function initNotifications() {
    const btn = document.getElementById('notifBtn');
    const drop = document.getElementById('notifDropdown');
    if (btn && drop) {
        btn.onclick = (e) => { e.stopPropagation(); drop.classList.toggle('active'); };
        document.onclick = (e) => { if (!drop.contains(e.target) && e.target !== btn) drop.classList.remove('active'); };
    }
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.animationPlayState = 'running'; observer.unobserve(entry.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-enter').forEach(el => { el.style.animationPlayState = 'paused'; observer.observe(el); });
}

function initGreeting() {
    const el = document.getElementById('greeting-text');
    if (el) {
        const h = new Date().getHours();
        el.innerText = h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,';
    }
}