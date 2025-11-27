import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("❌ Erro: VITE_SUPABASE_URL ou SUPABASE_URL não definida no .env");
}

if (!supabaseServiceKey) {
    console.error("❌ ERRO CRÍTICO: SUPABASE_SERVICE_ROLE_KEY está faltando no arquivo .env");
    console.error("👉 Vá em Project Settings > API > service_role key no Supabase e adicione ao seu .env");
} else {
    console.log("✅ Supabase Service Key carregada (Backend Mode)");
}

// O '!' força o TS a aceitar, mas o log acima avisa se for undefined
const supabase = createClient(supabaseUrl, supabaseServiceKey || "");

export default supabase;
