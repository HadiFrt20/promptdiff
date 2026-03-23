const rule = require('../../../../src/linter/rules/vague-constraints');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('vague-constraints', () => {
  test('"Try to be concise" fires', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Try to be concise.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/try to/i);
  });

  test('"If possible, use examples" fires', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['If possible, use examples.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/if possible/i);
  });

  test('"Generally keep it short" fires', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Generally keep it short.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/generally/i);
  });

  test('"Maybe include a summary" fires', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Maybe include a summary.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/maybe/i);
  });

  test('"Never use profanity." does not fire', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Never use profanity.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });
});
