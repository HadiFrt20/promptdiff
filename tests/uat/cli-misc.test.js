const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const BIN = path.join(__dirname, '../../bin/promptdiff.js');

function run(args) {
  return execSync(`node ${BIN} ${args}`, { encoding: 'utf-8', timeout: 15000 });
}

describe('CLI misc', () => {
  test('--help shows commands', () => {
    const output = run('--help');
    expect(output).toContain('diff');
    expect(output).toContain('lint');
    expect(output).toContain('compare');
    expect(output).toContain('init');
  });

  test('--version shows version', () => {
    const output = run('--version');
    expect(output.trim()).toMatch(/\d+\.\d+\.\d+/);
  });

  test('no args shows help', () => {
    // Commander may exit non-0 when no args are provided, but still prints help
    let output;
    try {
      output = execSync(`node ${BIN}`, { encoding: 'utf-8', timeout: 15000 });
    } catch (e) {
      output = (e.stdout || '') + (e.stderr || '');
    }
    expect(output).toContain('diff');
    expect(output).toContain('lint');
  });

  test('init creates .promptdiff/', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptdiff-cli-init-'));
    try {
      execSync(`node ${BIN} init`, { encoding: 'utf-8', timeout: 15000, cwd: tmpDir });
      expect(fs.existsSync(path.join(tmpDir, '.promptdiff'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
