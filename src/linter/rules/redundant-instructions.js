const { tokenOverlap } = require('../../differ/change-classifier');

module.exports = {
  id: 'redundant-instructions',
  severity: 'warn',
  description: 'Detects lines that say the same thing in different words',

  check(parsedPrompt) {
    const issues = [];

    for (const section of parsedPrompt.sections) {
      const lines = section.lines;
      for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[i] === lines[j]) {
            issues.push({
              message: `Duplicate line in ${section.label}: "${lines[i]}"`,
              section: section.label,
              line: j + 1,
            });
          } else {
            const overlap = tokenOverlap(lines[i], lines[j]);
            if (overlap >= 0.75) {
              issues.push({
                message: `Potentially redundant instructions in ${section.label}: "${lines[i]}" and "${lines[j]}"`,
                section: section.label,
                line: j + 1,
              });
            }
          }
        }
      }
    }

    return issues;
  },

  fix() {
    return null;
  },
};
