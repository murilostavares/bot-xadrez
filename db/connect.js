import mongoose from "mongoose";
let isClosing = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "[MongoDB] ERRO: Variável MONGODB_URI não definida no ambiente."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("[MongoDB] Conectado com sucesso!");

    mongoose.connection.on("error", (err) =>
      console.error(`[MongoDB] Erro na conexão: ${err}`)
    );

    mongoose.connection.on("disconnected", () => {
      if (!isClosing) {
        console.warn("[MongoDB] Conexão perdida. Tentando reconectar...");
      }
    });
  } catch (error) {
    console.error(`[MongoDB] Falha ao conectar: ${error.message}`);
    process.exit(1);
  }
}

export const db = mongoose.connection;

export async function closeDB() {
  isClosing = true;
  await db.close();
  console.log("[MongoDB] Conexão fechada com sucesso.");
}
