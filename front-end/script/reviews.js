const readBooks = [
    { id: 101, title: "Duna", author: "Frank Herbert", cover: "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg" },
    { id: 102, title: "1984", author: "George Orwell", cover: "https://m.media-amazon.com/images/I/91b8oNwaV1L._AC_UF1000,1000_QL80_.jpg" },
    { id: 103, title: "O Pequeno Príncipe", author: "Antoine de Saint-Exupéry", cover: "https://m.media-amazon.com/images/I/81eB+7+CkUL._AC_UF1000,1000_QL80_.jpg" },
    { id: 104, title: "Sapiens", author: "Yuval Noah Harari", cover: "https://m.media-amazon.com/images/I/713jIoMO3UL._AC_UF1000,1000_QL80_.jpg" }
];

const initialReviews = [
    {
        id: 1,
        bookId: 101,
        title: "Duna",
        author: "Frank Herbert",
        cover: "https://m.media-amazon.com/images/I/81ym3QUd3KL._AC_UF1000,1000_QL80_.jpg",
        rating: 5,
        text: "Uma obra prima absoluta. A profundidade política e ecológica é incomparável.",
        date: "20/08/2025",
        spoiler: false,
        favorite: true,
        pages: 680
    },
    {
        id: 2,
        bookId: 102,
        title: "1984",
        author: "George Orwell",
        cover: "https://m.media-amazon.com/images/I/91b8oNwaV1L._AC_UF1000,1000_QL80_.jpg",
        rating: 4,
        text: "Perturbador e necessário. O final me deixou sem chão.",
        date: "15/08/2025",
        spoiler: true,
        favorite: false,
        pages: 416
    }
];

let myReviews = JSON.parse(localStorage.getItem('bibliotheca_reviews')) || initialReviews;
let pendingBooks = readBooks.filter(book => !myReviews.some(r => r.bookId === book.id));
let reviewIdToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    initUI();
    setupReviewForm();
});

function updateUI() {
    pendingBooks = readBooks.filter(book => !myReviews.some(r => r.bookId === book.id));
    renderPending();
    renderReviews();
    calculateStats();
    populateBookSelect();
}

function renderPending() {
    const container = document.getElementById('pendingContainer');
    if (!container) return;
    container.innerHTML = '';
    document.querySelector('#pendingCount').innerText = pendingBooks.length;

    if (pendingBooks.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); padding:20px;">Tudo em dia!</p>';
        return;
    }
    pendingBooks.forEach(book => {
        const div = document.createElement('div');
        div.className = 'pending-card spotlight-item click-shrink';
        div.onclick = () => openReviewModal(book.id);
        div.innerHTML = `
            <img src="${book.cover}" class="pending-cover">
            <div class="pending-info">
                <h4>${book.title}</h4>
                <p>${book.author}</p>
                <button class="btn-rate-now">Avaliar Agora <i class="ph-bold ph-arrow-right"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
    initSpotlightEffect();
}

function renderReviews(filter = 'all') {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    container.innerHTML = '';

    let sorted = [...myReviews].reverse();
    if (filter === '5star') sorted = sorted.filter(r => r.rating === 5);
    if (filter === 'fav') sorted = sorted.filter(r => r.favorite);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1; text-align:center;">Nenhuma resenha encontrada.</p>';
        return;
    }

    sorted.forEach(review => {
        let starsHTML = '';
        for (let i = 0; i < 5; i++) {
            starsHTML += i < review.rating ? '<i class="ph-fill ph-star"></i>' : '<i class="ph ph-star"></i>';
        }
        const spoilerTag = review.spoiler ? `<span class="review-tag spoiler-tag">Spoiler</span>` : '';
        const favIcon = review.favorite ? `<i class="ph-fill ph-heart favorite-icon"></i>` : '';

        const div = document.createElement('div');
        div.className = 'review-card';
        div.innerHTML = `
            <div class="review-header">
                <div class="review-book-info">
                    <img src="${review.cover}" class="review-thumb">
                    <div class="review-meta">
                        <h4>${review.title}</h4>
                        <span>${review.author}</span>
                        <div class="review-stars">${starsHTML} ${favIcon}</div>
                    </div>
                </div>
                <span class="review-date">${review.date}</span>
            </div>
            <div class="review-body"><p><i class="ph-fill ph-quotes quote-icon"></i>${review.text}</p></div>
            <div class="review-footer">
                <div style="display:flex; gap:5px;">
                    <span class="review-tag">${review.rating}/5</span>
                    ${spoilerTag}
                </div>
                <button class="btn-edit-review" onclick="openDeleteModal(${review.id})"><i class="ph ph-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}

function calculateStats() {
    const total = myReviews.length;
    let totalStars = 0;
    let totalPages = 0;
    myReviews.forEach(r => { totalStars += r.rating; totalPages += (r.pages || 250); });
    const avg = total > 0 ? (totalStars / total).toFixed(1) : "0.0";
    document.getElementById('totalReviews').innerText = total;
    document.getElementById('avgRating').innerText = avg;
    document.getElementById('totalPages').innerText = totalPages.toLocaleString();
}

window.filterReviews = function (type) {
    document.querySelectorAll('.filter-link').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderReviews(type);
}

const modal = document.getElementById('reviewModal');
const deleteModal = document.getElementById('deleteConfirmModal');
const select = document.getElementById('bookSelect');

window.openReviewModal = function (preSelectedId = null) {
    modal.classList.add('open');
    if (preSelectedId) { select.value = preSelectedId; updateBookPreview(); }
};
window.closeReviewModal = function () {
    modal.classList.remove('open');
    document.getElementById('reviewForm').reset();
    updateBookPreview();
};

window.openDeleteModal = function (id) { reviewIdToDelete = id; deleteModal.classList.add('open'); };
window.closeDeleteModal = function () { deleteModal.classList.remove('open'); reviewIdToDelete = null; };

window.confirmDelete = function () {
    if (reviewIdToDelete !== null) {
        const review = myReviews.find(r => r.id === reviewIdToDelete);
        myReviews = myReviews.filter(r => r.id !== reviewIdToDelete);
        localStorage.setItem('bibliotheca_reviews', JSON.stringify(myReviews));
        const book = readBooks.find(b => b.id === review.bookId);
        if (book) pendingBooks.push(book);
        updateUI();
        closeDeleteModal();
        showToast('Resenha apagada com sucesso.');
    }
};

function populateBookSelect() {
    select.innerHTML = '<option value="" disabled selected>Selecione da lista...</option>';
    pendingBooks.forEach(book => {
        const option = document.createElement('option');
        option.value = book.id; option.innerText = book.title; select.appendChild(option);
    });
}

window.updateBookPreview = function () {
    const preview = document.getElementById('selectedBookPreview');
    const bookId = parseInt(select.value);
    if (bookId) {
        const book = readBooks.find(b => b.id === bookId);
        if (book) { preview.innerHTML = `<img src="${book.cover}">`; return; }
    }
    preview.innerHTML = `<i class="ph ph-book-open-text"></i>`;
};

function setupReviewForm() {
    const form = document.getElementById('reviewForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const bookId = parseInt(select.value);
        const book = readBooks.find(b => b.id === bookId);
        const text = document.getElementById('reviewText').value;
        const rating = document.querySelector('input[name="rating"]:checked')?.value || 0;
        const spoiler = document.getElementById('spoilerCheck').checked;
        const favorite = document.getElementById('favoriteCheck').checked;
        if (!book) return;
        const newReview = {
            id: Date.now(), bookId: bookId, title: book.title, author: book.author, cover: book.cover,
            rating: parseInt(rating), text: text, date: new Date().toLocaleDateString('pt-BR'),
            spoiler: spoiler, favorite: favorite, pages: 300
        };
        myReviews.push(newReview);
        localStorage.setItem('bibliotheca_reviews', JSON.stringify(myReviews));
        updateUI();
        closeReviewModal();
        showToast('Resenha publicada!');
    });
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.querySelector('span').innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function initUI() {
    initCursor(); initSpotlightEffect(); initMobileMenu();
    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.animationPlayState = 'running'; observer.unobserve(entry.target); } }); });
    document.querySelectorAll('.animate-enter').forEach(el => { el.style.animationPlayState = 'paused'; observer.observe(el); });
}
function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = document.querySelector('.cursor-dot'); const outline = document.querySelector('.cursor-outline');
    if (!dot) return;
    window.addEventListener('mousemove', (e) => { dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`; outline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 400, fill: "forwards" }); });
    document.body.addEventListener('mouseover', (e) => { if (e.target.closest('a, button, .click-shrink, .review-card, .pending-card')) document.body.classList.add('hovering'); else document.body.classList.remove('hovering'); });
}
function initSpotlightEffect() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.addEventListener('mousemove', (e) => { const target = e.target.closest('.spotlight-item'); if (target) { const rect = target.getBoundingClientRect(); target.style.setProperty('--x', `${e.clientX - rect.left}px`); target.style.setProperty('--y', `${e.clientY - rect.top}px`); } });
}
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn'); const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('sidebarOverlay'); const closeBtn = document.querySelector('.close-sidebar-btn');
    function toggle() { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); }
    if (btn) btn.onclick = toggle; if (closeBtn) closeBtn.onclick = toggle; if (overlay) overlay.onclick = toggle;
}