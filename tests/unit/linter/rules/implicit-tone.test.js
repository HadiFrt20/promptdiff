const rule = require('../../../../src/linter/rules/implicit-tone');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('implicit-tone', () => {
  test('persona says empathetic but examples do not show it fires', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are an empathetic assistant.']),
      makeSection('examples', 'EXAMPLES', [
        'User: My order is late → Agent: Your order number is 123.',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/empathetic/i);
  });

  test('persona says formal, examples use formal indicators, does not fire', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are a formal assistant.']),
      makeSection('examples', 'EXAMPLES', [
        'User: Question → Agent: Please note that regarding your inquiry, we will follow up.',
      ]),
    ]);
    const issues = rule.check(parsed);
    const toneIssues = issues.filter(i => i.message.includes('formal'));
    expect(toneIssues).toHaveLength(0);
  });

  test('no persona tone words does not fire', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are an assistant.']),
      makeSection('examples', 'EXAMPLES', [
        'User: Hi → Agent: Hello',
      ]),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('no examples section does not fire', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are an empathetic assistant.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });
});
