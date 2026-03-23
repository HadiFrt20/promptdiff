module.exports = {
  id: 'few-shot-minimum',
  severity: 'warn',
  description: 'Warns if fewer than 2 few-shot examples are provided',

  check(parsedPrompt) {
    const issues = [];
    const examplesSection = parsedPrompt.sections.find(s => s.type === 'examples');

    if (!examplesSection) {
      issues.push({
        severity: 'info',
        message: 'No EXAMPLES section found. Consider adding 2-3 examples for better model performance.',
        section: null,
        line: null,
      });
      return issues;
    }

    const exampleCount = examplesSection.lines.filter(l => l.trim().length > 0).length;

    if (exampleCount === 0) {
      issues.push({
        severity: 'info',
        message: 'EXAMPLES section is empty. Add 2-3 examples for better model performance.',
        section: 'EXAMPLES',
        line: 1,
      });
    } else if (exampleCount === 1) {
      issues.push({
        severity: 'warn',
        message: 'Only 1 few-shot example. Models perform better with 2-3 examples for classification-style tasks.',
        section: 'EXAMPLES',
        line: 1,
      });
    }

    return issues;
  },

  fix() {
    return null;
  },
};
