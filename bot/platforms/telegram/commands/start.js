// ~/bot-xadrez/bot/platforms/telegram/commands/start.js
import Game from "../../../models/Game.js";

export function setupStartCommand(bot) {
  bot.start(async (ctx) => {
    try {
      const chatId = ctx.chat.id;

      // Verificar se já existe um jogo ativo para esse chat
      let game = await Game.findOne({ chatId, ativo: true });

      if (!game) {
        // FEN padrão válido
        const initialFen =
          "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        game = new Game({
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
        ctx.reply(
          "Bem-vindo ao Bot de Xadrez! ♟️\nVocê está jogando com as peças brancas.\nUm novo jogo foi iniciado. Use /level para ajustar o nível, /move para jogar, ou /newgame para reiniciar."
        );
      } else {
        console.log("Jogo existente encontrado com FEN:", game.fen);
        ctx.reply(
          `Bem-vindo de volta ao Bot de Xadrez! ♟️\nVocê tem um jogo em andamento (nível ${game.nivel}). Use /level para ajustar o nível, /move para jogar, ou /newgame para reiniciar.`
        );
      }
    } catch (error) {
      console.error("Erro ao processar o comando /start:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao iniciar o jogo. Tente novamente mais tarde."
      );
    }
  });
}
