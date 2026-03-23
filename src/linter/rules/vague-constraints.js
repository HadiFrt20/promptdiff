const VAGUE_PATTERNS = [
  { pattern: /\btry to\b/i, word: 'try to' },
  { pattern: /\bif possible\b/i, word: 'if possible' },
  { pattern: /\bgenerally\b/i, word: 'generally' },
  { pattern: /\bmaybe\b/i, word: 'maybe' },
  { pattern: /\bsort of\b/i, word: 'sort of' },
  { pattern: /\bkind of\b/i, word: 'kind of' },
  { pattern: /\bprobably\b/i, word: 'probably' },
  { pattern: /\bsomewhat\b/i, word: 'somewhat' },
  { pattern: /\bmight want to\b/i, word: 'might want to' },
  { pattern: /\bconsider\b/i, word: 'consider' },
];

module.exports = {
  id: 'vague-constraints',
  severity: 'warn',
  description: 'Detects vague language in constraints',

  check(parsedPrompt) {
    const issues = [];
    const constraintSection = parsedPrompt.sections.find(s => s.type === 'constraints');
    if (!constraintSection) return issues;

    for (let i = 0; i < constraintSection.lines.length; i++) {
      const line = constraintSection.lines[i];
      for (const { pattern, word } of VAGUE_PATTERNS) {
        if (pattern.test(line)) {
          issues.push({
            message: `Vague language "${word}" in constraint: "${line}". Make constraints absolute.`,
            section: 'CONSTRAINTS',
            line: i + 1,
          });
          break;
        }
      }
    }

    return issues;
  },

  fix() {
    return null;
  },
};
