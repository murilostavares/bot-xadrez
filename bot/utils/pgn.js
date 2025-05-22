import { Chess } from "chess.js";

// Função para formatar a data no formato PGN (ex.: [Date "2025.05.21"])
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function generatePGN({
  moves = [],
  whitePlayer = "Player",
  blackPlayer = "ChessBot",
  level = 10,
  result = "*",
  date = new Date(),
} = {}) {
  try {
    const game = new Chess();

    // Aplicar os movimentos
    for (const move of moves) {
      if (!/^[a-h][1-8][a-h][1-8]$/.test(move)) {
        throw new Error(`Movimento inválido: ${move}`);
      }
      game.move({ from: move.slice(0, 2), to: move.slice(2, 4) });
    }

    // Configurar metadados do PGN
    game.header("Event", "Casual Game");
    game.header("Site", "Telegram");
    game.header("Date", formatDate(date));
    game.header("Round", "1");
    game.header("White", whitePlayer);
    game.header("Black", blackPlayer);
    game.header("Result", result);
    game.header("Level", level.toString());

    // Gerar o PGN completo
    const fullPgn = game.pgn();

    // Extrair apenas a notação dos movimentos (remover metadados para exibição inline)
    const movesOnly = fullPgn
      .split("\n")
      .filter((line) => !line.startsWith("["))
      .join("")
      .trim();

    return {
      text: movesOnly, // Apenas os movimentos (ex.: 1. e4 e5)
      formatted: `[Event "Casual Game"]\n[Site "Telegram"]\n[Date "${formatDate(
        date
      )}"]\n[Round "1"]\n[White "${whitePlayer}"]\n[Black "${blackPlayer}"]\n[Result "${result}"]\n[Level "${level}"]\n\n${fullPgn}`, // PGN completo para exportação
    };
  } catch (error) {
    console.error("Erro ao gerar PGN:", error);
    return {
      text: "",
      formatted: "Erro ao gerar PGN: " + error.message,
    };
  }
}
