import Game from "../../../models/Game.js";
import { generatePGN } from "../../../utils/pgn.js";

export function setupExportPgnCommand(bot) {
  bot.command("exportpgn", async (ctx) => {
    try {
      const chatId = ctx.chat.id;

      // Encontrar o jogo ativo
      const game = await Game.findOne({ chatId, ativo: true });

      if (!game) {
        ctx.reply(
          "Nenhum jogo ativo encontrado. Use /start ou /newgame para começar."
        );
        return;
      }

      // Gerar o PGN
      const moves = game.pgn ? game.pgn.split(" ") : [];
      const { formatted } = generatePGN({
        moves,
        whitePlayer: `Player_${chatId}`,
        blackPlayer: "ChessBot",
        level: game.nivel,
        result: "*", // Pode ser ajustado se a partida terminar
        date: game.criadoEm,
      });

      ctx.reply(
        `Aqui está o PGN da sua partida:\n\n${formatted}\n\nVocê pode copiar e colar isso em plataformas como Lichess ou Chess.com!`
      );
    } catch (error) {
      console.error("Erro ao exportar PGN:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao exportar o PGN. Tente novamente mais tarde."
      );
    }
  });
}
