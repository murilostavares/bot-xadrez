// test/testConnect.js
import dotenv from "dotenv";
import path from "path";
import { connectDB, closeDB, db } from "../db/connect.js";

dotenv.config({ path: path.resolve(".env") });

async function testConnection() {
  try {
    await connectDB();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    switch (db.readyState) {
      case 0:
        console.warn("[Teste] Desconectado.");
        break;
      case 1:
        console.log("[Teste] MongoDB está conectado e pronto!");
        break;
      case 2:
        console.log("[Teste] Conectando ao MongoDB...");
        break;
      case 3:
        console.error("[Teste] Conexão encerrando...");
        break;
      default:
        console.warn("[Teste] Estado desconhecido:", db.readyState);
    }

    await closeDB();
  } catch (error) {
    console.error("[Teste] Erro na conexão MongoDB:", error);
  }
}

testConnection();
