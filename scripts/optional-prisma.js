// skippt still, wenn kein Prisma benötigt wird
const { spawnSync } = require('node:child_process');
if (process.env.PRISMA_GENERATE === '1') {
  const r = spawnSync('pnpm', ['prisma', 'generate'], { stdio: 'inherit' });
  process.exit(r.status ?? 0);
} else {
  console.log('[postinstall] skipping prisma generate (set PRISMA_GENERATE=1 to enable)');
}
