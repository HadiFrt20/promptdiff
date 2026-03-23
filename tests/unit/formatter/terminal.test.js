const terminal = require('../../../src/formatter/terminal');

describe('terminal formatter', () => {
  test('header returns string containing text', () => {
    const result = terminal.header('test header');
    expect(typeof result).toBe('string');
    expect(result).toContain('test header');
  });

  test('sectionHeader returns string containing section name', () => {
    const result = terminal.sectionHeader('PERSONA');
    expect(typeof result).toBe('string');
    expect(result).toContain('PERSONA');
  });

  test('addedLine returns string containing the text', () => {
    const result = terminal.addedLine('new line content');
    expect(typeof result).toBe('string');
    expect(result).toContain('new line content');
  });

  test('removedLine returns string containing the text', () => {
    const result = terminal.removedLine('old line content');
    expect(typeof result).toBe('string');
    expect(result).toContain('old line content');
  });

  test('summaryBar returns string with numbers', () => {
    const result = terminal.summaryBar(3, 2, 1);
    expect(typeof result).toBe('string');
    expect(result).toContain('3');
    expect(result).toContain('2');
    expect(result).toContain('1');
  });
});
