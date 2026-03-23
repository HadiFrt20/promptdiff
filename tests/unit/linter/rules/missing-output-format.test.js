const rule = require('../../../../src/linter/rules/missing-output-format');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}

function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('missing-output-format', () => {
  test('no format section fires', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are a helpful assistant.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/OUTPUT FORMAT/i);
  });

  test('has format type section does not fire', () => {
    const parsed = makeParsed([
      makeSection('format', 'FORMAT', ['Respond in JSON.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('has section with type format and label OUTPUT FORMAT does not fire', () => {
    const parsed = makeParsed([
      makeSection('format', 'OUTPUT FORMAT', ['Respond in plain text.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });

  test('has section with type format and label RESPONSE FORMAT does not fire', () => {
    const parsed = makeParsed([
      makeSection('format', 'RESPONSE FORMAT', ['Use markdown.']),
    ]);
    const issues = rule.check(parsed);
    expect(issues).toHaveLength(0);
  });
});
