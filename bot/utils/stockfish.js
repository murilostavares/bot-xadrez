import { exec } from "child_process";
import { promisify } from "util";
const execPromise = promisify(exec);

export async function testStockfish() {
  try {
    const { stdout, stderr } = await execPromise("stockfish");
    if (stderr) {
      console.error("Erro ao executar o Stockfish:", stderr);
      return "Erro ao executar o Stockfish.";
    }
    return stdout.includes("Stockfish")
      ? "Stockfish está funcionando!"
      : "Stockfish não respondeu como esperado.";
  } catch (error) {
    console.error("Erro ao testar o Stockfish:", error);
    return "Falha ao testar o Stockfish.";
  }
}
