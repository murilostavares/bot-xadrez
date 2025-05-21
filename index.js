import "dotenv/config"; // Simplifica o carregamento do .env
import mongoose from "mongoose"; // Para desconectar o MongoDB ao encerrar
import path from "path";

// Carrega variáveis de ambiente com fallback
const envPath = path.resolve(process.cwd(), ".env");
if (!process.env.PLATFORMS) {
  console.warn(
    "⚠️ Variável PLATFORMS não encontrada no .env. Usando padrão: telegram"
  );
}

// Lista de plataformas a serem inicializadas
const platforms = (process.env.PLATFORMS || "telegram")
  .split(",")
  .map((p) => p.trim());

// Mapeamento de plataformas para seus arquivos de bot
const platformMap = {
  telegram: "./platforms/telegram/bot.js",
  whatsapp: "./platforms/whatsapp/bot.js",
};

// Array para armazenar instâncias dos bots
const bots = [];

async function initializeBots() {
  if (platforms.length === 0) {
    throw new Error("Nenhuma plataforma válida fornecida para inicialização.");
  }

  for (const platform of platforms) {
    if (!platformMap[platform]) {
      console.warn(`Plataforma ${platform} não suportada. Ignorando...`);
      continue;
    }

    try {
      const platformModule = await import(platformMap[platform]);
      const botInstance = platformModule.default;
      bots.push({ platform, instance: botInstance });
    } catch (error) {
      console.error(
        `Erro ao inicializar o bot para a plataforma ${platform}:`,
        error
      );
    }
  }

  if (bots.length === 0) {
    throw new Error("Nenhum bot foi inicializado com sucesso.");
  }
}

// Função principal para iniciar o sistema
async function start() {
  try {
    // Conectar ao MongoDB
    const { connectDB } = await import("./bot/db/connect.js");
    await connectDB();
    console.log("✅ Conectado ao MongoDB");

    // Inicializar bots
    await initializeBots();
    bots.forEach(({ platform, instance }) => {
      instance.launch();
      console.log(`✅ Bot iniciado na plataforma: ${platform}`);
    });
    console.log(
      `🚀 Sistema iniciado com sucesso às ${new Date().toLocaleString()}`
    );
  } catch (error) {
    console.error("❌ Erro ao iniciar o sistema:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

start();

// Tratamento de encerramento para todos os bots
async function shutdown(signal) {
  console.log(`\n📢 Recebido ${signal}. Encerrando bots...`);
  bots.forEach(({ platform, instance }) => {
    console.log(`Encerrando bot na plataforma ${platform}...`);
    instance.stop(signal);
  });
  await mongoose.connection.close();
  console.log("✅ Conexão com MongoDB encerrada.");
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
