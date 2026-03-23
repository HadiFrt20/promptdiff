const rule = require('../../../../src/linter/rules/word-limit-conflict');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('word-limit-conflict', () => {
  test('example exceeding word limit fires', () => {
    const longResponse = Array(160).fill('word').join(' ');
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Keep under 100 words.']),
      makeSection('examples', 'EXAMPLES', [
        `User: Tell me a story → Agent: ${longResponse}`,
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/100/);
  });

  test('example within word limit does not fire', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Keep under 200 words.']),
      makeSection('examples', 'EXAMPLES', [
        'User: Hi → Agent: Hello there, how can I help you today?',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('no word limit set does not fire', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Be polite.']),
      makeSection('examples', 'EXAMPLES', [
        'User: Hi → Agent: Hello',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('no examples does not fire', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Keep under 100 words.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });
});
