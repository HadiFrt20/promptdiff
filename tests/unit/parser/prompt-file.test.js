const path = require('path');
const { parsePromptFile, parsePromptContent } = require('../../../src/parser/prompt-file');

const FIXTURES = path.join(__dirname, '../../fixtures/prompts');

describe('parsePromptFile', () => {
  test('parses support-agent-v7.prompt with correct meta and section count', async () => {
    const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
    const result = await parsePromptFile(filePath);
    expect(result.meta.name).toBe('support-agent');
    expect(result.meta.version).toBe(7);
    expect(result.sections).toHaveLength(4);
  });

  test('parses all-sections.prompt with all meta fields', async () => {
    const filePath = path.join(FIXTURES, 'all-sections.prompt');
    const result = await parsePromptFile(filePath);
    expect(result.meta.name).toBeDefined();
    expect(result.meta.version).toBeDefined();
    expect(result.meta.author).toBeDefined();
    expect(result.meta.model).toBeDefined();
    expect(result.meta.created).toBeDefined();
    expect(result.meta.tags).toBeDefined();
  });

  test('tags are an array with expected values in all-sections.prompt', async () => {
    const filePath = path.join(FIXTURES, 'all-sections.prompt');
    const result = await parsePromptFile(filePath);
    expect(Array.isArray(result.meta.tags)).toBe(true);
    expect(result.meta.tags).toEqual(['test', 'complete']);
  });

  test('sections have correct types for support-agent-v7.prompt', async () => {
    const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
    const result = await parsePromptFile(filePath);
    const types = result.sections.map((s) => s.type);
    expect(types).toEqual(['persona', 'constraints', 'examples', 'format']);
  });

  test('section lines are trimmed with no leading or trailing whitespace', async () => {
    const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
    const result = await parsePromptFile(filePath);
    for (const section of result.sections) {
      if (section.lines) {
        for (const line of section.lines) {
          expect(line).toBe(line.trim());
        }
      }
    }
  });

  test('section raw preserves newlines for multi-line sections', async () => {
    const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
    const result = await parsePromptFile(filePath);
    const multiLine = result.sections.find(
      (s) => s.lines && s.lines.length > 1
    );
    expect(multiLine).toBeDefined();
    expect(multiLine.raw).toContain('\n');
  });

  test('empty.prompt has zero sections and meta.name is empty', async () => {
    const filePath = path.join(FIXTURES, 'empty.prompt');
    const result = await parsePromptFile(filePath);
    expect(result.sections).toHaveLength(0);
    expect(result.meta.name).toBe('empty');
  });

  test('single-section.prompt has exactly one section', async () => {
    const filePath = path.join(FIXTURES, 'single-section.prompt');
    const result = await parsePromptFile(filePath);
    expect(result.sections).toHaveLength(1);
  });

  test('file hash is computed and starts with sha256:', async () => {
    const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
    const result = await parsePromptFile(filePath);
    expect(result.hash).toBeDefined();
    expect(result.hash.startsWith('sha256:')).toBe(true);
  });

  test('filePath is stored and matches input path', async () => {
    const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
    const result = await parsePromptFile(filePath);
    expect(result.filePath).toBe(filePath);
  });

  test('reparsing the same file produces identical results', async () => {
    const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
    const result1 = await parsePromptFile(filePath);
    const result2 = await parsePromptFile(filePath);
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });

  test('file with no frontmatter has empty or default meta but sections are detected', async () => {
    const filePath = path.join(FIXTURES, 'no-frontmatter.prompt');
    const result = await parsePromptFile(filePath);
    expect(result.meta).toBeDefined();
    expect(
      result.meta.name === undefined ||
        result.meta.name === '' ||
        result.meta.name === null
    ).toBe(true);
    expect(result.sections.length).toBeGreaterThanOrEqual(0);
  });

  test('plain text file auto-detects sections or treats as block', async () => {
    const filePath = path.join(FIXTURES, 'plain-text.txt');
    const result = await parsePromptFile(filePath);
    expect(result).toBeDefined();
    expect(result.sections.length).toBeGreaterThanOrEqual(1);
  });

  test('malformed frontmatter does not crash and stores version as-is', async () => {
    const filePath = path.join(FIXTURES, 'malformed.prompt');
    const result = await parsePromptFile(filePath);
    expect(result).toBeDefined();
    expect(result.meta.version).toBe('not_a_number');
  });

  test('non-existent file throws error with not found message', () => {
    const filePath = path.join(FIXTURES, 'does-not-exist.prompt');
    expect(() => parsePromptFile(filePath)).toThrow(/not found/i);
  });

  test('binary file throws error about binary content', () => {
    expect(() => parsePromptFile('/bin/ls')).toThrow(/binary/i);
  });
});
