const { execSync } = require('child_process');
const path = require('path');
const BIN = path.join(__dirname, '../../bin/promptdiff.js');
const FIXTURES = path.join(__dirname, '../fixtures/prompts');

function run(args) {
  return execSync(`node ${BIN} ${args}`, { encoding: 'utf-8', timeout: 15000 });
}
function runWithError(args) {
  try {
    execSync(`node ${BIN} ${args}`, { encoding: 'utf-8', timeout: 15000 });
    return { exitCode: 0 };
  } catch (e) {
    return { exitCode: e.status, stderr: e.stderr, stdout: e.stdout };
  }
}

describe('CLI diff', () => {
  const v3 = path.join(FIXTURES, 'support-agent-v3.prompt');
  const v7 = path.join(FIXTURES, 'support-agent-v7.prompt');

  test('diff v3 v7: exit 0, output contains section names', () => {
    const output = run(`diff ${v3} ${v7}`);
    expect(output).toContain('CONSTRAINTS');
  });

  test('diff --annotate: output contains impact', () => {
    const output = run(`diff ${v3} ${v7} --annotate`);
    expect(output.toLowerCase()).toContain('high');
  });

  test('diff identical: output contains No changes or 0 added', () => {
    const output = run(`diff ${v3} ${v3}`);
    const lower = output.toLowerCase();
    expect(lower.includes('no changes') || lower.includes('0 added') || lower.includes('+0')).toBe(true);
  });

  test('diff nonexistent: exit code non-0', () => {
    const result = runWithError('diff /nonexistent/a.prompt /nonexistent/b.prompt');
    expect(result.exitCode).not.toBe(0);
  });

  test('output includes diff markers (+ or minus)', () => {
    const output = run(`diff ${v3} ${v7}`);
    const hasDiffMarkers = output.includes('+') || output.includes('\u2212') || output.includes('-');
    expect(hasDiffMarkers).toBe(true);
  });
});
