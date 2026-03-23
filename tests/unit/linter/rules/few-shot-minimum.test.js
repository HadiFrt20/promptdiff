const rule = require('../../../../src/linter/rules/few-shot-minimum');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('few-shot-minimum', () => {
  test('no examples section returns info', () => {
    const parsed = makeParsed([]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('info');
  });

  test('1 example returns warn', () => {
    const parsed = makeParsed([
      makeSection('examples', 'EXAMPLES', ['User: Hi → Agent: Hello']),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warn');
  });

  test('2 examples returns empty array', () => {
    const parsed = makeParsed([
      makeSection('examples', 'EXAMPLES', [
        'User: Hi → Agent: Hello',
        'User: Bye → Agent: Goodbye',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('3+ examples returns empty array', () => {
    const parsed = makeParsed([
      makeSection('examples', 'EXAMPLES', [
        'User: Hi → Agent: Hello',
        'User: Bye → Agent: Goodbye',
        'User: Thanks → Agent: Welcome',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('empty EXAMPLES section returns info', () => {
    const parsed = makeParsed([
      makeSection('examples', 'EXAMPLES', []),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('info');
  });
});
