const chalk = require('chalk');
const terminal = require('./terminal');

function renderStats(statsResult) {
  const lines = [];

  lines.push('');
  lines.push(terminal.header('stats'));
  lines.push('');

  const filePath = terminal.relativePath(statsResult.filePath);
  const version = statsResult.version ? `v${statsResult.version}` : '';
  lines.push(`  ${chalk.dim(filePath)} ${version ? chalk.bold(version) : ''}`);
  lines.push('');

  lines.push(terminal.sectionHeader('Overview'));
  lines.push('');
  lines.push(`    Lines:        ${chalk.bold(statsResult.lineCount)}`);
  lines.push(`    Words:        ${chalk.bold(statsResult.wordCount)}`);
  lines.push(`    Sections:     ${chalk.bold(statsResult.sectionCount)}`);
  lines.push(`    Constraints:  ${chalk.bold(statsResult.constraintCount)}`);
  lines.push(`    Examples:     ${chalk.bold(statsResult.exampleCount)}`);
  lines.push('');

  if (statsResult.sections.length > 0) {
    lines.push(terminal.sectionHeader('Sections'));
    lines.push('');

    // Calculate column widths
    const nameWidth = Math.max(
      'Section'.length,
      ...statsResult.sections.map(s => s.name.length)
    );
    const linesWidth = Math.max(
      'Lines'.length,
      ...statsResult.sections.map(s => String(s.lineCount).length)
    );
    const wordsWidth = Math.max(
      'Words'.length,
      ...statsResult.sections.map(s => String(s.wordCount).length)
    );

    // Header row
    const headerRow = `    ${chalk.dim('Section'.padEnd(nameWidth))}  ${chalk.dim('Lines'.padStart(linesWidth))}  ${chalk.dim('Words'.padStart(wordsWidth))}`;
    lines.push(headerRow);
    lines.push(`    ${'─'.repeat(nameWidth)}  ${'─'.repeat(linesWidth)}  ${'─'.repeat(wordsWidth)}`);

    for (const section of statsResult.sections) {
      const name = section.name.padEnd(nameWidth);
      const sLines = String(section.lineCount).padStart(linesWidth);
      const words = String(section.wordCount).padStart(wordsWidth);
      lines.push(`    ${name}  ${sLines}  ${words}`);
    }

    lines.push('');
  }

  // Quality score summary
  lines.push(terminal.divider());

  const gradeColor = statsResult.grade === 'A' ? chalk.green.bold
    : statsResult.grade === 'B' ? chalk.blue.bold
    : statsResult.grade === 'C' ? chalk.yellow.bold
    : chalk.red.bold;

  lines.push(`    Quality: ${chalk.bold(`${statsResult.qualityScore}/100`)} ${gradeColor(statsResult.grade)}`);
  lines.push('');

  return lines.join('\n');
}

module.exports = { renderStats };
