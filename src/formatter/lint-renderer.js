const chalk = require('chalk');
const terminal = require('./terminal');

function renderLint(lintResult, options = {}) {
  const lines = [];

  lines.push('');
  lines.push(terminal.header('lint'));
  lines.push('');

  const filePath = terminal.relativePath(lintResult.file);
  const version = lintResult.version ? `v${lintResult.version}` : '';

  if (lintResult.results.length === 0) {
    const boxLines = [filePath + (version ? ` ${version}` : '')];
    lines.push(terminal.box('lint', boxLines));
    lines.push('');
    lines.push(`  ${terminal.passSymbol()} ${chalk.green('No issues found')}`);
    lines.push('');
    return lines.join('\n');
  }

  // Build box content with file info and summary
  const boxContentLines = [];
  boxContentLines.push(filePath + (version ? ` ${version}` : ''));

  // Summary bar (like diff's +3 added · −3 removed)
  const summaryParts = [];
  if (lintResult.summary.errors > 0) {
    summaryParts.push(`${lintResult.summary.errors} error${lintResult.summary.errors !== 1 ? 's' : ''}`);
  }
  if (lintResult.summary.warnings > 0) {
    summaryParts.push(`${lintResult.summary.warnings} warning${lintResult.summary.warnings !== 1 ? 's' : ''}`);
  }
  if (lintResult.summary.info > 0) {
    summaryParts.push(`${lintResult.summary.info} info`);
  }
  boxContentLines.push(summaryParts.join('  \u00B7  '));

  // Sections affected
  const sections = [...new Set(lintResult.results.map(r => r.section).filter(Boolean))];
  if (sections.length > 0) {
    boxContentLines.push(`${sections.length} section${sections.length !== 1 ? 's' : ''} affected: ${sections.join(', ')}`);
  }

  lines.push(terminal.box('lint', boxContentLines));
  lines.push('');

  // Build fixable lookup
  const fixMap = {};
  for (const f of lintResult.fixable) {
    fixMap[f.rule] = f.fix;
  }

  // Group by section (like diff groups changes by section)
  const bySection = {};
  const noSection = [];
  for (const result of lintResult.results) {
    if (result.section) {
      if (!bySection[result.section]) bySection[result.section] = [];
      bySection[result.section].push(result);
    } else {
      noSection.push(result);
    }
  }

  for (const [section, results] of Object.entries(bySection)) {
    lines.push(terminal.sectionHeader(section));

    for (const result of results) {
      const badge = result.severity === 'error'
        ? chalk.bgRed.white.bold(` error `)
        : result.severity === 'warn'
          ? chalk.bgYellow.black(` warn `)
          : chalk.bgWhite.black(` info `);

      const location = result.line ? chalk.dim(`:${result.line}`) : '';

      lines.push(`    ${severitySymbol(result.severity)} ${chalk.bold(result.rule)}${location}  ${badge}`);
      lines.push(`      ${result.message}`);

      if (options.showFixes && fixMap[result.rule]) {
        lines.push(`      ${chalk.green('+')} ${chalk.green(fixMap[result.rule])}`);
      }
    }

    lines.push('');
  }

  // Issues with no section
  if (noSection.length > 0) {
    lines.push(terminal.sectionHeader('GENERAL'));

    for (const result of noSection) {
      const badge = result.severity === 'error'
        ? chalk.bgRed.white.bold(` error `)
        : result.severity === 'warn'
          ? chalk.bgYellow.black(` warn `)
          : chalk.bgWhite.black(` info `);

      lines.push(`    ${severitySymbol(result.severity)} ${chalk.bold(result.rule)}  ${badge}`);
      lines.push(`      ${result.message}`);

      if (options.showFixes && fixMap[result.rule]) {
        lines.push(`      ${chalk.green('+')} ${chalk.green(fixMap[result.rule])}`);
      }
    }

    lines.push('');
  }

  // Footer
  lines.push(terminal.divider());
  if (lintResult.fixable.length > 0 && !options.showFixes) {
    lines.push(`  ${lintResult.fixable.length} auto-fixable. Run ${chalk.bold('promptdiff lint <file> --fix')} or ${chalk.bold('promptdiff fix <file>')}`);
  }
  lines.push('');

  return lines.join('\n');
}

function severitySymbol(severity) {
  if (severity === 'error') return terminal.errorSymbol();
  if (severity === 'warn') return terminal.warnSymbol();
  return terminal.infoSymbol();
}

module.exports = { renderLint };
