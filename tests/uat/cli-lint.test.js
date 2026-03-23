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

describe('CLI lint', () => {
  const v7 = path.join(FIXTURES, 'support-agent-v7.prompt');

  test('lint v7: exit 0, output contains rule names', () => {
    const output = run(`lint ${v7}`);
    expect(output).toContain('conflicting-constraints');
  });

  test('lint --severity error: output present', () => {
    const output = run(`lint ${v7} --severity error`);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('lint nonexistent: throws/exits non-0', () => {
    const result = runWithError('lint /nonexistent/file.prompt');
    expect(result.exitCode).not.toBe(0);
  });

  test('summary line present', () => {
    const output = run(`lint ${v7}`);
    const hasErrorCount = /\d+\s*error/.test(output);
    const hasWarningCount = /\d+\s*warning/.test(output);
    expect(hasErrorCount || hasWarningCount).toBe(true);
  });

  test('lint with --fix: output contains fix text', () => {
    const output = run(`lint ${v7} --fix`);
    expect(output.toLowerCase()).toContain('fix');
  });
});
