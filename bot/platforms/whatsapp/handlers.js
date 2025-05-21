import startCommand from "../whatsapp/commands/start.js";
import jogadaCommand from "../whatsapp/commands/jogada.js";
import nivelCommand from "../whatsapp/commands/nivel.js";

export function loadHandlers(bot) {
  bot.start(startCommand);
  bot.command("jogar", jogadaCommand);
  bot.command("nivel", nivelCommand);

  // Futuramente: bot.on("message", genericHandler)
}
