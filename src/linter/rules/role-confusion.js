// Words that indicate a trait/adjective, not a role
const TRAIT_WORDS = new Set([
  'empathetic', 'concise', 'solution-oriented', 'friendly', 'helpful',
  'professional', 'polite', 'formal', 'casual', 'warm', 'stern',
  'patient', 'thorough', 'detail-oriented', 'creative', 'analytical',
  'experienced', 'knowledgeable', 'skilled', 'careful', 'precise',
]);

function isTraitOnly(role) {
  const words = role.replace(/[.,]/g, '').split(/\s+/).filter(w => w.length > 1);
  // If every significant word is a trait or connector, it's not a role
  const connectors = new Set(['and', 'or', 'but', 'yet', 'very', 'highly']);
  return words.every(w => TRAIT_WORDS.has(w) || connectors.has(w));
}

module.exports = {
  id: 'role-confusion',
  severity: 'error',
  description: 'Detects conflicting roles in persona section',

  check(parsedPrompt) {
    const issues = [];
    const persona = parsedPrompt.sections.find(s => s.type === 'persona');
    if (!persona) return issues;

    const rolePattern = /you are (?:a |an )?(.+?)(?:\.|$)/gi;
    const roles = [];

    for (let i = 0; i < persona.lines.length; i++) {
      const line = persona.lines[i];
      let match;
      while ((match = rolePattern.exec(line)) !== null) {
        const role = match[1].trim().toLowerCase();
        // Skip pure trait descriptions
        if (!isTraitOnly(role)) {
          roles.push({
            role,
            line: i + 1,
            full: match[0],
          });
        }
      }
      rolePattern.lastIndex = 0;
    }

    // Filter out specializations/qualifiers
    const primaryRoles = roles.filter(r => {
      return !r.role.includes('specializing') &&
             !r.role.includes('who ') &&
             !r.role.includes('that ');
    });

    if (primaryRoles.length >= 2) {
      const roleNames = primaryRoles.map(r => r.role);
      const uniqueBaseRoles = new Set(roleNames.map(r => {
        return r.replace(/senior |junior |expert |experienced |skilled /g, '').trim();
      }));

      if (uniqueBaseRoles.size >= 2) {
        issues.push({
          message: `Multiple potentially conflicting roles: ${[...uniqueBaseRoles].map(r => `"${r}"`).join(' and ')}`,
          section: 'PERSONA',
          line: primaryRoles[1].line,
        });
      }
    }

    return issues;
  },

  fix() {
    return null;
  },
};
