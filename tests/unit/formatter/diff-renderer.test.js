const { renderDiff } = require('../../../src/formatter/diff-renderer');

function makeDiffResult(changes = [], overrides = {}) {
  const added = changes.filter(c => c.type === 'added').length;
  const removed = changes.filter(c => c.type === 'removed').length;
  const modified = changes.filter(c => !['added', 'removed'].includes(c.type)).length;
  const sectionsAffected = [...new Set(changes.map(c => c.section).filter(Boolean))];
  return {
    left: { meta: { version: 3 }, filePath: 'left.prompt' },
    right: { meta: { version: 7 }, filePath: 'right.prompt' },
    summary: { added, removed, modified, sections_affected: sectionsAffected },
    changes,
    ...overrides,
  };
}

describe('renderDiff', () => {
  test('render with changes: output contains section names', () => {
    const result = renderDiff(makeDiffResult([
      { type: 'added', section: 'CONSTRAINTS', right_line: 'New constraint here' },
      { type: 'removed', section: 'PERSONA', left_line: 'Old persona line' },
    ]));
    expect(result).toContain('CONSTRAINTS');
    expect(result).toContain('PERSONA');
  });

  test('render with annotations: output contains impact text', () => {
    const result = renderDiff(makeDiffResult([
      { type: 'modified', section: 'CONSTRAINTS', left_line: 'old', right_line: 'new', description: 'Tightened word limit', impact: 'high' },
    ]));
    expect(result).toContain('Tightened word limit');
    expect(result).toContain('high');
  });

  test('render summary bar: output contains added/removed counts', () => {
    const result = renderDiff(makeDiffResult([
      { type: 'added', section: 'CONSTRAINTS', right_line: 'line1' },
      { type: 'added', section: 'CONSTRAINTS', right_line: 'line2' },
      { type: 'removed', section: 'PERSONA', left_line: 'line3' },
    ]));
    expect(result).toContain('2');
    expect(result).toContain('1');
  });

  test('no changes: output contains No changes detected', () => {
    const result = renderDiff(makeDiffResult([]));
    expect(result).toContain('No changes detected');
  });
});
