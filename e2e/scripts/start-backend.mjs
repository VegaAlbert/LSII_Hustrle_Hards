// Starts the backend for the E2E suite on a fresh environment: the `dev` profile (empty in-memory H2 database) and a
// new video store with only the fixture videos, so every run starts from the same data.
import { spawn } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const e2eDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storeDir = path.join(e2eDir, '.store');

// Uploads made by the tests are written to the store, so it is recreated from the fixtures on each run
rmSync(storeDir, { recursive: true, force: true });
cpSync(path.join(e2eDir, 'fixtures', 'store'), storeDir, { recursive: true });

const maven = process.env.E2E_MAVEN ?? 'mvn';
const backend = spawn(maven, ['-q', 'spring-boot:run'], {
  cwd: path.join(e2eDir, '..', 'backend'),
  stdio: 'inherit',
  // mvn is a .cmd script on Windows
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    // Replaces the developer's own ENV_PROTUBE_STORE_DIR, so the suite never reads or writes their videos.
    // Forward slashes work on every OS (Java accepts them on Windows too) and give a valid file: URL for MvcConfig;
    // it must end with a separator because MvcConfig serves /media/** from file:<store dir>
    ENV_PROTUBE_STORE_DIR: `${storeDir.split(path.sep).join('/')}/`,
    SERVER_PORT: process.env.E2E_BACKEND_PORT ?? '8081',
  },
});

// Stop Spring Boot when Playwright stops this script
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => backend.kill(signal));
}
backend.on('exit', (code) => process.exit(code ?? 0));
