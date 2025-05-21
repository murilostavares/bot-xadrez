import { Telegraf } from "telegraf";
import { loadHandlers } from "./handlers.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

loadHandlers(bot);

export default bot;
