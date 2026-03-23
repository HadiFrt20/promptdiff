const rule = require('../../../../src/linter/rules/example-quality');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('example-quality', () => {
  test('examples with different structures fires', () => {
    const parsed = makeParsed([
      makeSection('examples', 'EXAMPLES', [
        'User: Hello → Agent: Hi there',
        'User: Goodbye: Agent: See you later',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/inconsistent/i);
  });

  test('all same format does not fire', () => {
    const parsed = makeParsed([
      makeSection('examples', 'EXAMPLES', [
        'User: Hello → Agent: Hi there',
        'User: Bye → Agent: Goodbye',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('single example does not fire', () => {
    const parsed = makeParsed([
      makeSection('examples', 'EXAMPLES', [
        'User: Hello → Agent: Hi there',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });
});
