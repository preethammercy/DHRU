import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');
const zipName = 'dhru-ai-release.zip';
const zipPath = resolve(root, zipName);

console.log('🚀 Packaging DHRU.AI Clean Release...');

if (existsSync(zipPath)) {
  rmSync(zipPath);
}

try {
  const psCmd = `Get-ChildItem -Path '.' -Exclude 'node_modules','dist','.git','*.zip','.system_generated','.gemini' | Compress-Archive -DestinationPath '${zipName}' -Force`;
  execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
  console.log(`✅ Release packaged successfully: ${zipName}`);
} catch (err) {
  console.error('Failed to create zip archive:', err);
  process.exit(1);
}
