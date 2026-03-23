const fs = require('fs');
const chalk = require('chalk');
const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const terminal = require('../formatter/terminal');

function renderFix(data) {
  const { file, fixable, applied, appliedFixes, mode } = data;
  const lines = [];

  lines.push('');
  lines.push(terminal.header('fix'));
  lines.push('');
  lines.push(`  ${chalk.dim(terminal.relativePath(file))}`);
  lines.push('');

  if (fixable.length === 0) {
    lines.push(`  ${terminal.passSymbol()} ${chalk.green('No auto-fixable issues found')}`);
    lines.push('');
    return lines.join('\n');
  }

  if (mode === 'preview') {
    lines.push(`  ${chalk.bold(`${fixable.length} fixable issue${fixable.length !== 1 ? 's' : ''}`)}`);
    lines.push('');

    const bySection = {};
    for (const fix of fixable) {
      const section = fix.patch?.section || 'GENERAL';
      if (!bySection[section]) bySection[section] = [];
      bySection[section].push(fix);
    }

    for (const [section, fixes] of Object.entries(bySection)) {
      lines.push(terminal.sectionHeader(section));

      for (const fix of fixes) {
        lines.push(`    ${chalk.yellow.bold('▸')} ${chalk.bold(fix.rule)}`);
        lines.push(`      ${chalk.dim(fix.fix)}`);
        if (fix.patch?.content) {
          lines.push(`      ${chalk.green('+')} ${chalk.green(fix.patch.content)}`);
        }
      }

      lines.push('');
    }

    lines.push(terminal.divider());
    lines.push(`  Run ${chalk.bold('promptdiff fix <file> --apply')} to apply these fixes.`);
    lines.push('');
  } else {
    const bySection = {};
    for (const fix of fixable) {
      const section = fix.patch?.section || 'GENERAL';
      if (!bySection[section]) bySection[section] = [];
      bySection[section].push(fix);
    }

    for (const [section, fixes] of Object.entries(bySection)) {
      lines.push(terminal.sectionHeader(section));

      for (const fix of fixes) {
        const wasApplied = appliedFixes && appliedFixes.find(a => a.rule === fix.rule);
        if (wasApplied) {
          lines.push(`    ${terminal.passSymbol()} ${chalk.bold(fix.rule)}`);
          lines.push(`      ${chalk.green('+')} ${chalk.green(fix.patch?.content || fix.fix)}`);
        }
      }

      lines.push('');
    }

    if (applied > 0) {
      lines.push(terminal.divider());
      lines.push(`  ${chalk.green.bold(`${applied} fix${applied !== 1 ? 'es' : ''} applied`)} to ${chalk.dim(terminal.relativePath(file))}`);
    } else {
      lines.push(terminal.divider());
      lines.push(`  ${chalk.yellow('No fixes could be applied automatically.')}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

function fixCommand(file, options = {}) {
  const parsed = parsePromptFile(file);
  const result = lint(parsed);

  if (options.json && !options.apply) {
    console.log(JSON.stringify({ applied: 0, fixable: result.fixable }, null, 2));
    return { applied: 0, fixable: result.fixable };
  }

  if (result.fixable.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ applied: 0 }, null, 2));
    } else {
      console.log(renderFix({ file, fixable: [], applied: 0, mode: 'preview' }));
    }
    return { applied: 0 };
  }

  if (!options.apply) {
    console.log(renderFix({ file, fixable: result.fixable, applied: 0, mode: 'preview' }));
    return { applied: 0, fixable: result.fixable };
  }

  // Apply fixes
  let content = fs.readFileSync(file, 'utf-8');
  let applied = 0;
  const appliedFixes = [];

  for (const fix of result.fixable) {
    if (fix.patch && fix.patch.action === 'append' && fix.patch.section) {
      const sectionPattern = new RegExp(`(# ${fix.patch.section}[\\s\\S]*?)(?=\\n# |$)`);
      const match = content.match(sectionPattern);
      if (match) {
        const newSection = match[1].trimEnd() + '\n' + fix.patch.content + '\n';
        content = content.replace(match[1], newSection);
        applied++;
        appliedFixes.push(fix);
      }
    }
  }

  if (applied > 0) {
    fs.writeFileSync(file, content);
  }

  if (options.json) {
    console.log(JSON.stringify({ applied, fixable: result.fixable }, null, 2));
  } else {
    console.log(renderFix({ file, fixable: result.fixable, applied, appliedFixes, mode: 'apply' }));
  }

  return { applied, fixable: result.fixable };
}

module.exports = { fixCommand };
