import { testStockfish } from "../../utils/stockfish.js";

export function setupTestCommand(bot) {
  bot.command("test", async (ctx) => {
    const result = await testStockfish();
    ctx.reply(result);
  });
}
