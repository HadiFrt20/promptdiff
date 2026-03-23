const { parsePromptFile } = require('../parser/prompt-file');
const { semanticDiff } = require('../differ/semantic-diff');
const { renderDiff } = require('../formatter/diff-renderer');
const { output } = require('../formatter/output');

function diffCommand(fileA, fileB, options = {}) {
  const left = parsePromptFile(fileA);
  const right = parsePromptFile(fileB);
  const result = semanticDiff(left, right, { annotate: options.annotate, context: options.context || 0 });
  output(result, { json: options.json, render: renderDiff });
  return result;
}

module.exports = { diffCommand };
