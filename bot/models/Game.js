// ~/bot-xadrez/models/Game.js
import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  fen: {
    type: String,
    default: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  },
  pgn: { type: String, default: "" },
  ativo: { type: Boolean, default: true },
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now },
  nivel: { type: Number, default: 10 }, // Verifique se o padrão é 10
});

export default mongoose.model("Game", gameSchema);
