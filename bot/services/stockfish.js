// D:\Desenv\bot-xadrez\bot\services\stockfish.js
import { spawn } from "child_process";
import { platform } from "os";
import { join } from "path";

export class Stockfish {
  static async getBestMove(fen, level, movetime = 2000) {
    // Aumentado para 2000ms
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

    console.log(`Usando binário do Stockfish: ${stockfishPath}`);

    const stockfish = spawn(stockfishPath, [], { shell: true });
    let bestMove = null;

    // Enviar comandos ao Stockfish
    const commands = [
      "uci",
      `setoption name Skill Level value ${level}`, // Definir nível primeiro
      `position fen ${fen}`,
      `go movetime ${movetime} depth 5`, // Adicionar depth mínimo de 5
    ];
    commands.forEach((cmd) => stockfish.stdin.write(`${cmd}\n`));
    stockfish.stdin.end();

    return new Promise((resolve, reject) => {
      stockfish.stdout.on("data", (data) => {
        const output = data.toString();
        const match = output.match(/bestmove (\w+)/);
        if (match) {
          bestMove = match[1];
          console.log("Melhor movimento encontrado:", bestMove);
        }
      });

      stockfish.stderr.on("data", (data) => {
        console.error("Erro do Stockfish:", data.toString());
      });

      stockfish.on("close", (code) => {
        console.log(`Stockfish encerrado com código: ${code}`);
        if (bestMove) {
          resolve(bestMove);
        } else {
          reject(
            new Error(
              "Não consegui determinar o melhor movimento do Stockfish."
            )
          );
        }
      });

      stockfish.on("error", (err) => {
        console.error("Erro ao executar o Stockfish:", err.message);
        reject(err);
      });

      setTimeout(() => {
        console.log("Timeout atingido, encerrando Stockfish...");
        stockfish.kill();
      }, 3000); // Aumentar timeout para 3 segundos
    });
  }
}
