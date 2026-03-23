const path = require('path');
const { parsePromptFile, parsePromptContent } = require('../../src/parser/prompt-file');
const { lint, loadRules } = require('../../src/linter/engine');

const FIXTURES = path.join(__dirname, '../fixtures/prompts');

describe('lint pipeline integration', () => {
  test('lint v7: results include conflicting-constraints and few-shot-minimum', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = lint(parsed);
    const ruleIds = result.results.map(r => r.rule);
    expect(ruleIds).toContain('conflicting-constraints');
    expect(ruleIds).toContain('few-shot-minimum');
  });

  test('lint with fix: fixable array is non-empty for v7', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = lint(parsed);
    expect(result.fixable.length).toBeGreaterThan(0);
  });

  test('all rules load: loadRules returns 10 rules', () => {
    const rules = loadRules();
    expect(rules).toHaveLength(10);
  });

  test('lint unicode: no encoding errors', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'unicode.prompt'));
    const result = lint(parsed);
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.results)).toBe(true);
  });

  test('lint malformed: does not crash', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'malformed.prompt'));
    const result = lint(parsed);
    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('summary');
  });

  test('clean prompt: minimal issues', () => {
    const content = [
      '---',
      'name: clean-test',
      'version: 1',
      '---',
      '',
      '# PERSONA',
      'You are a helpful and professional assistant.',
      '',
      '# CONSTRAINTS',
      'Keep responses under 200 words.',
      'Always be polite.',
      '',
      '# EXAMPLES',
      'User: Hello → Agent: Hi there! How can I help you today?',
      'User: Thanks → Agent: You are welcome! Let me know if you need anything else.',
      'User: Bye → Agent: Goodbye! Have a great day.',
      '',
      '# OUTPUT FORMAT',
      'Respond in plain text.',
    ].join('\n');
    const parsed = parsePromptContent(content, 'clean.prompt');
    const result = lint(parsed);
    expect(result.summary.errors).toBe(0);
  });
});
