module.exports = {
  id: 'example-quality',
  severity: 'warn',
  description: 'Checks if examples follow consistent format',

  check(parsedPrompt) {
    const issues = [];
    const examples = parsedPrompt.sections.find(s => s.type === 'examples');
    if (!examples || examples.lines.length < 2) return issues;

    const formats = examples.lines.map(line => detectFormat(line));

    // Check consistency
    const uniqueFormats = new Set(formats);
    if (uniqueFormats.size > 1) {
      issues.push({
        message: `Examples use inconsistent formats: ${[...uniqueFormats].join(', ')}. Use a consistent structure across all examples.`,
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

function detectFormat(line) {
  if (/→/.test(line)) return 'arrow (→)';
  if (/->/.test(line)) return 'arrow (->)';
  if (/:\s/.test(line) && /\bUser\b/.test(line)) return 'colon-separated';
  if (/Q:/.test(line)) return 'Q/A format';
  if (/Input:/.test(line)) return 'Input/Output format';
  return 'plain';
}
