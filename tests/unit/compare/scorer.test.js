const { scoreOutput, extractConstraints } = require('../../../src/compare/scorer');

function makeParsed(sections = [], meta = {}) {
  return { meta, sections, raw: '', filePath: 'test.prompt', hash: 'sha256:test' };
}
function makeSection(type, label, lines) {
  return { type, label, lines, raw: lines.join('\n') };
}

describe('scoreOutput', () => {
  test('all constraints met: output follows word limit and avoids forbidden topics', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Keep responses under 100 words.',
        'Do not mention billing or refunds.',
      ]),
    ]);
    const output = 'Thank you for reaching out. I have resolved your issue and the fix is now live.';
    const result = scoreOutput(output, parsed);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.flags.every(f => f.type === 'pass')).toBe(true);
  });

  test('word limit violated: 200 words when limit is 100', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Keep responses under 100 words.',
      ]),
    ]);
    const output = Array(200).fill('word').join(' ');
    const result = scoreOutput(output, parsed);
    expect(result.score).toBeLessThan(100);
    const violation = result.flags.find(f => f.rule === 'word-limit');
    expect(violation).toBeDefined();
    expect(violation.type).toBe('violation');
  });

  test('forbidden topic mentioned: output says billing', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', [
        'Do not discuss billing or pricing.',
      ]),
    ]);
    const output = 'Let me help you with your billing issue right away.';
    const result = scoreOutput(output, parsed);
    const violation = result.flags.find(f => f.rule === 'forbidden-topic');
    expect(violation).toBeDefined();
    expect(violation.type).toBe('violation');
  });

  test('required element missing: sign-off without ticket number', () => {
    const parsed = makeParsed([
      makeSection('format', 'OUTPUT FORMAT', [
        'Sign off with your name and a ticket number.',
      ]),
    ]);
    const output = 'I have resolved your issue. Best regards, Sarah';
    const result = scoreOutput(output, parsed);
    const violation = result.flags.find(f => f.rule === 'ticket-number');
    expect(violation).toBeDefined();
    expect(violation.type).toBe('violation');
  });

  test('empty output: score is 0', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Keep responses under 100 words.']),
    ]);
    const result = scoreOutput('', parsed);
    expect(result.score).toBe(0);
    expect(result.word_count).toBe(0);
  });

  test('no constraints extractable: prompt with no constraints section scores high', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are a helpful assistant.']),
    ]);
    const output = 'Here is your answer. Have a great day!';
    const result = scoreOutput(output, parsed);
    expect(result.score).toBe(100);
  });

  test('word count extraction is correct for hello world foo bar', () => {
    const parsed = makeParsed([]);
    const result = scoreOutput('hello world foo bar', parsed);
    expect(result.word_count).toBe(4);
  });
});

describe('extractConstraints', () => {
  test('extracts word-limit constraint', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Keep responses under 100 words.']),
    ]);
    const constraints = extractConstraints(parsed);
    expect(constraints.some(c => c.type === 'word-limit' && c.value === 100)).toBe(true);
  });

  test('extracts forbidden-topic constraint', () => {
    const parsed = makeParsed([
      makeSection('constraints', 'CONSTRAINTS', ['Do not discuss billing or pricing.']),
    ]);
    const constraints = extractConstraints(parsed);
    expect(constraints.some(c => c.type === 'forbidden-topic')).toBe(true);
  });

  test('returns empty array when no constraints or format sections', () => {
    const parsed = makeParsed([
      makeSection('persona', 'PERSONA', ['You are a helpful assistant.']),
    ]);
    const constraints = extractConstraints(parsed);
    expect(constraints).toEqual([]);
  });
});
