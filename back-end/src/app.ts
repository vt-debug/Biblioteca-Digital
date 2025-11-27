import express from "express";
import cors from "cors";
import UsuariosRoutes from "./routes/UsuariosRoutes";
import LivrosRoutes from "./routes/LivrosRoutes";

const app = express();

app.use(express.json());
app.use(cors({
    origin: "*"
}));

app.use("/usuarios", UsuariosRoutes);
app.use("/livros", LivrosRoutes);

export default app;