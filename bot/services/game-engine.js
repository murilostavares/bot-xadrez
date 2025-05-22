import { Chess } from "chess.js";
import { generatePGN } from "../utils/pgn.js";

export class GameEngine {
  constructor(fen) {
    this.chess = new Chess(fen);
  }

  // Valida e aplica um movimento em notação SAN
  applyMove(sanMove) {
    const move = this.chess.move(sanMove, { strict: true });
    if (!move) {
      throw new Error("Movimento inválido ou ilegal.");
    }
    return move;
  }

  // Obtém o FEN atualizado
  getFen() {
    return this.chess.fen();
  }

  // Converte um movimento UCI para SAN
  getSanMove(uciMove) {
    const move = this.chess.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2, 4),
    });
    this.chess.undo(); // Desfaz para não alterar o estado
    return move ? move.san : null;
  }

  // Gera o PGN com base nos movimentos
  generatePgn(
    moves,
    whitePlayer,
    blackPlayer,
    level,
    result = "*",
    date = new Date()
  ) {
    return generatePGN({
      moves,
      whitePlayer,
      blackPlayer,
      level,
      result,
      date,
    });
  }
}
