const rule = require('../../../../src/linter/rules/conflicting-constraints');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('conflicting-constraints', () => {
  test('detects billing conflict in support context', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are a customer support agent.']),
      makeSection('constraints', 'CONSTRAINTS', ['Do not discuss billing issues.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/billing/i);
  });

  test('no conflict for generic constraints', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Be polite.',
        'Respond in English.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('detects always/never conflict with shared word', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Always respond in English.',
        'Never use English for greetings.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/English/i);
  });

  test('detects conflicting numeric limits', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Keep under 100 words.',
        'Keep under 200 words.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/100/);
    expect(issues[0].message).toMatch(/200/);
  });
});
