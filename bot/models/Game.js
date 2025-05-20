import mongoose from 'mongoose'

const gameSchema = new mongoose.Schema({
  chatId: { type: Number, required: true },
  moves: [String], // tipo ['e2e4', 'e7e5']
  fen: String,
  pgn: String,
  skillLevel: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('Game', gameSchema)
