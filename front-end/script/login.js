const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

// Quando clicar em "Criar Conta" (no painel colorido)
registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

// Quando clicar em "Fazer Login" (no painel colorido)
loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

// Redirecionamento real nos botões de submit
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // Seleciona o botão que foi clicado dentro deste form
        const submitBtn = form.querySelector('button');
        const originalText = submitBtn.innerText;

        submitBtn.innerText = "Processando...";
        submitBtn.style.opacity = "0.8";

        // Simula o tempo de login
        setTimeout(() => {
            window.location.href = 'home.html'; // Redireciona
        }, 1000);
    });
});

// Se clicar no botão de "Entrar" ou "Cadastrar" (type button)
// Adicionei isso pois no HTML usei type="button" para evitar submit automático sem querer
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