function diffOutputs(leftOutput, rightOutput) {
  const leftWords = leftOutput.split(/\s+/).length;
  const rightWords = rightOutput.split(/\s+/).length;

  const lengthDiff = Math.round(((rightWords - leftWords) / leftWords) * 100);

  return {
    left_word_count: leftWords,
    right_word_count: rightWords,
    length_diff_percent: lengthDiff,
    summary: lengthDiff < 0
      ? `Response is ${Math.abs(lengthDiff)}% shorter`
      : lengthDiff > 0
        ? `Response is ${lengthDiff}% longer`
        : 'Responses are the same length',
  };
}

module.exports = { diffOutputs };
