import { Chess } from 'chess.js'

export function generatePGN(moves = []) {
  const game = new Chess()
  for (const move of moves) {
    game.move({ from: move.slice(0, 2), to: move.slice(2, 4) })
  }
  return game.pgn()
}
