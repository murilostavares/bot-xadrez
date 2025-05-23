// D:\Desenv\bot-xadrez\bot\platforms\telegram\commands\move.js
import Game from "../../../models/Game.js";
import { GameEngine } from "../../../services/game-engine.js";
import { Stockfish } from "../../../services/stockfish.js";

export function setupMoveCommand(bot) {
  bot.command("move", async (ctx) => {
    let gameEngine; // Declarado no escopo da função
    try {
      const chatId = ctx.chat.id;
      const args = ctx.message.text.split(" ").slice(1);
      const sanMove = args[0];

      console.log("Comando /move recebido com argumento:", sanMove);

      if (!sanMove) {
        console.log("Erro: Nenhum movimento fornecido.");
        ctx.reply("Por favor, forneça um movimento válido (ex.: /move e4).");
        return;
      }

      const game = await Game.findOne({ chatId, ativo: true });
      if (!game) {
        console.log("Erro: Nenhum jogo ativo encontrado.");
        ctx.reply("Nenhum jogo ativo encontrado. Use /start ou /newgame.");
        return;
      }

      console.log("Jogo encontrado com FEN:", game.fen);

      gameEngine = new GameEngine(game.fen); // Criado fora do bloco de validação
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

      const legalMoves = gameEngine.chess
        .moves({ verbose: true })
        .map((m) => m.san);
      console.log("Movimentos legais na posição atual:", legalMoves);

      console.log("Tentando aplicar movimento SAN:", sanMove);
      const userMove = gameEngine.applyMove(sanMove);
      if (!userMove) {
        console.error(
          "Movimento SAN rejeitado:",
          sanMove,
          "FEN atual:",
          gameEngine.getFen()
        );
        ctx.reply(
          `Movimento inválido: "${sanMove}". Movimentos legais: ${legalMoves.join(
            ", "
          )}`
        );
        return;
      }

      console.log(
        "Movimento aplicado com sucesso (UCI):",
        userMove.from + userMove.to
      );

      const fenAfterUserMove = gameEngine.getFen();
      console.log("FEN após movimento do usuário:", fenAfterUserMove);

      // Verificar xeque-mate ou empate após o movimento do usuário
      if (gameEngine.isCheckmate()) {
        const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
        pgnMoves.push(userMove.from + userMove.to);
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

      if (gameEngine.chess.isStalemate() || gameEngine.chess.isDraw()) {
        const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
        pgnMoves.push(userMove.from + userMove.to);
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
          `Empate por pat ou outra condição!\n\n📜 **PGN da Partida**:\n${pgnText}`
        );
        return;
      }

      // Enviar mensagem "Pensando..." imediatamente
      const thinkingMessage = await ctx.reply("Pensando... ⏳");

      // Obter resposta do Stockfish
      const stockfishUciMove = await Stockfish.getBestMove(
        fenAfterUserMove,
        game.nivel
      );
      console.log("Movimento do Stockfish (UCI):", stockfishUciMove);

      // Tratar caso de xeque-mate ou pat pelo Stockfish
      if (!stockfishUciMove) {
        const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
        pgnMoves.push(userMove.from + userMove.to);
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
          await bot.telegram.editMessageText(
            chatId,
            thinkingMessage.message_id,
            undefined,
            `Xeque-mate! Você venceu!\n\n📜 **PGN da Partida**:\n${pgnText}`
          );
        } else {
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
          await bot.telegram.editMessageText(
            chatId,
            thinkingMessage.message_id,
            undefined,
            `Empate por pat!\n\n📜 **PGN da Partida**:\n${pgnText}`
          );
        }
        return;
      }

      const stockfishSanMove = gameEngine.getSanMove(stockfishUciMove);
      if (!stockfishSanMove) {
        throw new Error("Erro ao converter o movimento do Stockfish para SAN.");
      }
      console.log("Movimento do Stockfish (SAN):", stockfishSanMove);

      const legalMovesAfterUser = gameEngine.chess
        .moves({ verbose: true })
        .map((m) => m.san);
      console.log("Movimentos legais para o Stockfish:", legalMovesAfterUser);
      console.log(
        "FEN antes de aplicar o movimento do Stockfish:",
        gameEngine.getFen()
      );

      const stockfishMove = gameEngine.applyMove(stockfishSanMove);
      if (!stockfishMove) {
        console.error(
          "Movimento do Stockfish rejeitado:",
          stockfishSanMove,
          "FEN atual:",
          gameEngine.getFen()
        );
        throw new Error(`Invalid move: ${stockfishSanMove}`);
      }

      const newFen = gameEngine.getFen();
      console.log("Novo FEN após movimentos:", newFen);

      game.fen = newFen;
      game.atualizadoEm = Date.now();
      await game.save();
      console.log("Jogo salvo no MongoDB com FEN:", newFen);

      // Editar a mensagem "Pensando..." com a resposta final
      await bot.telegram.editMessageText(
        chatId,
        thinkingMessage.message_id,
        undefined,
        `Seu movimento: ${sanMove}\nMinha resposta: ${stockfishSanMove}`
      );
    } catch (error) {
      console.error("Erro ao processar o movimento:", error.message);
      const gameEngine = new GameEngine(game.fen); // Recriar gameEngine para o escopo do catch
      gameEngine.applyMove(sanMove); // Aplicar o movimento para atualizar o estado
      if (error.message.includes("Invalid move") && gameEngine.isCheckmate()) {
        const pgnMoves = game.pgn ? game.pgn.split(" ") : [];
        pgnMoves.push(sanMove); // Usar sanMove diretamente, pois userMove pode não estar disponível
        const { text: pgnText } = gameEngine.generatePgn(
          pgnMoves,
          `Player_${chatId}`,
          "ChessBot",
          game.nivel
        );
        game.fen = gameEngine.getFen();
        game.pgn = pgnMoves.join(" ");
        game.ativo = false;
        await game.save();
        await bot.telegram.editMessageText(
          chatId,
          thinkingMessage.message_id,
          undefined,
          `Xeque-mate! Você venceu!\n\n📜 **PGN da Partida**:\n${pgnText}`
        );
      } else {
        await bot.telegram.editMessageText(
          chatId,
          thinkingMessage.message_id,
          undefined,
          "Desculpe, ocorreu um erro ao processar o movimento. Tente novamente."
        );
      }
    }
  });
}
