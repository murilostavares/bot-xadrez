// D:\Desenv\bot-xadrez\bot\services\game-engine.js
import { Chess } from "chess.js";

export class GameEngine {
  constructor(fen) {
    // console.log("Inicializando GameEngine com Chess:", Chess);
    this.chess = new Chess(fen);
    // console.log("Instância chess criada:", this.chess);
  }

  validateFen(fen) {
    try {
      new Chess(fen);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  applyMove(sanMove) {
    return this.chess.move(sanMove);
  }

  getFen() {
    return this.chess.fen();
  }

  getSanMove(uciMove) {
    const move = this.chess.move(uciMove, { verbose: true });
    if (move) {
      this.chess.undo();
      return move.san;
    }
    return null;
  }

  isCheckmate() {
    // console.log("Verificando checkmate com this.chess:", this.chess);
    // console.log("Métodos disponíveis em this.chess:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.chess)));
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
      Result: "*",
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
