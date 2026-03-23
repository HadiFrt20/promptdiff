const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const { renderLint } = require('../formatter/lint-renderer');
const { output } = require('../formatter/output');

function lintCommand(file, options = {}) {
  const parsed = parsePromptFile(file);
  const result = lint(parsed, {
    severity: options.severity || 'warn',
    disabledRules: options.disabledRules || [],
  });
  output(result, { json: options.json, render: (data) => renderLint(data, { showFixes: options.fix }) });
  return result;
}

module.exports = { lintCommand };
