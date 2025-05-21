import Game from "../../../models/Game.js";
import { exec } from "child_process";
import { promisify } from "util";
import { Chess } from "chess.js";

const execPromise = promisify(exec);

export function setupMoveCommand(bot) {
  bot.command("move", async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const args = ctx.message.text.split(" ").slice(1);
      const userInput = args[0];

      if (!userInput) {
        ctx.reply("Por favor, forneça um movimento válido (ex.: /move e4).");
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

      // Inicializar o jogo com a FEN atual
      let chess;
      try {
        chess = new Chess(game.fen);
      } catch (fenError) {
        console.warn("FEN inválida detectada. Iniciando posição padrão.");
        chess = new Chess(); // Posição inicial padrão
      }

      // Tentar aplicar o movimento do usuário
      const userMove = chess.move(userInput, { sloppy: true });

      if (!userMove) {
        ctx.reply("Movimento inválido. Por favor, tente novamente.");
        return;
      }

      const userMoveSan = userMove.san;

      // Configurar o Stockfish com o nível de dificuldade
      const stockfishCommands = [
        `uci`,
        `setoption name Skill Level value ${game.nivel}`,
        `position fen ${chess.fen()}`,
        `go movetime 1000`,
      ].join("\n");

      const { stdout, stderr } = await execPromise(
        `echo "${stockfishCommands}" | stockfish`
      );

      if (stderr) {
        console.error("Erro ao executar o Stockfish:", stderr);
        ctx.reply("Erro ao processar o movimento com o Stockfish.");
        return;
      }

      const lines = stdout.split("\n");
      const bestMoveLine = lines.find((line) => line.startsWith("bestmove"));

      if (!bestMoveLine) {
        ctx.reply("Não consegui determinar o melhor movimento do Stockfish.");
        return;
      }

      const stockfishMove = bestMoveLine.split(" ")[1];

      const from = stockfishMove.slice(0, 2);
      const to = stockfishMove.slice(2, 4);
      const promotion =
        stockfishMove.length === 5 ? stockfishMove[4] : undefined;

      const botMove = chess.move({ from, to, promotion });

      if (!botMove) {
        ctx.reply("Erro ao processar o movimento do Stockfish.");
        return;
      }

      const botMoveSan = botMove.san;

      // Atualizar o jogo no MongoDB
      game.fen = chess.fen();
      game.pgn = chess.pgn();
      game.atualizadoEm = Date.now();
      await game.save();

      ctx.reply(
        `Seu movimento: ${userMoveSan}\nMinha resposta: ${botMoveSan}\n\nNotação da partida:\n${game.pgn}`
      );
    } catch (error) {
      console.error("Erro ao processar o movimento:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao processar o movimento. Tente novamente mais tarde."
      );
    }
  });
}
