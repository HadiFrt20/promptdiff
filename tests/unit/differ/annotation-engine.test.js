const { annotateChange, generateDescription } = require('../../../src/differ/annotation-engine');

describe('generateDescription', () => {
  test('tightened description contains both numeric values', () => {
    const desc = generateDescription({
      type: 'tightened',
      section: 'CONSTRAINTS',
      left_line: 'Keep responses under 150 words.',
      right_line: 'Keep responses under 100 words.',
    });
    expect(desc).toContain('150');
    expect(desc).toContain('100');
  });

  test('removed description mentions removal', () => {
    const desc = generateDescription({
      type: 'removed',
      section: 'EXAMPLES',
      left_line: 'Example line',
      detail: 'Removed 2 examples',
    });
    expect(desc.toLowerCase()).toMatch(/remov/);
  });

  test('added description mentions Added', () => {
    const desc = generateDescription({
      type: 'added',
      section: 'CONSTRAINTS',
      right_line: 'New rule here',
    });
    expect(desc).toMatch(/[Aa]dded/);
  });

  test('persona modification description references what changed', () => {
    const desc = generateDescription({
      type: 'modified',
      section: 'PERSONA',
      left_line: 'empathetic, concise',
      right_line: 'empathetic',
    });
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
    // Should mention the section or the word that changed
    expect(desc.toLowerCase()).toMatch(/concise|persona/);
  });

  test('description is always a string', () => {
    const desc = generateDescription({
      type: 'added',
      section: 'CONSTRAINTS',
      right_line: 'Something',
    });
    expect(typeof desc).toBe('string');
  });

  test('description length is under 100 chars for a short change', () => {
    const desc = generateDescription({
      type: 'added',
      section: 'CONSTRAINTS',
      right_line: 'Be nice.',
    });
    expect(desc.length).toBeLessThanOrEqual(100);
  });
});
