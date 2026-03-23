const path = require('path');
const { parsePromptFile } = require('../../../src/parser/prompt-file');
const { compose } = require('../../../src/parser/composer');

const FIXTURES = path.join(__dirname, '../../fixtures/prompts');

describe('composer', () => {
  describe('extends', () => {
    test('child inherits parent sections not defined in child', () => {
      const filePath = path.join(FIXTURES, 'child-agent.prompt');
      const result = parsePromptFile(filePath);

      expect(result.composed).toBe(true);

      // Child only defines Constraints, so Persona and Format come from parent
      const labels = result.sections.map(s => s.label);
      expect(labels).toContain('Persona');
      expect(labels).toContain('Constraints');
      expect(labels).toContain('Format');
    });

    test('child Constraints replaces parent Constraints', () => {
      const filePath = path.join(FIXTURES, 'child-agent.prompt');
      const result = parsePromptFile(filePath);

      const constraints = result.sections.find(s => s.label === 'Constraints');
      expect(constraints.lines).toEqual(['Be concise and direct.']);
      // Parent constraints should NOT be present
      expect(constraints.raw).not.toContain('Always be polite');
    });

    test('parent Persona is inherited as-is', () => {
      const filePath = path.join(FIXTURES, 'child-agent.prompt');
      const result = parsePromptFile(filePath);

      const persona = result.sections.find(s => s.label === 'Persona');
      expect(persona.lines).toContain('You are a helpful assistant.');
    });

    test('raw preserves original file content', () => {
      const filePath = path.join(FIXTURES, 'child-agent.prompt');
      const result = parsePromptFile(filePath);
      expect(result.raw).toContain('extends: ./base-agent.prompt');
    });
  });

  describe('includes', () => {
    test('included sections are merged into current prompt', () => {
      const filePath = path.join(FIXTURES, 'includes-agent.prompt');
      const result = parsePromptFile(filePath);

      expect(result.composed).toBe(true);

      const labels = result.sections.map(s => s.label);
      expect(labels).toContain('Guardrails');
      expect(labels).toContain('Format');
      expect(labels).toContain('Persona');
    });

    test('matching sections concatenate lines (included first, then current)', () => {
      const filePath = path.join(FIXTURES, 'includes-agent.prompt');
      const result = parsePromptFile(filePath);

      const format = result.sections.find(s => s.label === 'Format');
      // Included format lines come first
      expect(format.lines[0]).toBe('Use markdown for responses.');
      expect(format.lines[1]).toBe('Include headings where appropriate.');
      // Current file's format lines come after
      expect(format.lines[2]).toBe('Always include code examples.');
    });

    test('sections from includes that do not exist in current are added', () => {
      const filePath = path.join(FIXTURES, 'includes-agent.prompt');
      const result = parsePromptFile(filePath);

      const guardrails = result.sections.find(s => s.label === 'Guardrails');
      expect(guardrails).toBeDefined();
      expect(guardrails.lines).toContain('Never generate harmful content.');
    });
  });

  describe('extends + includes combined', () => {
    test('extends and includes both work together', () => {
      const filePath = path.join(FIXTURES, 'extends-and-includes.prompt');
      const result = parsePromptFile(filePath);

      expect(result.composed).toBe(true);

      const labels = result.sections.map(s => s.label);
      // From parent: Persona, Format
      expect(labels).toContain('Persona');
      expect(labels).toContain('Format');
      // From includes: Guardrails
      expect(labels).toContain('Guardrails');
      // From child (replaces parent): Constraints
      expect(labels).toContain('Constraints');
    });

    test('child Constraints overrides parent in extends+includes', () => {
      const filePath = path.join(FIXTURES, 'extends-and-includes.prompt');
      const result = parsePromptFile(filePath);

      const constraints = result.sections.find(s => s.label === 'Constraints');
      expect(constraints.lines).toEqual(['Follow company policy at all times.']);
    });
  });

  describe('no composition', () => {
    test('prompt without extends or includes is not composed', () => {
      const filePath = path.join(FIXTURES, 'support-agent-v7.prompt');
      const result = parsePromptFile(filePath);

      expect(result.composed).toBeUndefined();
    });

    test('--no-compose option skips composition', () => {
      const filePath = path.join(FIXTURES, 'child-agent.prompt');
      const result = parsePromptFile(filePath, { compose: false });

      expect(result.composed).toBeUndefined();
      // Should only have the child's own section
      const labels = result.sections.map(s => s.label);
      expect(labels).toEqual(['Constraints']);
    });
  });

  describe('circular includes', () => {
    test('circular includes throw an error', () => {
      const filePath = path.join(FIXTURES, 'circular-a.prompt');
      expect(() => parsePromptFile(filePath)).toThrow(/[Cc]ircular/);
    });
  });
});
