(function () {
    const API_ENDPOINTS = {
        books: 'http://localhost:3000/livros',
        users: 'http://localhost:3000/usuarios',
        loans: 'http://localhost:3000/emprestimos'
    };

    const counts = {
        books: 0,
        users: 0,
        loans: 0
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

    const updatePills = () => {
        const links = Array.from(document.querySelectorAll('.menu .item, .admin-menu a.menu-link, .admin-menu a'));
        links.forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (href.includes('books')) ensurePill(link, 'books');
            if (href.includes('users')) ensurePill(link, 'users');
            if (href.includes('loans')) ensurePill(link, 'loans');
        });
    };

    const fetchCounts = async () => {
        try {
            const [booksRes, usersRes, loansRes] = await Promise.all([
                fetch(API_ENDPOINTS.books),
                fetch(API_ENDPOINTS.users),
                fetch(API_ENDPOINTS.loans)
            ]);

            const [booksData, usersData, loansData] = await Promise.all([
                booksRes.json(),
                usersRes.json(),
                loansRes.json()
            ]);

            counts.books = Array.isArray(booksData) ? booksData.length : 0;
            counts.users = Array.isArray(usersData) ? usersData.length : 0;
            counts.loans = Array.isArray(loansData) ? loansData.length : 0;

            updatePills();
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
        }
    };

    fetchCounts();
})();
