// D:\Desenv\bot-xadrez\bot\services\game-engine.js
import { Chess } from "chess.js";

export class GameEngine {
  constructor(fen) {
    this.chess = new Chess(fen);
  }

  validateFen(fen) {
    try {
      new Chess(fen);
      return { valid: true, error: null };
    } catch (error) {
      console.error(`Erro ao validar FEN: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  applyMove(sanMove) {
    const move = this.chess.move(sanMove);
    return move; // Retorna null se inválido
  }

  getFen() {
    return this.chess.fen();
  }

  getSanMove(uciMove) {
    const move = this.chess.move({
      from: uciMove.slice(0, 2),
      to: uciMove.slice(2),
    });
    if (move) {
      const san = move.san;
      this.chess.undo(); // Desfaz o movimento para restaurar o estado do tabuleiro
      return san;
    }
    return null;
  }

  isCheckmate() {
    return this.chess.isCheckmate();
  }

  generatePgn(moves, whitePlayer, blackPlayer, level) {
    const game = new Chess();
    game.load(this.chess.fen());
    moves.forEach((move) => {
      if (move.includes("=")) {
        const sanMove = this.getSanMove(move) || move;
        game.move(sanMove);
      } else {
        game.move(move);
      }
    });
    const headers = {
      Event: "Casual Game",
      Site: "Telegram",
      Date: new Date().toISOString().split("T")[0],
      Round: "1",
      White: whitePlayer,
      Black: blackPlayer,
      Result: this.chess.isCheckmate() ? "1-0" : "*",
      Level: level,
    };
    Object.entries(headers).forEach(([key, value]) =>
      game.setHeader(key, value)
    );
    const headerText = Object.entries(game.getHeaders())
      .map(([key, value]) => `${key} "${value}"`)
      .join("\n");
    return {
      text: game.pgn(),
      formatted: `${headerText}\n\n${game.pgn()}`,
    };
  }
}
