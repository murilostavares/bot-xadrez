// ~/bot-xadrez/bot/platforms/telegram/commands/newgame.js
import Game from "../../../models/Game.js";

export function setupNewGameCommand(bot) {
  bot.command("newgame", async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      await Game.updateMany({ chatId, ativo: true }, { ativo: false });
      const initialFen =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      const game = new Game({
        chatId,
        fen: initialFen,
        pgn: "",
        nivel: 10,
        ativo: true,
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
      });
      await game.save();
      console.log("Novo jogo criado com FEN:", initialFen);
      ctx.reply("Novo jogo iniciado! ♟️ Use /move para fazer seu movimento.");
    } catch (error) {
      console.error("Erro ao iniciar novo jogo:", error.message);
      ctx.reply("Desculpe, ocorreu um erro ao iniciar um novo jogo.");
    }
  });
}
