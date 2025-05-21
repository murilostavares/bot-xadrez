import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, index: true },
  fen: { type: String, required: true }, // Estado atual do tabuleiro
  pgn: { type: String, default: "" }, // Histórico da partida
  nivel: { type: Number, default: 10 }, // Nível de dificuldade
  ativo: { type: Boolean, default: true },
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now },
});

export default mongoose.model("Game", gameSchema);
