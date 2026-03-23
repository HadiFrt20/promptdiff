const path = require('path');
const { parsePromptFile } = require('../../src/parser/prompt-file');
const { semanticDiff } = require('../../src/differ/semantic-diff');

const FIXTURES = path.join(__dirname, '../fixtures/prompts');

describe('diff pipeline integration', () => {
  const v3Path = path.join(FIXTURES, 'support-agent-v3.prompt');
  const v7Path = path.join(FIXTURES, 'support-agent-v7.prompt');

  test('full diff v3 vs v7: changes array has entries', () => {
    const left = parsePromptFile(v3Path);
    const right = parsePromptFile(v7Path);
    const result = semanticDiff(left, right);
    expect(result.changes.length).toBeGreaterThan(0);
  });

  test('valid JSON structure: result has left, right, summary, changes fields', () => {
    const left = parsePromptFile(v3Path);
    const right = parsePromptFile(v7Path);
    const result = semanticDiff(left, right);
    expect(result).toHaveProperty('left');
    expect(result).toHaveProperty('right');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('changes');
    expect(result.summary).toHaveProperty('added');
    expect(result.summary).toHaveProperty('removed');
    expect(result.summary).toHaveProperty('modified');
    expect(result.summary).toHaveProperty('sections_affected');
  });

  test('diff with annotations: every change has description', () => {
    const left = parsePromptFile(v3Path);
    const right = parsePromptFile(v7Path);
    const result = semanticDiff(left, right, { annotate: true });
    for (const change of result.changes) {
      expect(change).toHaveProperty('description');
      expect(typeof change.description).toBe('string');
    }
  });

  test('diff identical files: 0 changes', () => {
    const left = parsePromptFile(v3Path);
    const right = parsePromptFile(v3Path);
    const result = semanticDiff(left, right);
    expect(result.changes).toHaveLength(0);
  });

  test('diff prompt vs plain txt: both parse and diff without error', () => {
    const prompt = parsePromptFile(v3Path);
    const txt = parsePromptFile(path.join(FIXTURES, 'plain-text.txt'));
    const result = semanticDiff(prompt, txt);
    expect(result).toHaveProperty('changes');
    expect(Array.isArray(result.changes)).toBe(true);
  });

  test('changes grouped by section: section field present on all changes', () => {
    const left = parsePromptFile(v3Path);
    const right = parsePromptFile(v7Path);
    const result = semanticDiff(left, right);
    for (const change of result.changes) {
      expect(change).toHaveProperty('section');
      expect(typeof change.section).toBe('string');
    }
  });
});
