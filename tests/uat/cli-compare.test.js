const { execSync } = require('child_process');
const path = require('path');
const BIN = path.join(__dirname, '../../bin/promptdiff.js');

function run(args) {
  return execSync(`node ${BIN} ${args}`, { encoding: 'utf-8', timeout: 15000 });
}

describe('CLI compare', () => {
  test('compare command exists: help does not error', () => {
    const output = run('compare --help');
    expect(output).toContain('compare');
  });
});
