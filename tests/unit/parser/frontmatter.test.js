const {
  parseFrontmatter,
  hasFrontmatter,
} = require('../../../src/parser/frontmatter');

describe('parseFrontmatter', () => {
  test('parses valid YAML frontmatter with all fields', () => {
    const input = '---\nname: test\nversion: 3\nauthor: hadi\n---\nbody';
    const result = parseFrontmatter(input);
    expect(result.meta.name).toBe('test');
    expect(result.meta.version).toBe(3);
    expect(result.meta.author).toBe('hadi');
    expect(result.body).toBe('body');
  });

  test('missing fields result in undefined values', () => {
    const input = '---\nname: test\n---\nbody';
    const result = parseFrontmatter(input);
    expect(result.meta.name).toBe('test');
    expect(result.meta.version).toBeUndefined();
  });

  test('tags as YAML array are parsed correctly', () => {
    const input = '---\ntags: [a, b, c]\n---\n';
    const result = parseFrontmatter(input);
    expect(Array.isArray(result.meta.tags)).toBe(true);
    expect(result.meta.tags).toEqual(['a', 'b', 'c']);
  });

  test('tags as comma-separated string are coerced to array', () => {
    const input = '---\ntags: "a, b, c"\n---\n';
    const result = parseFrontmatter(input);
    expect(Array.isArray(result.meta.tags)).toBe(true);
  });

  test('text with no frontmatter delimiters returns empty meta and full body', () => {
    const input = 'no yaml here';
    const result = parseFrontmatter(input);
    expect(result.meta).toBeDefined();
    expect(Object.keys(result.meta).length === 0 || result.meta.name === undefined).toBe(true);
    expect(result.body).toBe('no yaml here');
  });

  test('empty frontmatter returns empty meta and body', () => {
    const input = '---\n---\nbody';
    const result = parseFrontmatter(input);
    expect(result.meta).toBeDefined();
    expect(result.body).toBe('body');
  });

  test('invalid YAML does not crash and sets _parseError', () => {
    const input = '---\n: invalid: yaml:\n---\n';
    const result = parseFrontmatter(input);
    expect(result).toBeDefined();
    expect(result.meta._parseError).toBeDefined();
  });

  test('numeric version is stored as number', () => {
    const input = '---\nversion: 7\n---\n';
    const result = parseFrontmatter(input);
    expect(result.meta.version).toBe(7);
  });

  test('string version is coerced to number', () => {
    const input = '---\nversion: "7"\n---\n';
    const result = parseFrontmatter(input);
    expect(result.meta.version).toBe(7);
  });

  test('date field is stored as string', () => {
    const input = '---\ncreated: 2026-03-20\n---\n';
    const result = parseFrontmatter(input);
    expect(typeof result.meta.created).toBe('string');
  });
});

describe('hasFrontmatter', () => {
  test('returns true for text starting with ---', () => {
    expect(hasFrontmatter('---\nname: test\n---\n')).toBe(true);
  });

  test('returns false for text without delimiters', () => {
    expect(hasFrontmatter('no yaml here')).toBe(false);
  });
});
