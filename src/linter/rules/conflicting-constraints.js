module.exports = {
  id: 'conflicting-constraints',
  severity: 'error',
  description: 'Detects constraints that contradict each other',

  check(parsedPrompt) {
    const issues = [];
    const constraintSection = parsedPrompt.sections.find(s => s.type === 'constraints');
    if (!constraintSection) return issues;

    const lines = constraintSection.lines;

    // Check for always/never contradictions
    const alwaysRules = [];
    const neverRules = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (/^always\b/.test(line)) {
        alwaysRules.push({ line: lines[i], index: i });
      }
      if (/^(never|do not|don't)\b/.test(line)) {
        neverRules.push({ line: lines[i], index: i });
      }
    }

    // Check for topic contradictions
    for (const always of alwaysRules) {
      for (const never of neverRules) {
        const alwaysWords = new Set(always.line.toLowerCase().replace(/[.,!?;:'"]/g, '').split(/\s+/));
        const neverWords = new Set(never.line.toLowerCase().replace(/[.,!?;:'"]/g, '').split(/\s+/));
        const overlap = [...alwaysWords].filter(w =>
          neverWords.has(w) && w.length > 3 && !['always', 'never', 'that', 'this', 'with', 'from', 'about'].includes(w)
        );
        if (overlap.length > 0) {
          issues.push({
            message: `"${always.line}" may conflict with "${never.line}"`,
            section: 'CONSTRAINTS',
            line: always.index + 1,
          });
        }
      }
    }

    // Check for conflicting numeric limits
    const numericConstraints = [];
    const numPattern = /(\d+)\s*(words?|characters?|sentences?)/i;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(numPattern);
      if (match) {
        numericConstraints.push({
          value: parseInt(match[1]),
          unit: match[2].toLowerCase(),
          index: i,
          line: lines[i],
        });
      }
    }

    for (let i = 0; i < numericConstraints.length; i++) {
      for (let j = i + 1; j < numericConstraints.length; j++) {
        if (numericConstraints[i].unit === numericConstraints[j].unit &&
            numericConstraints[i].value !== numericConstraints[j].value) {
          issues.push({
            message: `Conflicting ${numericConstraints[i].unit} limits: ${numericConstraints[i].value} vs ${numericConstraints[j].value}`,
            section: 'CONSTRAINTS',
            line: numericConstraints[j].index + 1,
          });
        }
      }
    }

    // Check for "do not discuss" patterns in support context
    const persona = parsedPrompt.sections.find(s => s.type === 'persona');
    if (persona) {
      const personaText = persona.raw.toLowerCase();
      const isSupport = personaText.includes('support') || personaText.includes('help desk') || personaText.includes('customer service');

      if (isSupport) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          if (/do not discuss|don't discuss/.test(line) && /billing|pricing|refund|payment/.test(line)) {
            issues.push({
              message: `"${lines[i]}" conflicts with support context where billing questions are common. Add an explicit redirect template.`,
              section: 'CONSTRAINTS',
              line: i + 1,
            });
          }
        }
      }
    }

    return issues;
  },

  fix(parsedPrompt) {
    const constraintSection = parsedPrompt.sections.find(s => s.type === 'constraints');
    if (!constraintSection) return null;

    const persona = parsedPrompt.sections.find(s => s.type === 'persona');
    if (!persona) return null;

    const personaText = persona.raw.toLowerCase();
    const isSupport = personaText.includes('support');

    if (isSupport) {
      for (const line of constraintSection.lines) {
        if (/do not discuss|don't discuss/.test(line.toLowerCase()) && /billing|pricing|refund/.test(line.toLowerCase())) {
          return {
            description: 'Add to CONSTRAINTS section: \'For billing questions, respond: "I\'ll connect you with our billing team who can resolve this fastest."\'',
            patch: {
              section: 'CONSTRAINTS',
              action: 'append',
              content: 'For billing questions, respond: "I\'ll connect you with our billing team who can resolve this fastest."',
            },
          };
        }
      }
    }

    return null;
  },
};
