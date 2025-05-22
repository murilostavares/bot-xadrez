import Chess from "chess.js";

export class GameEngine {
  constructor(fen) {
    this.chess = new Chess(fen);
    this.initialFen = fen;
  }

  // Valida o FEN
  validateFen(fen) {
    try {
      // Tenta usar o método validateFen do chess.js
      if (typeof this.chess.validateFen === "function") {
        const validation = this.chess.validateFen(fen);
        return {
          valid: validation.valid,
          error: validation.error || "No errors.",
        };
      }

      // Fallback: Validação manual simples
      const chessTemp = new Chess();
      chessTemp.load(fen);
      return { valid: true, error: "No errors." };
    } catch (error) {
      return { valid: false, error: error.message };
    }
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
