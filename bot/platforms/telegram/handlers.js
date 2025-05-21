import { setupStartCommand } from "./commands/start.js";
import { setupLevelCommand } from "./commands/level.js";
import { setupMoveCommand } from "./commands/move.js";
import { setupNewGameCommand } from "./commands/newgame.js";
import { setupTestCommand } from "./commands/test.js";
import { setupExportPgnCommand } from "./commands/exportpgn.js";

export function loadHandlers(bot) {
  setupStartCommand(bot);
  setupLevelCommand(bot);
  setupMoveCommand(bot);
  setupNewGameCommand(bot);
  setupTestCommand(bot);
  setupExportPgnCommand(bot);
}
