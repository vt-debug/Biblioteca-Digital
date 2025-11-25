(function () {
    const BOOKS_KEY = 'bibliotheca_books_db';
    const USERS_KEY = 'bibliotheca_users_db';
    const LOANS_KEY = 'bibliotheca_loans_db';

    const getList = (key) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    const books = getList(BOOKS_KEY);
    const users = getList(USERS_KEY);
    const loans = getList(LOANS_KEY);

    const counts = {
        books: books.length,
        users: users.length,
        loans: loans.length
    };

    const ensurePill = (link, key) => {
        if (!link) return;
        let pill = link.querySelector('[data-count]') || link.querySelector('.pill');
        if (!pill) {
            pill = document.createElement('span');
            pill.className = 'pill';
            link.appendChild(pill);
        }
        pill.dataset.count = key;
        pill.textContent = counts[key] ?? 0;
        pill.style.borderRadius = '999px';
        pill.style.padding = '4px 8px';
        pill.style.marginLeft = 'auto';
        pill.style.background = 'rgba(255, 255, 255, 0.08)';
        pill.style.color = 'inherit';
        pill.style.fontSize = '0.72rem';
        pill.style.display = 'inline-flex';
        pill.style.alignItems = 'center';
        pill.style.gap = '6px';

        let dot = pill.querySelector('.pill-dot');
        if (!dot) {
            dot = document.createElement('span');
            dot.className = 'pill-dot';
            pill.prepend(dot);
        }
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.borderRadius = '50%';
        dot.style.background = '#fff';
        dot.style.opacity = '0.75';
    };

    const links = Array.from(document.querySelectorAll('.menu .item, .admin-menu a.menu-link, .admin-menu a'));
    links.forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (href.includes('books')) ensurePill(link, 'books');
        if (href.includes('users')) ensurePill(link, 'users');
        if (href.includes('loans')) ensurePill(link, 'loans');
    });
})();
