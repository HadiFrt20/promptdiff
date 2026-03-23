const fs = require('fs');
const { parsePromptFile } = require('../parser/prompt-file');
const { runComparison } = require('../compare/runner');
const { renderCompare } = require('../formatter/compare-renderer');

async function compareCommand(fileA, fileB, options = {}) {
  const left = parsePromptFile(fileA);
  const right = parsePromptFile(fileB);

  let input = options.input || '';
  if (input.startsWith('@')) {
    input = fs.readFileSync(input.slice(1), 'utf-8').trim();
  }

  const provider = options.provider;
  if (!provider) {
    throw new Error('No model provider configured. Set up API keys or use --model.');
  }

  const result = await runComparison(left, right, input, provider);
  const output = renderCompare(result);
  console.log(output);
  return result;
}

module.exports = { compareCommand };
