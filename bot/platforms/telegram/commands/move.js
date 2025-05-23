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

      console.log("Comando /move recebido com argumento:", sanMove);

      if (!sanMove) {
        console.log("Erro: Nenhum movimento fornecido.");
        ctx.reply(
          "Por favor, forneça um movimento válido (ex.: /move e4 ou /move Nc3)."
        );
        return;
      }

      const game = await Game.findOne({ chatId, ativo: true });

      if (!game) {
        console.log("Erro: Nenhum jogo ativo encontrado.");
        ctx.reply(
          "Nenhum jogo ativo encontrado. Use /start ou /newgame para começar."
        );
        return;
      }

      console.log("Jogo encontrado com FEN:", game.fen);

      const gameEngine = new GameEngine(game.fen);

      const fenValidation = gameEngine.validateFen(game.fen);
      if (!fenValidation.valid) {
        console.error(
          "FEN inválido detectado:",
          game.fen,
          "Erro:",
          fenValidation.error
        );
        throw new Error(
          "Estado do tabuleiro corrompido. Inicie um novo jogo com /newgame."
        );
      }

      const moves = gameEngine.chess.moves({ verbose: true });
      const isValidMove = moves.some((move) => move.san === sanMove);
      if (!isValidMove) {
        console.log("Movimento inválido fornecido:", sanMove);
        ctx.reply(
          `Movimento inválido: "${sanMove}". Movimentos legais: ${moves
            .map((m) => m.san)
            .join(", ")}`
        );
        return;
      }

      const userMove = gameEngine.applyMove(sanMove);
      const userUciMove = userMove.from + userMove.to;
      console.log("Movimento do usuário (UCI):", userUciMove);

      const fenAfterUserMove = gameEngine.getFen();
      console.log("FEN após movimento do usuário:", fenAfterUserMove);

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
        console.log(
          "Xeque-mate detectado, jogo encerrado. FEN final:",
          fenAfterUserMove
        );
        ctx.reply(
          `Xeque-mate! Você venceu!\n\n📜 **PGN da Partida**:\n${pgnText}`
        );
        return;
      }

      const stockfishUciMove = await Stockfish.getBestMove(
        fenAfterUserMove,
        game.nivel
      );
      console.log("Movimento do Stockfish (UCI):", stockfishUciMove);

      const stockfishSanMove = gameEngine.getSanMove(stockfishUciMove);
      if (!stockfishSanMove) {
        throw new Error("Erro ao converter o movimento do Stockfish para SAN.");
      }
      console.log("Movimento do Stockfish (SAN):", stockfishSanMove);
      gameEngine.applyMove(stockfishSanMove);

      const newFen = gameEngine.getFen();
      console.log("Novo FEN após movimentos:", newFen);

      const newFenValidation = gameEngine.validateFen(newFen);
      if (!newFenValidation.valid) {
        console.error(
          "Novo FEN inválido detectado:",
          newFen,
          "Erro:",
          newFenValidation.error
        );
        throw new Error("Erro ao atualizar o tabuleiro. Tente novamente.");
      }

      if (gameEngine.isCheckmate()) {
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
        game.ativo = false;
        await game.save();
        console.log("Xeque-mate detectado, jogo encerrado. FEN final:", newFen);
        ctx.reply(
          `Xeque-mate! O bot venceu!\n\n📜 **PGN da Partida**:\n${pgnText}`
        );
        return;
      }

      const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
      pgnMoves.push(userUciMove, stockfishUciMove);
      const { text: pgnText } = gameEngine.generatePgn(
        pgnMoves,
        `Player_${chatId}`,
        "ChessBot",
        game.nivel
      );
      console.log("PGN gerado:", pgnText);

      game.fen = newFen;
      game.pgn = pgnMoves.join(" ");
      game.atualizadoEm = Date.now();
      await game.save();
      console.log("Jogo salvo no MongoDB com FEN:", newFen);

      ctx.reply(
        `Seu movimento: ${sanMove}\nMinha resposta: ${stockfishSanMove}\n\n📜 **PGN da Partida**:\n${pgnText}`
      );
    } catch (error) {
      console.error(
        "Erro ao processar o movimento:",
        error.stack || error.message
      );
      ctx.reply(
        "Desculpe, ocorreu um erro ao processar o movimento. Tente novamente mais tarde."
      );
    }
  });
}
