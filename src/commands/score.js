const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const { computeQualityScore } = require('../scorer/quality-scorer');
const { renderScore } = require('../formatter/score-renderer');
const { output } = require('../formatter/output');

function scoreCommand(file, options = {}) {
  const parsed = parsePromptFile(file);
  const lintResult = lint(parsed);
  const scoreResult = computeQualityScore(parsed, lintResult);
  output(scoreResult, { json: options.json, render: (data) => renderScore(data, parsed) });
  return scoreResult;
}

module.exports = { scoreCommand };
