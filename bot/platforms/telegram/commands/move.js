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

      console.log("Comando /move recebido com argumento:", sanMove);

      if (!sanMove) {
        console.log("Erro: Nenhum movimento fornecido.");
        ctx.reply(
          "Por favor, forneça um movimento válido (ex.: /move e4 ou /move Cxe4)."
        );
        return;
      }

      // Encontrar o jogo ativo
      const game = await Game.findOne({ chatId, ativo: true });

      if (!game) {
        console.log("Erro: Nenhum jogo ativo encontrado.");
        ctx.reply(
          "Nenhum jogo ativo encontrado. Use /start ou /newgame para começar."
        );
        return;
      }

      console.log("Jogo encontrado com FEN:", game.fen);

      // Inicializar o motor de jogo
      const gameEngine = new GameEngine(game.fen);

      // Validar o FEN
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
      console.log("FEN validado com sucesso:", game.fen);

      // Validar e aplicar o movimento do usuário
      const userMove = gameEngine.applyMove(sanMove);
      const userUciMove = userMove.from + userMove.to;
      console.log("Movimento do usuário (UCI):", userUciMove);

      // Atualizar o FEN com o movimento do usuário antes de consultar o Stockfish
      const fenAfterUserMove = gameEngine.getFen();
      console.log("FEN após movimento do usuário:", fenAfterUserMove);

      // Obter o melhor movimento do Stockfish
      console.log("Consultando Stockfish com FEN:", fenAfterUserMove);
      const stockfishUciMove = await Stockfish.getBestMove(
        fenAfterUserMove,
        game.nivel
      );
      console.log("Movimento do Stockfish (UCI):", stockfishUciMove);

      // Converter o movimento do Stockfish para SAN e aplicar
      const stockfishSanMove = gameEngine.getSanMove(stockfishUciMove);
      if (!stockfishSanMove) {
        throw new Error("Erro ao converter o movimento do Stockfish para SAN.");
      }
      console.log("Movimento do Stockfish (SAN):", stockfishSanMove);
      gameEngine.applyMove(stockfishSanMove);

      // Obter o novo FEN após o movimento do Stockfish
      const newFen = gameEngine.getFen();
      console.log("Novo FEN após movimentos:", newFen);

      // Validar o novo FEN
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

      // Gerar o PGN
      const moves = game.pgn ? game.pgn.split(" ") : [];
      moves.push(userUciMove, stockfishUciMove);
      const { text: pgnText } = gameEngine.generatePgn(
        moves,
        `Player_${chatId}`,
        "ChessBot",
        game.nivel
      );
      console.log("PGN gerado:", pgnText);

      // Atualizar o jogo no MongoDB
      game.fen = newFen;
      game.pgn = moves.join(" ");
      game.atualizadoEm = Date.now();
      await game.save();
      console.log("Jogo salvo no MongoDB com FEN:", newFen);

      // Responder com os movimentos em SAN
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
