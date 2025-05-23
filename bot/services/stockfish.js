// D:\Desenv\bot-xadrez\bot\services\stockfish.js
import { spawn } from "child_process";
import { platform } from "os";
import { join } from "path";
import fs from "fs";

export class Stockfish {
  static async getBestMove(fen, level = 10) {
    const osPlatform = platform();
    let stockfishPath;

    if (osPlatform === "win32") {
      stockfishPath = join(
        process.cwd(),
        "stockfish",
        "stockfish-windows-x86-64.exe"
      );
    } else if (osPlatform === "linux") {
      stockfishPath = join(process.cwd(), "stockfish", "stockfish-linux-armv8");
    } else {
      throw new Error(`Plataforma não suportada: ${osPlatform}`);
    }

    // Verificar se o binário existe e é executável
    if (!fs.existsSync(stockfishPath)) {
      throw new Error(
        `Binário do Stockfish não encontrado em: ${stockfishPath}`
      );
    }
    try {
      fs.accessSync(stockfishPath, fs.constants.X_OK);
    } catch (err) {
      throw new Error(
        `Binário do Stockfish em ${stockfishPath} não é executável`
      );
    }
    console.log(`Usando binário do Stockfish: ${stockfishPath}`);

    const stockfish = spawn(stockfishPath, [], { shell: true });
    let bestMove = null;

    const commands = [
      "uci",
      `setoption name Skill Level value ${level}`,
      `position fen ${fen}`,
      "go movetime 3000 depth 10", // 3 segundos e profundidade 10
    ];
    commands.forEach((cmd) => stockfish.stdin.write(`${cmd}\n`));
    stockfish.stdin.end();

    return new Promise((resolve, reject) => {
      stockfish.stdout.on("data", (data) => {
        const output = data.toString();
        const match = output.match(/bestmove (\w+)/);
        if (match) {
          bestMove = match[1];
          if (bestMove === "(none)") {
            bestMove = null; // Xeque-mate ou sem movimentos
          }
          resolve(bestMove);
        }
      });

      stockfish.stderr.on("data", (data) => {
        console.error("Erro do Stockfish:", data.toString());
      });

      stockfish.on("close", (code) => {
        if (code !== 0) {
          console.error(`Stockfish encerrado com código: ${code}`);
        }
        resolve(bestMove || "e7e5"); // Movimento fallback
      });

      stockfish.on("error", (err) => {
        console.error("Erro ao executar o Stockfish:", err.message);
        reject(err);
      });

      setTimeout(() => {
        console.log("Timeout atingido, encerrando Stockfish...");
        stockfish.kill();
      }, 5000); // Timeout de 5 segundos
    });
  }
}
