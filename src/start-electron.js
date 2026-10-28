const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function electronBinary() {
  const candidates = [
    path.join(__dirname, 'node_modules', 'electron'),
    path.join(os.homedir(), 'node_modules', 'electron')
  ];
  for (const dir of candidates) {
    try {
      const bin = require(dir);
      if (bin && fs.existsSync(bin)) return bin;
    } catch {
      // try the next install
    }
  }
  throw new Error('Electron is not installed. In src/ run: npm install');
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary(), [__dirname], {
  cwd: __dirname,
  stdio: 'inherit',
  env
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
