const chalk = require('chalk');
const terminal = require('./terminal');

function renderDiff(diffResult) {
  const lines = [];

  lines.push('');
  lines.push(terminal.header('diff'));
  lines.push('');

  // File comparison header in a box
  const leftName = terminal.relativePath(diffResult.left.filePath || 'left');
  const rightName = terminal.relativePath(diffResult.right.filePath || 'right');
  const leftVersion = diffResult.left.meta?.version;
  const rightVersion = diffResult.right.meta?.version;

  const boxLines = [];
  if (leftVersion && rightVersion) {
    boxLines.push(leftName);
    boxLines.push(`v${leftVersion} \u2192 v${rightVersion}`);
  } else {
    boxLines.push(leftName);
    boxLines.push(`vs ${rightName}`);
  }

  // Summary info inside the box
  const summaryParts = [];
  if (diffResult.summary.added > 0) summaryParts.push(`+${diffResult.summary.added} added`);
  if (diffResult.summary.removed > 0) summaryParts.push(`\u2212${diffResult.summary.removed} removed`);
  if (diffResult.summary.modified > 0) summaryParts.push(`~${diffResult.summary.modified} modified`);
  boxLines.push(summaryParts.join('  \u00B7  '));
  boxLines.push(`${diffResult.summary.sections_affected.length} section${diffResult.summary.sections_affected.length !== 1 ? 's' : ''} affected: ${diffResult.summary.sections_affected.join(', ')}`);

  lines.push(terminal.box('diff', boxLines));
  lines.push('');

  if (diffResult.changes.length === 0) {
    lines.push(`  ${terminal.passSymbol()} ${chalk.green('No changes detected')}`);
    lines.push('');
    return lines.join('\n');
  }

  // Group changes by section
  const bySection = {};
  for (const change of diffResult.changes) {
    const section = change.section || 'UNKNOWN';
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(change);
  }

  for (const [section, changes] of Object.entries(bySection)) {
    lines.push(terminal.sectionHeader(section));

    for (const change of changes) {
      if (change.type === 'context') {
        lines.push(terminal.unchangedLine(change.text));
        continue;
      }
      if (change.type === 'collapse') {
        lines.push(chalk.dim('      ···'));
        continue;
      }
      if (change.type === 'removed' && change.left_line) {
        lines.push(terminal.removedLine(change.left_line));
      }
      if (change.type === 'added' && change.right_line) {
        lines.push(terminal.addedLine(change.right_line));
      }
      if (['modified', 'tightened', 'relaxed', 'replaced'].includes(change.type)) {
        if (change.left_line) lines.push(terminal.removedLine(change.left_line));
        if (change.right_line) lines.push(terminal.addedLine(change.right_line));
      }

      if (change.description) {
        lines.push(terminal.annotation(change.description, change.impact));
      }
      if (change.behavioralNote) {
        lines.push(chalk.dim(`          ${change.behavioralNote}`));
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

module.exports = { renderDiff };
