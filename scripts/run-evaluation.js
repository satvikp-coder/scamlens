// Runs the evaluation harness and writes docs/EVALUATION.md.
// Works on Windows, macOS and Linux (no shell-specific env syntax).
const { spawnSync } = require('child_process');

const result = spawnSync('npx', ['jest', 'src/engine/evaluate.test.ts', '--silent=false'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, WRITE_EVAL_REPORT: '1' },
});
process.exit(result.status ?? 1);
