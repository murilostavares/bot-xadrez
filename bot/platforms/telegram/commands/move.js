// ~/bot-xadrez/bot/platforms/telegram/commands/move.js
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
        ctx.reply(
          "Por favor, forneça um movimento válido (ex.: /move e4 ou /move Cxe4)."
        );
        return;
      }

      // Encontrar o jogo ativo
      const game = await Game.findOne({ chatId, ativo: true });

      if (!game) {
        ctx.reply(
          "Nenhum jogo ativo encontrado. Use /start ou /newgame para começar."
        );
        return;
      }

      // Inicializar o motor de jogo
      const gameEngine = new GameEngine(game.fen);

      // Validar e aplicar o movimento do usuário
      const userMove = gameEngine.applyMove(sanMove);
      const userUciMove = userMove.from + userMove.to;

      // Obter o melhor movimento do Stockfish
      const stockfishUciMove = await Stockfish.getBestMove(
        game.fen,
        game.nivel
      );

      // Atualizar o tabuleiro com os movimentos
      gameEngine.applyMove(gameEngine.getSanMove(stockfishUciMove));
      const newFen = gameEngine.getFen();

      // Gerar o PGN
      const moves = game.pgn ? game.pgn.split(" ") : [];
      moves.push(userUciMove, stockfishUciMove);
      const { text: pgnText } = gameEngine.generatePgn(
        moves,
        `Player_${chatId}`,
        "ChessBot",
        game.nivel
      );

      // Atualizar o jogo no MongoDB
      game.fen = newFen;
      game.pgn = moves.join(" ");
      game.atualizadoEm = Date.now();
      await game.save();

      // Responder com os movimentos em SAN
      const stockfishSanMove = gameEngine.getSanMove(stockfishUciMove);
      ctx.reply(
        `Seu movimento: ${sanMove}\nMinha resposta: ${stockfishSanMove}\n\n📜 **PGN da Partida**:\n${pgnText}`
      );
    } catch (error) {
      console.error("Erro ao processar o movimento:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao processar o movimento. Tente novamente mais tarde."
      );
    }
  });
}
