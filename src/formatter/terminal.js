const chalk = require('chalk');
const path = require('path');
const pkg = require('../../package.json');

const VERSION = pkg.version;

function header(text) {
  return chalk.bold(`  promptdiff ${chalk.dim(`v${VERSION}`)} ${chalk.blue('—')} ${text}`);
}

function sectionHeader(name) {
  const width = Math.max(0, 56 - name.length - 6);
  return chalk.blue(`  ──── ${chalk.bold(name)} ${'─'.repeat(width)}`);
}

function addedLine(text) {
  return chalk.green(`    + `) + chalk.green(text);
}

function removedLine(text) {
  return chalk.red(`    − `) + chalk.red(text);
}

function unchangedLine(text) {
  return chalk.dim(`      ${text}`);
}

function annotation(text, impact) {
  const badge = impact === 'high'
    ? chalk.bgRed.white.bold(` ${impact} `)
    : impact === 'medium'
      ? chalk.bgYellow.black(` ${impact} `)
      : chalk.bgWhite.black(` ${impact} `);
  return chalk.dim(`        ╰─ ${text}  `) + badge;
}

function summaryBar(added, removed, modified) {
  const parts = [];
  if (added > 0) parts.push(chalk.green.bold(`+${added} added`));
  if (removed > 0) parts.push(chalk.red.bold(`−${removed} removed`));
  if (modified > 0) parts.push(chalk.yellow.bold(`~${modified} modified`));
  return `  ${parts.join(chalk.dim('  ·  '))}`;
}

function errorSymbol() {
  return chalk.red.bold('✕');
}

function warnSymbol() {
  return chalk.yellow.bold('▲');
}

function infoSymbol() {
  return chalk.blue('ℹ');
}

function passSymbol() {
  return chalk.green.bold('✓');
}

function divider() {
  return chalk.dim('  ' + '─'.repeat(56));
}

function relativePath(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function dim(text) {
  return chalk.dim(text);
}

function bold(text) {
  return chalk.bold(text);
}

function indent(text, n = 2) {
  return ' '.repeat(n) + text;
}

function progressBar(value, max, width = 20) {
  const filled = Math.round((value / max) * width);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
}

function table(headers, rows, options = {}) {
  const pad = options.padding || 2;
  const allRows = [headers, ...rows];
  const colWidths = headers.map((_, i) => {
    return Math.max(...allRows.map(row => String(row[i] || '').length));
  });

  const lines = [];
  for (const row of allRows) {
    const cells = row.map((cell, i) => {
      return String(cell || '').padEnd(colWidths[i]);
    });
    lines.push('  ' + cells.join(' '.repeat(pad)));
  }

  // Insert separator after header
  const sep = colWidths.map(w => '\u2500'.repeat(w)).join(' '.repeat(pad));
  lines.splice(1, 0, '  ' + sep);

  return lines.join('\n');
}

function box(title, contentLines) {
  const minWidth = 56;
  const maxContentWidth = contentLines.reduce((max, line) => Math.max(max, line.length), 0);
  const titleLen = title ? title.length + 2 : 0; // +2 for spaces around title
  const innerWidth = Math.max(minWidth, maxContentWidth + 2, titleLen + 4);

  const lines = [];

  // Top border
  if (title) {
    const afterTitle = Math.max(0, innerWidth - titleLen - 1);
    lines.push('\u256D\u2500 ' + title + ' ' + '\u2500'.repeat(afterTitle) + '\u256E');
  } else {
    lines.push('\u256D' + '\u2500'.repeat(innerWidth) + '\u256E');
  }

  // Content lines
  for (const line of contentLines) {
    const padding = Math.max(0, innerWidth - line.length - 2);
    lines.push('\u2502 ' + line + ' '.repeat(padding) + ' \u2502');
  }

  // Bottom border
  lines.push('\u2570' + '\u2500'.repeat(innerWidth) + '\u256F');

  return lines.join('\n');
}

module.exports = {
  header,
  sectionHeader,
  addedLine,
  removedLine,
  unchangedLine,
  annotation,
  summaryBar,
  errorSymbol,
  warnSymbol,
  infoSymbol,
  passSymbol,
  divider,
  relativePath,
  dim,
  bold,
  indent,
  progressBar,
  table,
  box,
  VERSION,
};
