const rule = require('../../../../src/linter/rules/role-confusion');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('role-confusion', () => {
  test('two conflicting roles fires', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', [
        'You are a teacher.',
        'You are a sales agent.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/conflicting/i);
  });

  test('single role does not fire', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', [
        'You are a teacher.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('role with specialization does not fire', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', [
        'You are a teacher specializing in math.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });
});
