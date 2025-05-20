import { Telegraf } from 'telegraf';

const bot = new Telegraf('7829351693:AAFrF0HhJGLK_j9Zclp1giYoYNZDMa3JJZg'); // Substitua pelo seu token real

let nivel = 5; // valor fictício de skill (depois integramos com Stockfish)

bot.start((ctx) => {
  ctx.reply('Bem-vindo ao Bot de Xadrez! Digite /jogada para jogar ou /nivel [0-20] para definir a dificuldade.');
});

bot.command('nivel', (ctx) => {
  const partes = ctx.message.text.split(' ');
  const valor = parseInt(partes[1]);
  if (!isNaN(valor) && valor >= 0 && valor <= 20) {
    nivel = valor;
    ctx.reply(`Nível de habilidade ajustado para ${nivel}.`);
  } else {
    ctx.reply('Por favor, informe um número entre 0 e 20. Ex: /nivel 10');
  }
});

bot.command('jogada', (ctx) => {
  ctx.reply('Aqui em breve vamos jogar uma partida! ♟️');
});

bot.launch()
  .then(() => console.log('Bot Telegram rodando...'))
  .catch(err => console.error('Erro ao iniciar o bot:', err));
