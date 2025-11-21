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

const db = {
    hero: [
        { id: 101, title: "Duna: A Saga", desc: "A jornada messiânica de Paul Atreides.", badge: "Sci-Fi Awards", img: "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg", bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1472&auto=format&fit=crop" },
        { id: 102, title: "A Paciente Silenciosa", desc: "O assassinato brutal e o silêncio absoluto.", badge: "Thriller", img: "https://images.dlivros.org/Alex-Michaelides/paciente-silenciosa-alex-michaelides_large.webp", bg: "https://www.shutterstock.com/image-vector/deep-blue-grunge-texture-background-600nw-2654889733.jpg" }
    ],
    spotlight: {
        id: 201, title: "A Biblioteca da Meia-Noite", author: "Matt Haig", rating: 4.8, pages: 308, genre: "Ficção",
        desc: "Entre a vida e a morte, existe uma biblioteca. Cada livro oferece uma chance de experimentar outra vida.",
        img: "https://images.dlivros.org/Matt-Haig/biblioteca-meia-noite-matt-haig_medium.webp"
    },
    ranking: [
        { id: 1, rank: 1, title: "1984", author: "George Orwell", img: "https://m.media-amazon.com/images/I/91b8oNwaV1L._AC_UF1000,1000_QL80_.jpg", category: "Ficção" },
        { id: 2, rank: 2, title: "Harry Potter", author: "J.K. Rowling", img: "https://m.media-amazon.com/images/I/81ibfYk4qmL._AC_UF1000,1000_QL80_.jpg", category: "Fantasia" },
        { id: 3, rank: 3, title: "O Senhor dos Anéis", author: "J.R.R. Tolkien", img: "https://m.media-amazon.com/images/I/81X4R7QhFkL._AC_UF1000,1000_QL80_.jpg", category: "Fantasia" },
        { id: 4, rank: 4, title: "O Alquimista", author: "Paulo Coelho", img: "https://bibliotecamundial.com.br/wp-content/uploads/2025/01/o-alquimista-paulo-coelho.webp", category: "Romance" },
        { id: 5, rank: 5, title: "It: A Coisa", author: "Stephen King", img: "https://play-lh.googleusercontent.com/WxYq6KkczU1KQWyFM9O6ip9oi14xb3dfH6TUoSj6MVfxjtPzBAt925siy1rf-gfTEzAW=w240-h480-rw", category: "Terror" }
    ],
    audiobooks: [
        { id: 301, title: "Verity", duration: "12h 30m", img: "https://m.media-amazon.com/images/I/917iVfhEhxL._AC_UF1000,1000_QL80_.jpg", author: "Colleen Hoover" },
        { id: 302, title: "O Poder do Hábito", duration: "8h 15m", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqAcXk_01OW2lp4Vw4oM_4ienUiYhUklwtkw&s", author: "Charles Duhigg" },
        { id: 303, title: "Sapiens", duration: "15h 40m", img: "https://m.media-amazon.com/images/I/713jIoMO3UL._AC_UF1000,1000_QL80_.jpg", author: "Yuval Noah Harari" }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalPreferences(); 
    renderHero();
    renderSpotlight();
    renderRanking();
    renderAudiobooks();
    initUI();
    setupSearch();
    setupBentoFilters();
});

// --- Renderização ---
function renderHero() {
    const container = document.getElementById('heroCarousel');
    const indicators = document.getElementById('heroIndicators');
    if (!container) return;
    db.hero.forEach((item, index) => {
        const isActive = index === 0 ? 'active' : '';
        container.innerHTML += `
            <div class="c-slide ${isActive}" style="background-image: url('${item.bg}')">
                <div class="c-overlay"></div>
                <div class="c-content">
                    <div class="c-badge">${item.badge}</div>
                    <h1>${item.title}</h1>
                    <p>${item.desc}</p>
                    <div class="c-actions">
                        <button class="btn-blur click-shrink" onclick="addToLibrary('${item.title}')"><i class="ph-fill ph-plus"></i> Minha Lista</button>
                    </div>
                </div>
                <div class="c-visual tilt-element"><img src="${item.img}"></div>
            </div>`;
        indicators.innerHTML += `<span class="c-dot ${isActive}" onclick="goToSlide(${index})"></span>`;
    });
}

function renderSpotlight() {
    const sec = document.getElementById('spotlightSection');
    const item = db.spotlight;
    sec.innerHTML = `
        <div class="release-noise"></div><div class="release-glow"></div>
        <div class="release-container">
            <div class="release-info">
                <div class="release-badge"><i class="ph-fill ph-fire"></i> Lançamento</div>
                <h2>${item.title}</h2>
                <p class="release-author">${item.author}</p>
                <div class="release-synopsis"><p>"${item.desc}"</p></div>
                <div class="release-actions">
                    <button class="btn-release-primary click-shrink" onclick='openModalObj(${JSON.stringify(item)})'>Ver Detalhes</button>
                    <button class="btn-release-secondary click-shrink" onclick="addToLibrary('${item.title}')"><i class="ph ph-plus"></i></button>
                </div>
            </div>
            <div class="release-visual tilt-element"><img src="${item.img}"></div>
        </div>`;
}

function renderRanking() {
    const container = document.getElementById('rankingRow');
    db.ranking.forEach(book => {
        const div = document.createElement('div');
        div.className = 'ranking-card click-shrink spotlight-item';
        div.onclick = () => openModalObj(book);
        div.innerHTML = `<span class="rank-number">${book.rank}</span><img src="${book.img}">`;
        container.appendChild(div);
    });
}

function renderAudiobooks() {
    const container = document.getElementById('audioRow');
    container.innerHTML = "";

    db.audiobooks.forEach(book => {
        container.innerHTML += `
            <div class="audio-card spotlight-item click-shrink">

                <i class="ph-fill ph-headphones audio-headphone-icon"></i>

                <img class="audio-cover" src="${book.img}">

                <h4 class="audio-title">${book.title}</h4>
                <p class="audio-author">${book.author}</p>

                <div class="audio-wave"></div>

                <button class="audio-add-btn"
                    onclick='event.stopPropagation(); addToLibrary("${book.title}")'>
                    <i class="ph ph-plus"></i>
                </button>

            </div>
        `;
    });
}


function setupSearch() {
    const input = document.getElementById('searchInput');
    const resetBtn = document.getElementById('resetSearch');
    const resultsGrid = document.getElementById('searchResultsGrid');

    const performSearch = (term) => {
        term = term.toLowerCase();
        if (term.length > 0) {
            document.body.classList.add('search-active');
            resetBtn.style.display = 'block';

            const allBooks = [...db.ranking, db.spotlight, ...db.audiobooks, ...db.hero];
            const results = allBooks.filter(b => {
                const matchesTitle = b.title.toLowerCase().includes(term);
                const matchesCat = b.category ? b.category.toLowerCase().includes(term) : false;
                return matchesTitle || matchesCat;
            });

            resultsGrid.innerHTML = '';
            if (results.length === 0) {
                resultsGrid.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center;">Nenhum livro encontrado para "' + term + '".</p>';
            } else {
                results.forEach(book => {
                    resultsGrid.innerHTML += `
                        <div class="store-book-card tilt-card" onclick='openModalObj(${JSON.stringify(book)})'>
                            <div class="card-inner"><img src="${book.img}"></div>
                            <div class="store-info"><h4>${book.title}</h4><span>${book.author || "Autor"}</span></div>
                        </div>
                    `;
                });
            }
        } else {
            exitSearch();
        }
    };

    input.addEventListener('input', (e) => performSearch(e.target.value));

    window.triggerSearch = performSearch;

    resetBtn.addEventListener('click', () => { input.value = ''; exitSearch(); });
}

function exitSearch() {
    document.body.classList.remove('search-active');
    document.getElementById('resetSearch').style.display = 'none';
}

function setupBentoFilters() {
    const boxes = document.querySelectorAll('.bento-box, .tag-chip');
    boxes.forEach(box => {
        box.addEventListener('click', () => {
            const cat = box.getAttribute('data-cat') || box.getAttribute('data-filter');
            if (cat && cat !== 'all') {
                const input = document.getElementById('searchInput');
                input.value = cat;
                window.triggerSearch(cat);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (cat === 'all') {
                exitSearch();
            }
        });
    });
}

function initUI() {
    initCursor(); initSpotlightEffect(); initMobileMenu(); initCinematicCarousel(); init3DTilt(); initDragScroll();
}

const bookModal = document.getElementById('bookModal');
window.openModalObj = function (book) {
    document.getElementById('m-cover').src = book.img;
    document.getElementById('m-title').innerText = book.title;
    document.getElementById('m-author').innerText = book.author || "Autor Desconhecido";
    bookModal.classList.add('open');
};
window.closeModal = function () { bookModal.classList.remove('open'); };

window.addToLibrary = function (title) {
    const toast = document.getElementById('toast');
    const msg = title ? `"${title}" adicionado!` : "Adicionado!";
    toast.querySelector('span').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};

function initCinematicCarousel() {
    const slides = document.querySelectorAll('.c-slide');
    const dots = document.querySelectorAll('.c-dot');
    if (slides.length === 0) return;
    let current = 0, timer;
    const show = (idx) => {
        slides.forEach(s => { s.classList.remove('active'); s.style.opacity = '0'; s.style.visibility = 'hidden'; });
        dots.forEach(d => d.classList.remove('active'));
        current = (idx >= slides.length) ? 0 : (idx < 0 ? slides.length - 1 : idx);
        slides[current].classList.add('active');
        void slides[current].offsetWidth;
        slides[current].style.opacity = '1';
        slides[current].style.visibility = 'visible';
        if (dots[current]) dots[current].classList.add('active');
    };
    const next = () => show(current + 1);
    const start = () => timer = setInterval(next, 6000);
    const stop = () => clearInterval(timer);
    window.goToSlide = (i) => { stop(); show(i); start(); };
    const container = document.getElementById('heroCarousel');
    if (container) { container.addEventListener('mouseenter', stop); container.addEventListener('mouseleave', start); }
    show(0); start();
}

function initDragScroll() {
    const sliders = document.querySelectorAll('.drag-scroll');
    sliders.forEach(slider => {
        let isDown = false, startX, scrollLeft;
        slider.addEventListener('mousedown', (e) => { isDown = true; slider.style.cursor = 'grabbing'; startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; });
        slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 2; slider.scrollLeft = scrollLeft - walk; });
    });
}

function init3DTilt() {
    const cards = document.querySelectorAll('.tilt-element, .ranking-card, .store-book-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            const centerX = rect.width / 2; const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            const target = card.querySelector('img') || card;
            target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        });
        card.addEventListener('mouseleave', () => {
            const target = card.querySelector('img') || card;
            target.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });
}

function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = document.querySelector('.cursor-dot');
    const outline = document.querySelector('.cursor-outline');
    if (!dot) return;
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX; const y = e.clientY;
        dot.style.left = `${x}px`; dot.style.top = `${y}px`;
        outline.animate({ left: `${x}px`, top: `${y}px` }, { duration: 400, fill: "forwards" });
    });
    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .spotlight-item, .click-shrink')) document.body.classList.add('hovering');
        else document.body.classList.remove('hovering');
    });
}
function initSpotlightEffect() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.addEventListener('mousemove', (e) => {
        const target = e.target.closest('.spotlight-item');
        if (target) {
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            target.style.setProperty('--x', `${x}px`); target.style.setProperty('--y', `${y}px`);
        }
    });
}
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.animationPlayState = 'running'; observer.unobserve(entry.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-enter').forEach(el => { el.style.animationPlayState = 'paused'; observer.observe(el); });
}
function initStickyHeader() {
    const header = document.getElementById('topBar');
    const main = document.querySelector('.main-content');
    if (!header || !main) return;
    main.addEventListener('scroll', () => {
        if (main.scrollTop > 20) header.classList.add('scrolled'); else header.classList.remove('scrolled');
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