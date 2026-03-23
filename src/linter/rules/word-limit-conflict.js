module.exports = {
  id: 'word-limit-conflict',
  severity: 'warn',
  description: 'Warns if examples exceed the word limit set in constraints',

  check(parsedPrompt) {
    const issues = [];
    const constraints = parsedPrompt.sections.find(s => s.type === 'constraints');
    const examples = parsedPrompt.sections.find(s => s.type === 'examples');

    if (!constraints || !examples) return issues;

    // Extract word limit
    let wordLimit = null;
    for (const line of constraints.lines) {
      const match = line.match(/(\d+)\s*words?/i);
      if (match) {
        wordLimit = parseInt(match[1], 10);
        break;
      }
    }

    if (!wordLimit) return issues;

    // Check each example
    for (let i = 0; i < examples.lines.length; i++) {
      const line = examples.lines[i];
      // Extract the agent response part (after → Agent: or similar)
      const agentResponse = line.replace(/^.*?(?:→|->)\s*(?:Agent:\s*)?/i, '');
      const wordCount = agentResponse.split(/\s+/).filter(w => w.length > 0).length;

      if (wordCount > wordLimit) {
        issues.push({
          message: `Example ${i + 1} has ${wordCount} words in the response, exceeding the ${wordLimit} word limit.`,
          section: 'EXAMPLES',
          line: i + 1,
        });
      }
    }

    return issues;
  },

  fix() {
    return null;
  },
};
