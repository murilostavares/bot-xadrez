import Game from "../../../models/Game.js";
import { exec } from "child_process";
import { promisify } from "util";
import { generatePGN } from "../../utils/pgn.js";
const execPromise = promisify(exec);

export function setupMoveCommand(bot) {
  bot.command("move", async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const args = ctx.message.text.split(" ").slice(1);
      const userMove = args[0];

      if (!userMove || !/^[a-h][1-8][a-h][1-8]$/.test(userMove)) {
        ctx.reply("Por favor, forneça um movimento válido (ex.: /move e2e4).");
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

      // Configurar o Stockfish com o nível de dificuldade
      const stockfishCommands = [
        `uci`,
        `setoption name Skill Level value ${game.nivel}`,
        `position fen ${game.fen}`,
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

      // Atualizar o tabuleiro
      const updatedCommands = [
        `uci`,
        `position fen ${game.fen} moves ${userMove} ${stockfishMove}`,
        `d`,
      ].join("\n");

      const { stdout: updatedStdout } = await execPromise(
        `echo "${updatedCommands}" | stockfish`
      );
      const fenLine = updatedStdout
        .split("\n")
        .find((line) => line.startsWith("Fen: "));
      if (!fenLine) {
        ctx.reply("Erro ao atualizar a posição do tabuleiro.");
        return;
      }

      const newFen = fenLine.split("Fen: ")[1].trim();

      // Atualizar a lista de movimentos
      const moves = game.pgn ? game.pgn.split(" ") : [];
      moves.push(userMove, stockfishMove);

      // Gerar o PGN usando a nova função
      const { text: newPgn } = generatePGN({
        moves,
        whitePlayer: `Player_${chatId}`,
        blackPlayer: "ChessBot",
        level: game.nivel,
        result: "*", // Partida em andamento
        date: new Date(),
      });

      // Atualizar o jogo no MongoDB
      game.fen = newFen;
      game.pgn = moves.join(" "); // Armazenar os movimentos em formato UCI
      game.atualizadoEm = Date.now();
      await game.save();

      ctx.reply(
        `Seu movimento: ${userMove}\nMinha resposta: ${stockfishMove}\nNovo estado do tabuleiro (FEN): ${newFen}`
      );
    } catch (error) {
      console.error("Erro ao processar o movimento:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao processar o movimento. Tente novamente mais tarde."
      );
    }
  });
}
