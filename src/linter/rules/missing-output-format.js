module.exports = {
  id: 'missing-output-format',
  severity: 'warn',
  description: 'Warns if there is no output format section',

  check(parsedPrompt) {
    const issues = [];
    const hasFormat = parsedPrompt.sections.some(s => s.type === 'format');

    if (!hasFormat) {
      issues.push({
        message: 'No OUTPUT FORMAT section found. Models without format instructions produce inconsistent output.',
        section: null,
        line: null,
      });
    }

    return issues;
  },

  fix() {
    return null;
  },
};
