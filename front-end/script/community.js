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

const initialPosts = [
    {
        id: 1,
        user: "Sofia Martins",
        avatar: "https://i.pravatar.cc/150?img=44",
        time: "2h atrás",
        book: "Duna",
        content: "Acabei de chegar na parte do deserto em Duna e estou impressionada com a construção de mundo!",
        likes: 24,
        comments: [],
        timestamp: Date.now() - 7200000,
        isLiked: false
    },
    {
        id: 2,
        user: "Lucas Pereira",
        avatar: "https://i.pravatar.cc/150?img=12",
        time: "5h atrás",
        book: "1984",
        content: "Relendo 1984 em 2025 e é assustador o quão atual esse livro continua.",
        likes: 156,
        comments: [{ user: "Ana", text: "Totalmente! O duplipensar é real." }],
        timestamp: Date.now() - 18000000,
        isLiked: true
    }
];

const initialClubs = [
    { id: 101, name: "Fantasia Épica", members: "1.2k", icon: "ph-sword", color: "#eab308" },
    { id: 102, name: "Romance de Época", members: "850", icon: "ph-heart", color: "#ef4444" }
];

let feedData = JSON.parse(localStorage.getItem('bibliotheca_feed')) || initialPosts;
feedData = feedData.map(post => ({
    ...post,
    comments: Array.isArray(post.comments) ? post.comments : []
}));

let clubsData = JSON.parse(localStorage.getItem('bibliotheca_clubs_data')) || initialClubs;
let joinedClubs = JSON.parse(localStorage.getItem('bibliotheca_joined_clubs')) || [];
let eventReminders = JSON.parse(localStorage.getItem('bibliotheca_events')) || [];
let currentFilter = 'hot';

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalPreferences();
    renderFeed();
    renderClubs();
    restoreEvents();
    initUI();
    setupPostCreation();
    setupFilters();
    setupClubModalLogic();
});

function renderFeed() {
    const container = document.getElementById('feedContainer');
    if (!container) return;
    container.innerHTML = '';

    let sortedData = [...feedData];
    if (currentFilter === 'hot') sortedData.sort((a, b) => b.likes - a.likes);
    else if (currentFilter === 'new') sortedData.sort((a, b) => b.timestamp - a.timestamp);
    else if (currentFilter === 'clubs') sortedData = sortedData.filter(post => post.id % 2 === 0);

    sortedData.forEach(post => {
        const postEl = document.createElement('div');
        postEl.className = 'post-card spotlight-item fade-in';

        const likeClass = post.isLiked ? 'liked' : '';
        const likeIcon = post.isLiked ? 'ph-fill' : 'ph';
        const trashBtn = post.user === "Leitor Voraz" ?
            `<button class="delete-post-btn" onclick="deletePost(${post.id})"><i class="ph ph-trash"></i></button>` : '';

        const comments = post.comments || [];
        const commentCount = comments.length;

        let commentsHTML = '';
        comments.forEach(c => {
            const username = c.user ? c.user : "Anônimo";
            commentsHTML += `<div class="comment-item"><strong>${username}:</strong> ${c.text}</div>`;
        });

        postEl.innerHTML = `
            <div class="post-header">
                <div class="user-info">
                    <img src="${post.avatar}" class="avatar-small">
                    <div class="user-meta">
                        <h4>${post.user}</h4>
                        <span>${post.time}</span>
                    </div>
                </div>
                <div class="book-tag"><i class="ph-fill ph-book-bookmark"></i> ${post.book}</div>
                ${trashBtn}
            </div>
            <div class="post-content"><p>${post.content}</p></div>
            <div class="post-actions">
                <div class="action-item ${likeClass}" onclick="toggleLike(this, ${post.id})">
                    <i class="${likeIcon} ph-heart"></i> <span>${post.likes}</span>
                </div>
                <div class="action-item" onclick="toggleComments(this)">
                    <i class="ph ph-chat-circle"></i> <span class="js-comment-count">${commentCount}</span>
                </div>
                <div class="action-item" style="margin-left: auto;"><i class="ph ph-share-network"></i></div>
            </div>
            <div class="comments-section">
                <div class="comment-list">${commentsHTML}</div>
                <div class="comment-input-wrapper">
                    <input type="text" placeholder="Escreva um comentário..." onkeypress="handleComment(event, ${post.id}, this)">
                    <button class="comment-send-btn" onclick="submitComment(${post.id}, this.previousElementSibling)"><i class="ph ph-paper-plane-right"></i></button>
                </div>
            </div>
        `;
        container.appendChild(postEl);
    });
    initSpotlightEffect();
}

function submitComment(id, input) {
    const text = input.value.trim();
    if (!text) return;

    const post = feedData.find(p => p.id === id);
    if (post) {
        if (!post.comments) post.comments = []; 
        post.comments.push({ user: "Leitor Voraz", text: text });
        saveFeed();

        const list = input.closest('.comments-section').querySelector('.comment-list');
        list.innerHTML += `<div class="comment-item"><strong>Leitor Voraz:</strong> ${text}</div>`;
        input.value = '';

        const countSpan = input.closest('.post-card').querySelector('.js-comment-count');
        if (countSpan) countSpan.innerText = post.comments.length;
    }
}
function handleComment(e, id, input) { if (e.key === 'Enter') submitComment(id, input); }
function toggleComments(btn) { btn.closest('.post-card').querySelector('.comments-section').classList.toggle('active'); }

function renderClubs() {
    const container = document.getElementById('clubsContainer');
    if (!container) return;
    container.innerHTML = '';

    clubsData.forEach(club => {
        const isJoined = joinedClubs.includes(club.id);
        const statusIcon = isJoined ? 'ph-check-circle' : 'ph-plus-circle';
        const statusColor = isJoined ? 'var(--primary)' : 'var(--text-muted)';
        const memberText = isJoined ? `Membro • ${club.members}` : `${club.members} Membros`;

        const div = document.createElement('div');
        div.className = 'club-item click-shrink';
        div.onclick = () => toggleJoinClub(div, club.id);
        div.innerHTML = `
            <div class="club-icon" style="background: ${club.color};"><i class="ph-fill ${club.icon}"></i></div>
            <div class="club-info"><h4>${club.name}</h4><span class="member-status">${memberText}</span></div>
            <i class="ph-fill ${statusIcon} status-icon" style="color: ${statusColor}; margin-left: auto;"></i>
        `;
        container.appendChild(div);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'club-item click-shrink add-club';
    addBtn.onclick = openClubModal;
    addBtn.innerHTML = `<div class="club-icon"><i class="ph ph-plus"></i></div><span>Criar Novo Clube</span>`;
    container.appendChild(addBtn);
}

function setupClubModalLogic() {
    const icons = document.querySelectorAll('.icon-option');
    const colors = document.querySelectorAll('.color-dot');
    let selectedIcon = 'ph-sword';
    let selectedColor = '#eab308';

    icons.forEach(btn => btn.onclick = () => {
        icons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedIcon = btn.getAttribute('data-icon');
    });

    colors.forEach(btn => btn.onclick = () => {
        colors.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.getAttribute('data-color');
    });

    const form = document.getElementById('createClubForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('clubName');
            const name = nameInput.value;

            if (name) {
                const newClub = {
                    id: Date.now(),
                    name: name,
                    members: "1",
                    icon: selectedIcon,
                    color: selectedColor
                };
                clubsData.push(newClub);
                localStorage.setItem('bibliotheca_clubs_data', JSON.stringify(clubsData));

                joinedClubs.push(newClub.id);
                localStorage.setItem('bibliotheca_joined_clubs', JSON.stringify(joinedClubs));

                renderClubs();
                closeClubModal();
                showToast(`Clube "${name}" criado!`);
            }
        });
    }
}

window.toggleJoinClub = function (element, id) {
    const isJoined = joinedClubs.includes(id);
    const statusText = element.querySelector('.member-status');
    const icon = element.querySelector('.status-icon');

    if (isJoined) {
        joinedClubs = joinedClubs.filter(c => c !== id);
        icon.classList.replace('ph-check-circle', 'ph-plus-circle');
        icon.style.color = 'var(--text-muted)';
        statusText.innerText = statusText.innerText.replace('Membro • ', '');
        showToast('Você saiu do clube.');
    } else {
        joinedClubs.push(id);
        icon.classList.replace('ph-plus-circle', 'ph-check-circle');
        icon.style.color = 'var(--primary)';
        statusText.innerText = 'Membro • ' + statusText.innerText;
        showToast('Bem-vindo ao clube!');
    }
    localStorage.setItem('bibliotheca_joined_clubs', JSON.stringify(joinedClubs));
};

function setupPostCreation() {
    const btn = document.getElementById('btnSubmitPost');
    const input = document.getElementById('postInput');
    if (btn && input) {
        const createPost = () => {
            const text = input.value.trim();
            if (!text) return;
            const newPost = {
                id: Date.now(), user: "Leitor Voraz", avatar: "https://i.pravatar.cc/150?img=68",
                time: "Agora mesmo", book: "Geral", content: text, likes: 0, comments: [], timestamp: Date.now(), isLiked: false
            };
            feedData.unshift(newPost);
            saveFeed();
            if (currentFilter === 'hot') document.querySelector('[data-filter="new"]').click();
            else renderFeed();
            input.value = '';
            showToast('Publicação enviada!');
        };
        btn.addEventListener('click', createPost);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') createPost(); });
    }
}

window.toggleLike = function (element, id) {
    const post = feedData.find(p => p.id === id);
    if (post) {
        post.isLiked = !post.isLiked;
        post.likes += post.isLiked ? 1 : -1;
        saveFeed();
        const icon = element.querySelector('i');
        const countSpan = element.querySelector('span');
        if (post.isLiked) { element.classList.add('liked'); icon.classList.replace('ph', 'ph-fill'); }
        else { element.classList.remove('liked'); icon.classList.replace('ph-fill', 'ph'); }
        countSpan.innerText = post.likes;
    }
};

window.deletePost = function (id) {
    if (confirm("Apagar esta publicação?")) {
        feedData = feedData.filter(p => p.id !== id);
        saveFeed();
        renderFeed();
        showToast('Publicação removida.');
    }
}

const clubModal = document.getElementById('createClubModal');
window.openClubModal = function () { clubModal.classList.add('open'); };
window.closeClubModal = function () { clubModal.classList.remove('open'); document.getElementById('createClubForm').reset(); };
window.focusPostInput = function () { document.getElementById('postInput').focus(); };
function saveFeed() { localStorage.setItem('bibliotheca_feed', JSON.stringify(feedData)); }
function showToast(msg) { const t = document.getElementById('toast'); t.querySelector('span').innerText = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
function setupFilters() {
    document.querySelectorAll('.filter-pill').forEach(p => p.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(x => x.classList.remove('active'));
        p.classList.add('active'); currentFilter = p.getAttribute('data-filter'); renderFeed();
    }));
}
function restoreEvents() {
    document.querySelectorAll('.event-card .btn-bell').forEach((btn, index) => {
        const id = index; btn.setAttribute('onclick', `toggleReminder(this, ${id})`);
        if (eventReminders.includes(id)) { btn.classList.add('active'); btn.querySelector('i').classList.replace('ph', 'ph-fill'); }
    });
}
window.toggleReminder = function (btn, id) {
    const isActive = btn.classList.contains('active'); const icon = btn.querySelector('i');
    if (isActive) { eventReminders = eventReminders.filter(e => e !== id); btn.classList.remove('active'); icon.classList.replace('ph-fill', 'ph'); showToast('Lembrete removido.'); }
    else { eventReminders.push(id); btn.classList.add('active'); icon.classList.replace('ph', 'ph-fill'); showToast('Lembrete definido!'); }
    localStorage.setItem('bibliotheca_events', JSON.stringify(eventReminders));
};

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
    document.body.addEventListener('mouseover', (e) => { if (e.target.closest('a, button, .click-shrink, .post-card, .club-item')) document.body.classList.add('hovering'); else document.body.classList.remove('hovering'); });
}
function initSpotlightEffect() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.addEventListener('mousemove', (e) => {
        const target = e.target.closest('.spotlight-item');
        if (target) { const rect = target.getBoundingClientRect(); target.style.setProperty('--x', `${e.clientX - rect.left}px`); target.style.setProperty('--y', `${e.clientY - rect.top}px`); }
    });
}
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn'); const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay'); const closeBtn = document.querySelector('.close-sidebar-btn');
    function toggle() { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); }
    if (btn) btn.onclick = toggle; if (closeBtn) closeBtn.onclick = toggle; if (overlay) overlay.onclick = toggle;
}