import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors({
    origin: "*"
}));

// Listando as APIs
app.get("/", (req, res) => {
    res.send("API Rodando");
});

export default app;