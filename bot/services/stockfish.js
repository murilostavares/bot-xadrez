import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

export class Stockfish {
  static async getBestMove(fen, level, movetime = 1000) {
    const stockfishCommands = [
      `uci`,
      `setoption name Skill Level value ${level}`,
      `position fen ${fen}`,
      `go movetime ${movetime}`,
    ].join("\n");

    const { stdout, stderr } = await execPromise(
      `echo "${stockfishCommands}" | stockfish`
    );
    if (stderr) {
      throw new Error("Erro ao executar o Stockfish: " + stderr);
    }

    const lines = stdout.split("\n");
    const bestMoveLine = lines.find((line) => line.startsWith("bestmove"));
    if (!bestMoveLine) {
      throw new Error(
        "Não consegui determinar o melhor movimento do Stockfish."
      );
    }

    return bestMoveLine.split(" ")[1]; // Retorna o movimento em UCI
  }
}
