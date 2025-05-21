import Game from "../../../models/Game.js";
import { Chess } from "chess.js";

export async function setupStartCommand(bot) {
  bot.start(async (ctx) => {
    try {
      const chatId = ctx.chat.id;

      // Verificar se já existe um jogo ativo para esse chat
      let game = await Game.findOne({ chatId, ativo: true });

      if (!game) {
        // Criar um novo jogo se não existir
        game = new Game({
          chatId,
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Posição inicial do xadrez
          pgn: "", // Histórico inicial vazio
          nivel: 10, // Nível de dificuldade padrão
          ativo: true,
          criadoEm: Date.now(),
          atualizadoEm: Date.now(),
        });
        await game.save();
      }

      // Inicializar o jogo com a FEN atual
      const chess = new Chess(game.fen);
      const turno = chess.turn(); // 'w' para branco, 'b' para preto
      const corJogador = turno === "w" ? "brancas" : "pretas";

      ctx.reply(
        `Bem-vindo ao Bot de Xadrez! ♟️\nVocê está jogando com as peças ${corJogador}.\nUm novo jogo foi iniciado. Use /level para ajustar o nível, /move para jogar, ou /newgame para reiniciar.`
      );
    } catch (error) {
      console.error("Erro ao processar o comando /start:", error);
      ctx.reply(
        "Desculpe, ocorreu um erro ao iniciar o jogo. Tente novamente mais tarde."
      );
    }
  });
}
