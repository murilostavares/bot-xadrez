import Game from "../../../models/Game.js";

export function setupLevelCommand(bot) {
  bot.command("level", async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const args = ctx.message.text.split(" ").slice(1); // Pegar argumentos após /level
      const newLevel = parseInt(args[0], 10);

      // Validar o nível (Stockfish aceita de 0 a 20)
      if (isNaN(newLevel) || newLevel < 0 || newLevel > 20) {
        ctx.reply(
          "Por favor, forneça um nível válido entre 0 e 20. Exemplo: /level 5"
        );
        return;
      }

      // Encontrar o jogo ativo
      const game = await Game.findOne({ chatId, ativo: true });

      if (!game) {
        ctx.reply(
          "Nenhum jogo ativo encontrado. Use /start para começar um novo jogo."
        );
        return;
      }

      // Atualizar o nível
      game.nivel = newLevel;
      game.atualizadoEm = Date.now();
      await game.save();

      ctx.reply(`Nível de dificuldade ajustado para ${newLevel}.`);
    } catch (error) {
      console.error("Erro ao ajustar o nível:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao ajustar o nível. Tente novamente mais tarde."
      );
    }
  });
}
