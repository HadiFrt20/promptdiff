const chalk = require('chalk');
const terminal = require('./terminal');

function progressBar(value, max, width = 20) {
  const filled = Math.round((value / max) * width);
  return chalk.green('\u2588'.repeat(filled)) + chalk.dim('\u2591'.repeat(width - filled));
}

function renderScore(scoreResult, parsedPrompt) {
  const lines = [];

  lines.push('');
  lines.push(terminal.header('score'));
  lines.push('');

  const filePath = terminal.relativePath(parsedPrompt.filePath);
  const version = parsedPrompt.meta?.version ? `v${parsedPrompt.meta.version}` : '';
  lines.push(`  ${chalk.dim(filePath)} ${version ? chalk.bold(version) : ''}`);
  lines.push('');

  lines.push(terminal.sectionHeader('Quality Score'));
  lines.push('');

  // Find max label length for alignment
  const maxLabelLen = Math.max(...scoreResult.dimensions.map(d => d.name.length));

  for (const dim of scoreResult.dimensions) {
    const label = dim.name.padEnd(maxLabelLen);
    const bar = progressBar(dim.score, dim.max);
    const scoreText = `${dim.score}/${dim.max}`;
    lines.push(`    ${chalk.bold(label)}  ${bar}  ${chalk.bold(scoreText)}`);
  }

  lines.push('');
  lines.push(terminal.divider());

  const gradeColor = scoreResult.grade === 'A' ? chalk.green.bold
    : scoreResult.grade === 'B' ? chalk.blue.bold
    : scoreResult.grade === 'C' ? chalk.yellow.bold
    : chalk.red.bold;

  lines.push(`    Total: ${chalk.bold(`${scoreResult.total}/100`)}  Grade: ${gradeColor(scoreResult.grade)}`);
  lines.push('');

  return lines.join('\n');
}

module.exports = { renderScore, progressBar };
