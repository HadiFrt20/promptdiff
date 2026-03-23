const chalk = require('chalk');
const terminal = require('./terminal');

function renderCompare(compareResult) {
  const lines = [];

  lines.push('');
  lines.push(terminal.header('compare'));
  lines.push('');
  lines.push(`  ${chalk.bold(`v${compareResult.left.prompt_version || '?'}`)} ${chalk.dim('vs')} ${chalk.bold(`v${compareResult.right.prompt_version || '?'}`)}`);
  lines.push(`  ${chalk.dim('input:')} "${truncate(compareResult.input, 60)}"`);
  lines.push(`  ${chalk.dim('model:')} ${compareResult.model}`);
  lines.push('');

  // Left output
  lines.push(terminal.sectionHeader(`v${compareResult.left.prompt_version} output`));
  lines.push('');
  wrapText(compareResult.left.output, 70).forEach(l => lines.push(`    ${l}`));
  lines.push('');
  renderFlags(lines, compareResult.left.flags);
  lines.push(`    ${chalk.dim('score:')} ${scoreColor(compareResult.left.score)}`);
  lines.push('');

  // Right output
  lines.push(terminal.sectionHeader(`v${compareResult.right.prompt_version} output`));
  lines.push('');
  wrapText(compareResult.right.output, 70).forEach(l => lines.push(`    ${l}`));
  lines.push('');
  renderFlags(lines, compareResult.right.flags);
  lines.push(`    ${chalk.dim('score:')} ${scoreColor(compareResult.right.score)}`);
  lines.push('');

  // Verdict
  lines.push(terminal.divider());
  lines.push('');
  if (compareResult.winner === 'tie') {
    lines.push(`  ${chalk.dim('—')} Tie — both versions scored equally.`);
  } else {
    const winLabel = compareResult.winner === 'left'
      ? `v${compareResult.left.prompt_version}`
      : `v${compareResult.right.prompt_version}`;
    const pointDiff = Math.abs(compareResult.left.score - compareResult.right.score);
    lines.push(`  ${terminal.passSymbol()} ${chalk.green.bold(`${winLabel} wins`)} ${chalk.dim(`(+${pointDiff} points)`)}`);
  }
  lines.push(`  ${chalk.dim(compareResult.verdict)}`);
  lines.push('');

  return lines.join('\n');
}

function renderFlags(lines, flags) {
  for (const flag of flags) {
    const sym = flag.type === 'pass' ? terminal.passSymbol() : terminal.errorSymbol();
    lines.push(`    ${sym} ${flag.detail}`);
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
  return str.slice(0, maxLen - 1) + '…';
}

module.exports = { renderCompare };
