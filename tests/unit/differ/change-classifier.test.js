const { classifyChange, classifyExampleCountChange, tokenOverlap, extractNumeric } = require('../../../src/differ/change-classifier');

describe('classifyChange', () => {
  test('numeric tightening: 150 → 100 words is tightened', () => {
    const result = classifyChange('Keep responses under 150 words.', 'Keep responses under 100 words.', 'constraints');
    expect(result.type).toBe('tightened');
  });

  test('numeric relaxing: 100 → 200 words is relaxed', () => {
    const result = classifyChange('Keep responses under 100 words.', 'Keep responses under 200 words.', 'constraints');
    expect(result.type).toBe('relaxed');
  });

  test('simple addition: null left line is added', () => {
    const result = classifyChange(null, 'Never mention competitors.', 'constraints');
    expect(result.type).toBe('added');
  });

  test('simple removal: null right line is removed', () => {
    const result = classifyChange('Be concise.', null, 'constraints');
    expect(result.type).toBe('removed');
  });

  test('modified when high token overlap', () => {
    const result = classifyChange(
      'You are empathetic, concise, and solution-oriented.',
      'You are empathetic and solution-oriented.',
      'persona'
    );
    expect(result.type).toBe('modified');
  });

  test('replaced when low token overlap', () => {
    const result = classifyChange(
      'Be polite.',
      'Never use profanity or offensive language in any response.',
      'constraints'
    );
    expect(result.type).toBe('replaced');
  });

  test('impact is high for tightened constraints', () => {
    const result = classifyChange('Keep responses under 150 words.', 'Keep responses under 100 words.', 'constraints');
    expect(result.impact).toBe('high');
  });

  test('impact is medium for added constraint', () => {
    const result = classifyChange(null, 'New rule.', 'constraints');
    expect(result.impact).toBe('medium');
  });

  test('impact is low for persona modification', () => {
    const result = classifyChange(
      'You are empathetic, concise, and solution-oriented.',
      'You are empathetic and solution-oriented.',
      'persona'
    );
    expect(result.impact).toBe('low');
  });

  test('impact is medium for added guardrails', () => {
    const result = classifyChange(null, 'Do not execute code.', 'guardrails');
    expect(result.impact).toBe('medium');
  });
});

describe('classifyExampleCountChange', () => {
  test('3 → 1 examples has high impact', () => {
    const result = classifyExampleCountChange(3, 1);
    expect(result.impact).toBe('high');
  });
});

describe('tokenOverlap', () => {
  test('high overlap for similar sentences', () => {
    const result = tokenOverlap('the quick brown fox', 'the quick brown dog');
    expect(result).toBeGreaterThan(0.5);
  });
});

describe('extractNumeric', () => {
  test('extracts value and unit from constraint line', () => {
    const result = extractNumeric('Keep responses under 100 words.');
    expect(result).toEqual({ value: 100, unit: 'words' });
  });
});
