import express from "express";
import cors from "cors";
import UsuariosRoutes from "./routes/UsuariosRoutes";

const app = express();

app.use(express.json());
app.use(cors({
    origin: "*"
}));


app.use("/usuarios", UsuariosRoutes);


export default app;