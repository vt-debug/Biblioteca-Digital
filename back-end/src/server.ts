import app from "./app";

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
    console.log(`Servidor iniciando na porta ${porta} 🚀`);
});