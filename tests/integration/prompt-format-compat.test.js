const path = require('path');
const { parsePromptFile, parsePromptContent } = require('../../src/parser/prompt-file');

const FIXTURES = path.join(__dirname, '../fixtures/prompts');

describe('prompt format compatibility', () => {
  test('standard .prompt: parses correctly', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    expect(parsed).toHaveProperty('meta');
    expect(parsed).toHaveProperty('sections');
    expect(parsed).toHaveProperty('raw');
    expect(parsed).toHaveProperty('hash');
    expect(parsed.meta.name).toBe('support-agent');
    expect(parsed.sections.length).toBeGreaterThan(0);
  });

  test('no frontmatter: parses with sections', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'no-frontmatter.prompt'));
    expect(parsed.sections.length).toBeGreaterThan(0);
  });

  test('plain .txt: parses without crash', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'plain-text.txt'));
    expect(parsed).toHaveProperty('meta');
    expect(parsed).toHaveProperty('sections');
    expect(parsed).toHaveProperty('raw');
  });

  test('empty file: does not crash', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'empty.prompt'));
    expect(parsed).toHaveProperty('meta');
    expect(parsed).toHaveProperty('sections');
  });

  test('only frontmatter: parses with 0 sections', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'empty.prompt'));
    expect(parsed.sections).toHaveLength(0);
  });

  test('only sections (no-frontmatter.prompt): parses with default meta', () => {
    const parsed = parsePromptFile(path.join(FIXTURES, 'no-frontmatter.prompt'));
    expect(parsed).toHaveProperty('meta');
    expect(parsed.sections.length).toBeGreaterThan(0);
  });
});
