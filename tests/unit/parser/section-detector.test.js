const {
  detectSectionType,
  isSectionHeader,
  parseSectionHeader,
  detectSectionsFromText,
  autoDetectSections,
  TYPE_MAP,
} = require('../../../src/parser/section-detector');

describe('section-detector', () => {
  test('detects standard header "# PERSONA"', () => {
    expect(isSectionHeader('# PERSONA')).toBe(true);
    expect(parseSectionHeader('# PERSONA')).toBe('PERSONA');
    expect(detectSectionType('PERSONA')).toBe('persona');
  });

  test('detectSectionType is case insensitive', () => {
    expect(detectSectionType('persona')).toBe('persona');
    expect(detectSectionType('Persona')).toBe('persona');
    expect(detectSectionType('PERSONA')).toBe('persona');
  });

  test('alternate names map to canonical types', () => {
    expect(detectSectionType('ROLE')).toBe('persona');
    expect(detectSectionType('RULES')).toBe('constraints');
    expect(detectSectionType('FEW-SHOT')).toBe('examples');
  });

  test('unknown section name returns custom type', () => {
    expect(detectSectionType('MY CUSTOM SECTION')).toBe('custom');
  });

  test('line without hash prefix is not a section header', () => {
    expect(isSectionHeader('PERSONA')).toBe(false);
  });

  test('section header with extra spaces is still detected', () => {
    expect(isSectionHeader('#  PERSONA  ')).toBe(true);
    expect(parseSectionHeader('#  PERSONA  ')).toBe('PERSONA');
  });

  test('multi-word section OUTPUT FORMAT maps to format', () => {
    expect(detectSectionType('OUTPUT FORMAT')).toBe('format');
  });

  test('parseSectionHeader returns only the header name, not content after it', () => {
    const result = parseSectionHeader('# PERSONA');
    expect(result).toBe('PERSONA');
    expect(result).not.toContain('\n');
  });

  test('detectSectionsFromText strips empty lines after header', () => {
    const text = '# PERSONA\n\nYou are helpful.';
    const sections = detectSectionsFromText(text);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const persona = sections.find((s) => s.type === 'persona');
    expect(persona).toBeDefined();
    const nonEmptyLines = persona.lines.filter((l) => l.trim() !== '');
    expect(nonEmptyLines).toHaveLength(1);
    expect(nonEmptyLines[0]).toBe('You are helpful.');
  });

  test('autoDetectSections infers persona and constraints from plain text', () => {
    const text = 'You are a helpful bot.\nNever lie.\nAlways be concise.';
    const sections = autoDetectSections(text);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const types = sections.map((s) => s.type);
    expect(types).toEqual(expect.arrayContaining(['persona', 'constraints']));
  });
});
