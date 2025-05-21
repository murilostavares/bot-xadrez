import Game from "../../../models/Game.js";

export function setupNewGameCommand(bot) {
  bot.command("newgame", async (ctx) => {
    try {
      const chatId = ctx.chat.id;

      // Encerrar qualquer jogo ativo
      await Game.updateMany(
        { chatId, ativo: true },
        { ativo: false, atualizadoEm: Date.now() }
      );

      // Criar um novo jogo
      const newGame = new Game({
        chatId,
        fen: "rnbqkbnr/pppppppp/5n5/8/8/5N5/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Posição inicial
        pgn: "",
        nivel: 10, // Nível padrão
        ativo: true,
        criadoEm: Date.now(),
        atualizadoEm: Date.now(),
      });
      await newGame.save();

      ctx.reply("Novo jogo iniciado! ♟️ Use /move para fazer seu movimento.");
    } catch (error) {
      console.error("Erro ao iniciar novo jogo:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao iniciar um novo jogo. Tente novamente mais tarde."
      );
    }
  });
}
