import app from "./app";
import router from "./routes/chatbot";

app.use("/chatbot", router);

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
    console.log(`Servidor iniciando na porta ${porta} 🚀`);
});
