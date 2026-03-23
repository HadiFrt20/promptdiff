const rule = require('../../../../src/linter/rules/redundant-instructions');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('redundant-instructions', () => {
  test('high overlap lines fire', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Be concise and short in your responses.',
        'Be short and concise in your responses.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/redundant/i);
  });

  test('different enough lines do not fire', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Be polite and respectful.',
        'Never use profanity or offensive language.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('same line repeated verbatim fires', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Never lie.',
        'Never lie.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/[Dd]uplicate/);
  });
});
