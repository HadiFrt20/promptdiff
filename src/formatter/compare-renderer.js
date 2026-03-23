const chalk = require('chalk');
const terminal = require('./terminal');

function renderCompare(compareResult) {
  const lines = [];

  lines.push('');
  lines.push(terminal.header('compare'));
  lines.push('');

  // Summary box (matching diff/lint style)
  const leftVersion = compareResult.left.prompt_version || '?';
  const rightVersion = compareResult.right.prompt_version || '?';

  const boxLines = [];
  boxLines.push(`v${leftVersion} vs v${rightVersion}`);
  boxLines.push(`input: "${truncate(compareResult.input, 48)}"`);
  boxLines.push(`model: ${compareResult.model}`);

  const summaryParts = [];
  summaryParts.push(`left: ${compareResult.left.score}/100`);
  summaryParts.push(`right: ${compareResult.right.score}/100`);
  boxLines.push(summaryParts.join('  \u00B7  '));

  lines.push(terminal.box('compare', boxLines));
  lines.push('');

  // Left output section
  lines.push(terminal.sectionHeader(`v${leftVersion} output`));
  lines.push('');
  wrapText(compareResult.left.output, 70).forEach(l => lines.push(terminal.indent(l, 4)));
  lines.push('');
  renderFlags(lines, compareResult.left.flags);
  lines.push(terminal.indent(`${terminal.dim('score:')} ${scoreColor(compareResult.left.score)}  ${terminal.dim('time:')} ${compareResult.left.generation_time_ms}ms  ${terminal.dim('words:')} ${compareResult.left.word_count}`, 4));
  lines.push('');

  // Right output section
  lines.push(terminal.sectionHeader(`v${rightVersion} output`));
  lines.push('');
  wrapText(compareResult.right.output, 70).forEach(l => lines.push(terminal.indent(l, 4)));
  lines.push('');
  renderFlags(lines, compareResult.right.flags);
  lines.push(terminal.indent(`${terminal.dim('score:')} ${scoreColor(compareResult.right.score)}  ${terminal.dim('time:')} ${compareResult.right.generation_time_ms}ms  ${terminal.dim('words:')} ${compareResult.right.word_count}`, 4));
  lines.push('');

  // Verdict footer
  lines.push(terminal.divider());
  lines.push('');
  if (compareResult.winner === 'tie') {
    lines.push(terminal.indent(`${terminal.dim('\u2014')} Tie \u2014 both versions scored equally.`));
  } else {
    const winLabel = compareResult.winner === 'left'
      ? `v${leftVersion}`
      : `v${rightVersion}`;
    const pointDiff = Math.abs(compareResult.left.score - compareResult.right.score);
    lines.push(terminal.indent(`${terminal.passSymbol()} ${chalk.green.bold(`${winLabel} wins`)} ${terminal.dim(`(+${pointDiff} points)`)}`));
  }
  lines.push(terminal.indent(terminal.dim(compareResult.verdict)));
  lines.push('');

  return lines.join('\n');
}

function renderFlags(lines, flags) {
  for (const flag of flags) {
    const sym = flag.type === 'pass' ? terminal.passSymbol() : terminal.errorSymbol();
    lines.push(terminal.indent(`${sym} ${flag.detail}`, 4));
  }
}

function scoreColor(score) {
  if (score >= 90) return chalk.green.bold(`${score}/100`);
  if (score >= 70) return chalk.yellow.bold(`${score}/100`);
  return chalk.red.bold(`${score}/100`);
}

function wrapText(text, maxWidth) {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const wrapped = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth && current.length > 0) {
      wrapped.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) wrapped.push(current);
  return wrapped;
}

function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '\u2026';
}

module.exports = { renderCompare };
