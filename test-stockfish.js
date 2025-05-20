import { spawn } from 'child_process';

const stockfish = spawn('stockfish');

stockfish.stdout.on('data', (data) => {
  console.log('SF:', data.toString());
});

stockfish.stderr.on('data', (data) => {
  console.error('SF error:', data.toString());
});

stockfish.on('close', (code) => {
  console.log(`Stockfish saiu com código ${code}`);
});

// Enviar comandos UCI básicos
stockfish.stdin.write('uci\n');

setTimeout(() => {
  stockfish.stdin.write('isready\n');
}, 500);

setTimeout(() => {
  stockfish.stdin.write('ucinewgame\n');
}, 1000);

setTimeout(() => {
  stockfish.stdin.write('position startpos\n');
}, 1500);

setTimeout(() => {
  stockfish.stdin.write('go depth 10\n');
}, 2000);

setTimeout(() => {
  stockfish.stdin.end();
}, 5000);

