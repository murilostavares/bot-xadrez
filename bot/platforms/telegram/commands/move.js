// D:\Desenv\bot-xadrez\bot\platforms\telegram\commands\move.js
import Game from "../../../models/Game.js";
import { GameEngine } from "../../../services/game-engine.js";
import { Stockfish } from "../../../services/stockfish.js";

export function setupMoveCommand(bot) {
  bot.command("move", async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const args = ctx.message.text.split(" ").slice(1);
      const sanMove = args[0];

      if (!sanMove) {
        ctx.reply("Por favor, forneça um movimento válido (ex.: /move e4).");
        return;
      }

      const game = await Game.findOne({ chatId, ativo: true });
      if (!game) {
        ctx.reply("Nenhum jogo ativo encontrado. Use /start ou /newgame.");
        return;
      }

      const gameEngine = new GameEngine(game.fen);
      const fenValidation = gameEngine.validateFen(game.fen);
      if (!fenValidation.valid) {
        throw new Error(
          "Estado do tabuleiro corrompido. Inicie um novo jogo com /newgame."
        );
      }

      const moves = gameEngine.chess.moves({ verbose: true });
      const isValidMove = moves.some((move) => move.san === sanMove);
      if (!isValidMove) {
        ctx.reply(
          `Movimento inválido: "${sanMove}". Movimentos legais: ${moves
            .map((m) => m.san)
            .join(", ")}`
        );
        return;
      }

      const userMove = gameEngine.applyMove(sanMove);
      const userUciMove = userMove.from + userMove.to;
      const fenAfterUserMove = gameEngine.getFen();

      if (gameEngine.isCheckmate()) {
        const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
        pgnMoves.push(userUciMove);
        const { text: pgnText } = gameEngine.generatePgn(
          pgnMoves,
          `Player_${chatId}`,
          "ChessBot",
          game.nivel
        );
        game.fen = fenAfterUserMove;
        game.pgn = pgnMoves.join(" ");
        game.ativo = false;
        await game.save();
        ctx.reply(
          `Xeque-mate! Você venceu!\n\n📜 **PGN da Partida**:\n${pgnText}`
        );
        return;
      }

      const stockfishUciMove = await Stockfish.getBestMove(
        fenAfterUserMove,
        game.nivel
      );
      if (!stockfishUciMove) {
        const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
        pgnMoves.push(userUciMove);
        if (gameEngine.chess.inCheck()) {
          const { text: pgnText } = gameEngine.generatePgn(
            pgnMoves,
            `Player_${chatId}`,
            "ChessBot",
            game.nivel
          );
          game.fen = fenAfterUserMove;
          game.pgn = pgnMoves.join(" ");
          game.ativo = false;
          await game.save();
          ctx.reply(
            `Xeque-mate! Você venceu!\n\n📜 **PGN da Partida**:\n${pgnText}`
          );
        } else {
          ctx.reply("Empate por pat.");
        }
        return;
      }

      const stockfishSanMove = gameEngine.getSanMove(stockfishUciMove);
      if (!stockfishSanMove) {
        throw new Error("Erro ao converter o movimento do Stockfish para SAN.");
      }
      gameEngine.applyMove(stockfishSanMove);

      const newFen = gameEngine.getFen();
      const newFenValidation = gameEngine.validateFen(newFen);
      if (!newFenValidation.valid) {
        throw new Error("Erro ao atualizar o tabuleiro. Tente novamente.");
      }

      const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
      pgnMoves.push(userUciMove, stockfishUciMove);
      const { text: pgnText } = gameEngine.generatePgn(
        pgnMoves,
        `Player_${chatId}`,
        "ChessBot",
        game.nivel
      );

      game.fen = newFen;
      game.pgn = pgnMoves.join(" ");
      game.atualizadoEm = Date.now();
      await game.save();

      ctx.reply(
        `Seu movimento: ${sanMove}\nMinha resposta: ${stockfishSanMove}\n\n📜 **PGN da Partida**:\n${pgnText}`
      );
    } catch (error) {
      console.error("Erro ao processar o movimento:", error.message);
      ctx.reply("Desculpe, ocorreu um erro ao processar o movimento.");
    }
  });
}
