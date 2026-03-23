const { diffSectionLines } = require('../../../src/differ/section-differ');

describe('diffSectionLines', () => {
  test('identical lines are all unchanged', () => {
    const result = diffSectionLines(['a', 'b'], ['a', 'b']);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.status === 'unchanged')).toBe(true);
  });

  test('added line is detected', () => {
    const result = diffSectionLines(['a'], ['a', 'b']);
    const added = result.filter(r => r.status === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].right_line).toBe('b');
  });

  test('removed line is detected', () => {
    const result = diffSectionLines(['a', 'b'], ['a']);
    const removed = result.filter(r => r.status === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].left_line).toBe('b');
  });

  test('modified line is detected for similar lines', () => {
    const result = diffSectionLines(['Keep under 150 words'], ['Keep under 100 words']);
    const modified = result.filter(r => r.status === 'modified');
    expect(modified).toHaveLength(1);
    expect(modified[0].left_line).toBe('Keep under 150 words');
    expect(modified[0].right_line).toBe('Keep under 100 words');
  });

  test('empty left marks all as added', () => {
    const result = diffSectionLines([], ['a', 'b']);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.status === 'added')).toBe(true);
  });

  test('empty right marks all as removed', () => {
    const result = diffSectionLines(['a', 'b'], []);
    expect(result).toHaveLength(2);
    expect(result.every(r => r.status === 'removed')).toBe(true);
  });

  test('both empty returns empty array', () => {
    const result = diffSectionLines([], []);
    expect(result).toHaveLength(0);
  });
});
