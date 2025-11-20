const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button');
        const originalText = submitBtn.innerText;

        submitBtn.innerText = "Processando...";
        submitBtn.style.opacity = "0.8";

        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1000);
    });
});

const actionBtns = document.querySelectorAll('.form-container button');
actionBtns.forEach(btn => {
    if (!btn.classList.contains('hidden')) {
        btn.addEventListener('click', () => {
            btn.innerText = "Processando...";
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        });
    }
});