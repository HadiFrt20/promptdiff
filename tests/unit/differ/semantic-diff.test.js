const path = require('path');
const { parsePromptFile } = require('../../../src/parser/prompt-file');
const { semanticDiff } = require('../../../src/differ/semantic-diff');
const FIXTURES = path.join(__dirname, '../../fixtures/prompts');

describe('semanticDiff', () => {
  test('identical prompts produce 0 changes', () => {
    const v3 = parsePromptFile(path.join(FIXTURES, 'support-agent-v3.prompt'));
    const result = semanticDiff(v3, v3);
    expect(result.changes).toHaveLength(0);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
  });

  test('full diff v3 vs v7 has added, removed, and modified changes', () => {
    const v3 = parsePromptFile(path.join(FIXTURES, 'support-agent-v3.prompt'));
    const v7 = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = semanticDiff(v3, v7);
    expect(result.summary.added).toBeGreaterThan(0);
    expect(result.summary.removed).toBeGreaterThan(0);
    expect(result.summary.modified).toBeGreaterThan(0);
  });

  test('changes reference correct section labels', () => {
    const v3 = parsePromptFile(path.join(FIXTURES, 'support-agent-v3.prompt'));
    const v7 = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = semanticDiff(v3, v7);
    const sectionLabels = result.changes.map(c => c.section);
    const knownLabels = ['PERSONA', 'CONSTRAINTS', 'EXAMPLES'];
    const hasKnown = knownLabels.some(label => sectionLabels.includes(label));
    expect(hasKnown).toBe(true);
  });

  test('added section detected when diffing minimal against all-sections', () => {
    const minimal = parsePromptFile(path.join(FIXTURES, 'minimal.prompt'));
    const allSections = parsePromptFile(path.join(FIXTURES, 'all-sections.prompt'));
    const result = semanticDiff(minimal, allSections);
    const addedChanges = result.changes.filter(c => c.type === 'added');
    expect(addedChanges.length).toBeGreaterThan(0);
  });

  test('removed section detected when diffing all-sections against minimal', () => {
    const allSections = parsePromptFile(path.join(FIXTURES, 'all-sections.prompt'));
    const minimal = parsePromptFile(path.join(FIXTURES, 'minimal.prompt'));
    const result = semanticDiff(allSections, minimal);
    const removedChanges = result.changes.filter(c => c.type === 'removed');
    expect(removedChanges.length).toBeGreaterThan(0);
  });

  test('line similarity matching shows modified/tightened instead of add+remove', () => {
    const v3 = parsePromptFile(path.join(FIXTURES, 'support-agent-v3.prompt'));
    const v7 = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = semanticDiff(v3, v7);
    const modifiedTypes = result.changes
      .filter(c => c.type === 'modified' || c.type === 'tightened')
      .map(c => c.type);
    expect(modifiedTypes.length).toBeGreaterThan(0);
  });

  test('empty prompt vs full prompt marks everything as added', () => {
    const empty = parsePromptFile(path.join(FIXTURES, 'empty.prompt'));
    const allSections = parsePromptFile(path.join(FIXTURES, 'all-sections.prompt'));
    const result = semanticDiff(empty, allSections);
    expect(result.summary.added).toBeGreaterThan(0);
    expect(result.changes.every(c => c.type === 'added')).toBe(true);
  });

  test('reversed diff swaps added and removed counts', () => {
    const v3 = parsePromptFile(path.join(FIXTURES, 'support-agent-v3.prompt'));
    const v7 = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const forward = semanticDiff(v3, v7);
    const reversed = semanticDiff(v7, v3);
    expect(forward.summary.added).toBe(reversed.summary.removed);
    expect(forward.summary.removed).toBe(reversed.summary.added);
  });

  test('sections_affected is a non-empty array for v3 vs v7', () => {
    const v3 = parsePromptFile(path.join(FIXTURES, 'support-agent-v3.prompt'));
    const v7 = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = semanticDiff(v3, v7);
    expect(Array.isArray(result.summary.sections_affected)).toBe(true);
    expect(result.summary.sections_affected.length).toBeGreaterThan(0);
  });

  test('diff with annotate option adds description field to changes', () => {
    const v3 = parsePromptFile(path.join(FIXTURES, 'support-agent-v3.prompt'));
    const v7 = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = semanticDiff(v3, v7, { annotate: true });
    expect(result.changes.length).toBeGreaterThan(0);
    for (const change of result.changes) {
      expect(change).toHaveProperty('description');
      expect(typeof change.description).toBe('string');
    }
  });

  test('diff v7 against itself produces 0 changes', () => {
    const v7 = parsePromptFile(path.join(FIXTURES, 'support-agent-v7.prompt'));
    const result = semanticDiff(v7, v7);
    expect(result.changes).toHaveLength(0);
  });

  test('diff unicode.prompt against itself produces 0 changes', () => {
    const unicode = parsePromptFile(path.join(FIXTURES, 'unicode.prompt'));
    const result = semanticDiff(unicode, unicode);
    expect(result.changes).toHaveLength(0);
  });
});
