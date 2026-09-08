import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const isWindows = process.platform === 'win32';
const virtualPython = path.join(
  root,
  'backend',
  '.venv',
  isWindows ? 'Scripts/python.exe' : 'bin/python',
);
const virtualUv = path.join(
  root,
  'backend',
  '.venv',
  isWindows ? 'Scripts/uv.exe' : 'bin/uv',
);
const backendRoot = path.join(root, 'backend');
const task = process.argv[2];

function run(command, args, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

if (task === 'setup') {
  const python = isWindows ? 'py' : 'python3';
  const pythonArgs = isWindows ? ['-3'] : [];
  const create = spawnSync(
    python,
    [...pythonArgs, '-m', 'venv', 'backend/.venv'],
    { cwd: root, stdio: 'inherit' },
  );
  if (create.status !== 0) process.exit(create.status ?? 1);

  const installUv = spawnSync(virtualPython, ['-m', 'pip', 'install', 'uv'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (installUv.status !== 0) process.exit(installUv.status ?? 1);

  const sync = spawnSync(virtualUv, ['sync'], {
    cwd: backendRoot,
    stdio: 'inherit',
  });
  process.exit(sync.status ?? 1);
}

if (!existsSync(virtualPython)) {
  console.error('Python environment missing. Run: npm run setup:api');
  process.exit(1);
}

if (task === 'dev') {
  run(virtualPython, [
    '-m',
    'uvicorn',
    'backend.src.main:app',
    '--reload',
    '--port',
    '8787',
  ]);
} else if (task === 'test') {
  run(virtualPython, ['-m', 'pytest', 'backend/tests']);
} else if (task === 'deploy') {
  if (!existsSync(virtualUv)) {
    console.error('uv is missing. Run: npm run setup:api');
    process.exit(1);
  }
  run(virtualUv, ['run', 'pywrangler', 'deploy'], backendRoot);
} else {
  console.error('Unknown Python task. Use setup, dev, test, or deploy.');
  process.exit(1);
}
