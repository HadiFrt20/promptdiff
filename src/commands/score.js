const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const { computeQualityScore } = require('../scorer/quality-scorer');
const { renderScore } = require('../formatter/score-renderer');

function scoreCommand(file, options = {}) {
  const parsed = parsePromptFile(file);
  const lintResult = lint(parsed);
  const scoreResult = computeQualityScore(parsed, lintResult);
  const output = renderScore(scoreResult, parsed);
  console.log(output);
  return scoreResult;
}

module.exports = { scoreCommand };
