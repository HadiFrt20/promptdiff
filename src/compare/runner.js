const { scoreOutput } = require('./scorer');
const { diffOutputs } = require('./output-differ');

async function runComparison(leftPrompt, rightPrompt, input, provider) {
  const [leftOutput, rightOutput] = await Promise.all([
    provider.generate(leftPrompt.raw, input),
    provider.generate(rightPrompt.raw, input),
  ]);

  const leftScore = scoreOutput(leftOutput.text, leftPrompt);
  const rightScore = scoreOutput(rightOutput.text, rightPrompt);

  const outputDiff = diffOutputs(leftOutput.text, rightOutput.text);

  const winner = leftScore.score > rightScore.score ? 'left' : rightScore.score > leftScore.score ? 'right' : 'tie';

  const leftVersion = leftPrompt.meta.version;
  const rightVersion = rightPrompt.meta.version;

  return {
    input,
    model: provider.model,
    left: {
      prompt_version: leftVersion,
      output: leftOutput.text,
      score: leftScore.score,
      flags: leftScore.flags,
      word_count: leftScore.word_count,
      generation_time_ms: leftOutput.time_ms,
    },
    right: {
      prompt_version: rightVersion,
      output: rightOutput.text,
      score: rightScore.score,
      flags: rightScore.flags,
      word_count: rightScore.word_count,
      generation_time_ms: rightOutput.time_ms,
    },
    winner,
    verdict: generateVerdict(leftScore, rightScore, outputDiff, winner, leftVersion, rightVersion),
  };
}

function generateVerdict(leftScore, rightScore, outputDiff, winner, leftVersion, rightVersion) {
  if (winner === 'tie') {
    return 'Both versions scored equally.';
  }

  const winnerName = winner === 'left' ? 'v' + (leftVersion || 'A') : 'v' + (rightVersion || 'B');
  const pointDiff = Math.abs(leftScore.score - rightScore.score);

  let verdict = `${winnerName} wins (+${pointDiff} points). `;
  verdict += outputDiff.summary + '.';

  return verdict;
}

module.exports = { runComparison, generateVerdict };
