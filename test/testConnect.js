import dotenv from "dotenv";
import path from "path";
import { connectDB, closeDB, db } from "../db/connect.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testConnection() {
  try {
    await connectDB();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (db.readyState === 1) {
      console.log("[Teste] MongoDB está conectado e pronto!");
    } else {
      console.warn(
        "[Teste] MongoDB não está totalmente conectado. Estado:",
        db.readyState
      );
    }

    await closeDB();
  } catch (error) {
    console.error("[Teste] Erro na conexão MongoDB:", error);
  }
}

testConnection();
