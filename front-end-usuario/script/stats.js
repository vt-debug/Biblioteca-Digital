document.addEventListener('DOMContentLoaded', () => {
    applyGlobalPreferences();
    initUI();
    loadStats();
    generateHeatmap();
    initFilterLogic();
    renderDonutChart();
});

function applyGlobalPreferences() {
    const isDark = localStorage.getItem('bibliotheca_darkmode') === 'true';
    if (isDark) document.documentElement.classList.add('dark-mode');
    const cursorPref = localStorage.getItem('bibliotheca_cursor');
    if (cursorPref === 'false') document.documentElement.classList.add('no-custom-cursor');
    const savedAvatar = localStorage.getItem('bibliotheca_avatar');
    if (savedAvatar) document.querySelectorAll('.avatar').forEach(img => img.src = savedAvatar);
}

const chartData = {
    year: [
        { label: 'Jan', val: 3 }, { label: 'Fev', val: 5 }, { label: 'Mar', val: 2 },
        { label: 'Abr', val: 7 }, { label: 'Mai', val: 4 }, { label: 'Jun', val: 6 },
        { label: 'Jul', val: 3 }, { label: 'Ago', val: 8 }, { label: 'Set', val: 5 },
        { label: 'Out', val: 4 }, { label: 'Nov', val: 6 }, { label: 'Dez', val: 2 }
    ],
    month: [
        { label: 'Sem 1', val: 1 }, { label: 'Sem 2', val: 2 }, { label: 'Sem 3', val: 1 },
        { label: 'Sem 4', val: 3 }
    ],
    week: [
        { label: 'Seg', val: 20 }, { label: 'Ter', val: 45 }, { label: 'Qua', val: 10 },
        { label: 'Qui', val: 60 }, { label: 'Sex', val: 30 }, { label: 'Sáb', val: 90 }, { label: 'Dom', val: 50 }
    ]
};

const donutData = [
    { label: "Ficção", value: 40, color: "var(--primary)" },
    { label: "Romance", value: 30, color: "#ef4444" },
    { label: "Sci-Fi", value: 20, color: "#3b82f6" },
    { label: "Outros", value: 10, color: "#8b5cf6" }
];

function loadStats() {
    const books = JSON.parse(localStorage.getItem('bibliotheca_books')) || [];
    const totalBooks = books.length;
    let totalPages = 0;
    books.forEach(b => totalPages += (parseInt(b.pages) || 300));

    animateNumber('totalReadCount', totalBooks, 1500);
    animateNumber('totalPagesCount', totalPages, 2000);

    renderChart('year');
}

function initFilterLogic() {
    const btns = document.querySelectorAll('.period-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const period = btn.getAttribute('data-period');
            renderChart(period);

            const label = period === 'year' ? 'Mensal' : period === 'month' ? 'Semanal' : 'Diária';
            document.getElementById('chartPeriodLabel').innerText = label;
        });
    });
}

function renderChart(period) {
    const container = document.getElementById('barChart');
    if (!container) return;

    container.innerHTML = '';

    const data = chartData[period];
    const maxVal = Math.max(...data.map(d => d.val));

    data.forEach((item, index) => {
        let heightPercent = (item.val / maxVal) * 90;
        if (heightPercent < 5) heightPercent = 5;

        const col = document.createElement('div');
        col.className = 'bar-col';
        col.innerHTML = `
            <div class="bar" style="height: 0%;" data-val="${item.val}" data-h="${heightPercent}%"></div>
            <span>${item.label}</span>
        `;
        container.appendChild(col);

        setTimeout(() => {
            col.querySelector('.bar').style.height = heightPercent + '%';
        }, 100 + (index * 100));
    });
}

function renderDonutChart() {
    const container = document.getElementById('donutChartContainer');
    if (!container) return;

    let svgHTML = `
        <div class="donut-svg-wrapper">
            <svg class="donut-svg" viewBox="0 0 36 36">
    `;

    let offset = 0;
    donutData.forEach(data => {
        const dashArray = `${data.value} 100`;

        svgHTML += `
            <circle class="donut-segment" cx="18" cy="18" r="15.9155" fill="transparent" 
            stroke="${data.color}" stroke-dasharray="${dashArray}" stroke-dashoffset="-${offset}"></circle>
        `;
        offset += data.value;
    });

    svgHTML += `
            </svg>
            <div class="donut-center-text">
                <span>Top</span>
                <strong>Ficção</strong>
            </div>
        </div>
        <div class="donut-legend">
            ${donutData.map(d => `
                <div class="legend-item">
                    <div class="legend-color"><span class="dot" style="background:${d.color}"></span> ${d.label}</div>
                    <span class="legend-percent">${d.value}%</span>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = svgHTML;
}

function animateNumber(id, endValue, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    let startValue = 0;
    let startTime = null;

    function step(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const current = Math.floor(easeProgress * (endValue - startValue) + startValue);
        el.innerText = current.toLocaleString();

        if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}

function generateHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    const days = 200;
    let html = '';
    for (let i = 0; i < days; i++) {
        const rand = Math.random();
        let level = '';
        if (rand > 0.9) level = 'l4';
        else if (rand > 0.75) level = 'l3';
        else if (rand > 0.55) level = 'l2';
        else if (rand > 0.35) level = 'l1';

        html += `<div class="heat-box ${level}"></div>`;
    }
    grid.innerHTML = html;
}

function initUI() {
    initCursor(); initSpotlightEffect(); initMobileMenu();
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.animationPlayState = 'running'; observer.unobserve(entry.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-enter').forEach(el => { el.style.animationPlayState = 'paused'; observer.observe(el); });
}

function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const dot = document.querySelector('.cursor-dot'); const outline = document.querySelector('.cursor-outline');
    if (!dot) return;
    window.addEventListener('mousemove', (e) => {
        dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`;
        outline.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 400, fill: "forwards" });
    });
    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .click-shrink, .bar, .heat-box')) document.body.classList.add('hovering');
        else document.body.classList.remove('hovering');
    });
}
function initSpotlightEffect() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    document.addEventListener('mousemove', (e) => {
        const target = e.target.closest('.spotlight-item');
        if (target) {
            const rect = target.getBoundingClientRect();
            target.style.setProperty('--x', `${e.clientX - rect.left}px`);
            target.style.setProperty('--y', `${e.clientY - rect.top}px`);
        }
    });
}
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn'); const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('sidebarOverlay'); const closeBtn = document.querySelector('.close-sidebar-btn');
    function toggle() { sidebar.classList.toggle('active'); overlay.classList.toggle('active'); }
    if (btn) btn.onclick = toggle; if (closeBtn) closeBtn.onclick = toggle; if (overlay) overlay.onclick = toggle;
}