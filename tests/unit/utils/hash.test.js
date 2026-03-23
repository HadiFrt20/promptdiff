const { computeHash } = require('../../../src/utils/hash');

describe('computeHash', () => {
  test('deterministic: same content produces same hash', () => {
    const hash1 = computeHash('hello world');
    const hash2 = computeHash('hello world');
    expect(hash1).toBe(hash2);
  });

  test('different content produces different hash', () => {
    const hash1 = computeHash('hello world');
    const hash2 = computeHash('goodbye world');
    expect(hash1).not.toBe(hash2);
  });

  test('format starts with sha256:', () => {
    const hash = computeHash('test content');
    expect(hash.startsWith('sha256:')).toBe(true);
  });
});
