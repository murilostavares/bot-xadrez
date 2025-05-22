import { Chess } from "chess.js";

export class GameEngine {
  constructor(fen) {
    console.log("Inicializando GameEngine com FEN:", fen);
    this.chess = new Chess(fen);
    this.initialFen = fen;
    console.log("Métodos disponíveis em chess:", Object.keys(this.chess));
  }

  // Valida o FEN
  validateFen(fen) {
    try {
      console.log("Validando FEN:", fen);
      // Tenta usar o método validateFen do chess.js
      if (typeof this.chess.validateFen === "function") {
        const validation = this.chess.validateFen(fen);
        console.log("Resultado da validação do FEN:", validation);
        return {
          valid: validation.valid,
          error: validation.error || "No errors.",
        };
      }

      // Fallback: Validação manual simples
      console.log("Usando fallback para validação do FEN");
      const chessTemp = new Chess();
      chessTemp.load(fen);
      return { valid: true, error: "No errors." };
    } catch (error) {
      console.error("Erro ao validar FEN:", error.message);
      return { valid: false, error: error.message };
    }
  }

  // Valida e aplica um movimento em notação SAN
  applyMove(sanMove) {
    console.log("Aplicando movimento SAN:", sanMove);
    const move = this.chess.move(sanMove, { strict: true });
    if (!move) {
      throw new Error("Movimento inválido ou ilegal.");
    }
    return move;
  }

  // Obtém o FEN atualizado
  getFen() {
    const fen = this.chess.fen();
    console.log("FEN obtido:", fen);
    return fen;
  }

  // Converte um movimento UCI para SAN
  getSanMove(uciMove) {
    console.log("Convertendo movimento UCI para SAN:", uciMove);
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
    console.log("Gerando PGN com movimentos:", moves);
    const pgn = generatePGN({
      moves,
      whitePlayer,
      blackPlayer,
      level,
      result,
      date,
    });
    console.log("PGN gerado:", pgn);
    return pgn;
  }
}
