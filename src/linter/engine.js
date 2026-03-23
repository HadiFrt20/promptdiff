const fs = require('fs');
const path = require('path');
const { loadCustomRules } = require('./custom-rules');

const RULES_DIR = path.join(__dirname, 'rules');

function loadRules(disabledRules = []) {
  const files = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.js'));
  const rules = [];

  for (const file of files) {
    const rule = require(path.join(RULES_DIR, file));
    if (!disabledRules.includes(rule.id)) {
      rules.push(rule);
    }
  }

  return rules;
}

function lint(parsedPrompt, options = {}) {
  const severityThreshold = options.severity || 'info';
  const optDisabled = options.disabledRules || [];

  const configDir = options.configDir || (parsedPrompt.filePath && parsedPrompt.filePath !== '<inline>'
    ? path.dirname(path.resolve(parsedPrompt.filePath))
    : process.cwd());

  const { customRules, disabledRules: rcDisabled } = loadCustomRules(configDir);

  const disabledRules = [...new Set([...optDisabled, ...rcDisabled])];

  const builtinRules = loadRules(disabledRules);
  const rules = [
    ...builtinRules,
    ...customRules.filter(r => !disabledRules.includes(r.id)),
  ];
  const results = [];
  const fixable = [];

  const severityOrder = { error: 3, warn: 2, info: 1 };
  const minSeverity = severityOrder[severityThreshold] || 1;

  for (const rule of rules) {
    try {
      const issues = rule.check(parsedPrompt);
      for (const issue of issues) {
        const issueSeverity = severityOrder[issue.severity || rule.severity] || 1;
        if (issueSeverity >= minSeverity) {
          results.push({
            severity: issue.severity || rule.severity,
            rule: rule.id,
            message: issue.message,
            section: issue.section || null,
            line: issue.line !== undefined ? issue.line : null,
          });
        }
      }

      if (rule.fix) {
        const fix = rule.fix(parsedPrompt);
        if (fix) {
          fixable.push({
            rule: rule.id,
            fix: fix.description,
            patch: fix.patch,
          });
        }
      }
    } catch (e) {
      results.push({
        severity: 'error',
        rule: rule.id,
        message: `Rule crashed: ${e.message}`,
        section: null,
        line: null,
      });
    }
  }

  const summary = {
    errors: results.filter(r => r.severity === 'error').length,
    warnings: results.filter(r => r.severity === 'warn').length,
    info: results.filter(r => r.severity === 'info').length,
  };

  return {
    file: parsedPrompt.filePath,
    version: parsedPrompt.meta?.version || null,
    results,
    summary,
    fixable,
  };
}

module.exports = { lint, loadRules };
