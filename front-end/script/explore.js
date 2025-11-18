document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initSpotlightEffect();
    initScrollAnimations();
    initStickyHeader();
    initMobileMenu();

    initCinematicCarousel();
    init3DTilt();
    initDragScroll();
});

function initDragScroll() {
    const sliders = document.querySelectorAll('.drag-scroll, .bento-grid');
    sliders.forEach(slider => {
        let isDown = false;
        let startX;
        let scrollLeft;
        slider.addEventListener('mousedown', (e) => {
            isDown = true; slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'grab'; });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return; e.preventDefault();
            const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
    });
}

function initCinematicCarousel() {
    const slides = document.querySelectorAll('.c-slide');
    const dots = document.querySelectorAll('.c-dot');
    if (slides.length === 0) return;

    let current = 0;
    let timer;

    const show = (idx) => {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        current = (idx >= slides.length) ? 0 : (idx < 0 ? slides.length - 1 : idx);
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    };

    const next = () => show(current + 1);
    const start = () => timer = setInterval(next, 7000);
    const stop = () => clearInterval(timer);

    window.goToSlide = (i) => { stop(); show(i); start(); };

    const container = document.getElementById('heroCarousel');
    if (container) {
        container.addEventListener('mouseenter', stop);
        container.addEventListener('mouseleave', start);
    }
    start();
}

function init3DTilt() {
    const cards = document.querySelectorAll('.tilt-element, .ranking-card');
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

window.scrollRow = function (id, amount) {
    const el = document.getElementById(id);
    if (el) el.scrollBy({ left: amount, behavior: 'smooth' });
};

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
    document.querySelectorAll('.spotlight-item').forEach(el => {
        el.onmousemove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            el.style.setProperty('--x', `${x}px`); el.style.setProperty('--y', `${y}px`);
        };
    });
}
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.animationPlayState = 'running'; observer.unobserve(entry.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-enter').forEach(el => { el.style.animationPlayState = 'paused'; observer.observe(el); });
}
function initStickyHeader() {
    const header = document.querySelector('.top-bar');
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
    if (btn) btn.onclick = toggle;
    if (closeBtn) closeBtn.onclick = toggle;
    if (overlay) overlay.onclick = toggle;
}