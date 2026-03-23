const { diffOutputs } = require('../../../src/compare/output-differ');

describe('diffOutputs', () => {
  test('shorter output: 50 words vs 100 words produces negative percent', () => {
    const left = Array(100).fill('word').join(' ');
    const right = Array(50).fill('word').join(' ');
    const result = diffOutputs(left, right);
    expect(result.length_diff_percent).toBeLessThan(0);
    expect(result.left_word_count).toBe(100);
    expect(result.right_word_count).toBe(50);
  });

  test('longer output: 100 words vs 50 words produces positive percent', () => {
    const left = Array(50).fill('word').join(' ');
    const right = Array(100).fill('word').join(' ');
    const result = diffOutputs(left, right);
    expect(result.length_diff_percent).toBeGreaterThan(0);
    expect(result.left_word_count).toBe(50);
    expect(result.right_word_count).toBe(100);
  });

  test('same length: same text produces 0 percent', () => {
    const text = 'hello world foo bar baz';
    const result = diffOutputs(text, text);
    expect(result.length_diff_percent).toBe(0);
    expect(result.summary).toContain('same length');
  });
});
