const { renderLint } = require('../../../src/formatter/lint-renderer');

function makeLintResult(results = [], fixable = [], overrides = {}) {
  return {
    file: 'test.prompt',
    version: '1',
    results,
    summary: {
      errors: results.filter(r => r.severity === 'error').length,
      warnings: results.filter(r => r.severity === 'warn').length,
      info: results.filter(r => r.severity === 'info').length,
    },
    fixable,
    ...overrides,
  };
}

describe('renderLint', () => {
  test('render error: output contains rule name', () => {
    const result = renderLint(makeLintResult([
      { severity: 'error', rule: 'conflicting-constraints', message: 'Found conflict', section: 'CONSTRAINTS', line: 3 },
    ]));
    expect(result).toContain('conflicting-constraints');
  });

  test('render summary line: output contains error/warning counts', () => {
    const result = renderLint(makeLintResult([
      { severity: 'error', rule: 'rule-a', message: 'Error', section: null, line: null },
      { severity: 'warn', rule: 'rule-b', message: 'Warning', section: null, line: null },
    ]));
    expect(result).toContain('1 error');
    expect(result).toContain('1 warning');
  });

  test('render fixable: output contains fix text', () => {
    const result = renderLint(makeLintResult(
      [{ severity: 'warn', rule: 'vague-constraints', message: 'Vague', section: null, line: null }],
      [{ rule: 'vague-constraints', fix: 'Add specificity', patch: null }],
    ));
    expect(result.toLowerCase()).toContain('fix');
  });

  test('zero issues: output contains No issues found', () => {
    const result = renderLint(makeLintResult([]));
    expect(result).toContain('No issues found');
  });
});
