const path = require('path');
const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');

function parseHookArgs() {
  const args = process.argv.slice(2);
  const options = { strict: false, severity: 'error' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--strict') {
      options.strict = true;
    } else if (args[i] === '--severity' && args[i + 1]) {
      options.severity = args[i + 1];
      i++;
    } else if (args[i] === '--warn-only') {
      options.severity = 'info';
    }
  }

  return options;
}

function hookCommand() {
  const options = parseHookArgs();

  // Read JSON from stdin
  let input = '';
  try {
    input = require('fs').readFileSync('/dev/stdin', 'utf-8');
  } catch (e) {
    process.exit(0);
  }

  let data;
  try {
    data = JSON.parse(input);
  } catch (e) {
    process.exit(0);
  }

  // Get file path from tool input
  const filePath = data?.tool_input?.file_path;
  if (!filePath) {
    process.exit(0);
  }

  // Only process .prompt files
  if (!filePath.endsWith('.prompt')) {
    process.exit(0);
  }

  // Check the file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    process.exit(0);
  }

  // Lint the file
  let parsed;
  try {
    parsed = parsePromptFile(filePath);
  } catch (e) {
    process.exit(0);
  }

  const result = lint(parsed);

  // No issues — pass through
  if (result.results.length === 0) {
    process.exit(0);
  }

  // Build feedback message
  const lines = [];
  const rel = path.relative(process.cwd(), filePath);

  lines.push(`promptdiff found ${result.results.length} issue${result.results.length !== 1 ? 's' : ''} in ${rel}:`);
  lines.push('');

  for (const r of result.results) {
    const icon = r.severity === 'error' ? '✕' : r.severity === 'warn' ? '▲' : 'ℹ';
    const loc = r.section && r.line ? ` ${r.section}:${r.line}` : r.section ? ` ${r.section}` : '';
    lines.push(`  ${icon} [${r.severity}] ${r.rule}${loc}`);
    lines.push(`    ${r.message}`);
  }

  // Add fix suggestions if available
  if (result.fixable.length > 0) {
    lines.push('');
    lines.push('Suggested fixes:');
    for (const f of result.fixable) {
      lines.push(`  + ${f.rule}: ${f.fix}`);
    }
  }

  const hasErrors = result.summary.errors > 0;
  const hasWarnings = result.summary.warnings > 0;

  // Write feedback to stderr (shown to Claude)
  process.stderr.write(lines.join('\n') + '\n');

  // Determine exit code based on severity mode
  if (options.strict) {
    // --strict: exit 2 on any issue (warnings included)
    process.exit((hasErrors || hasWarnings) ? 2 : 0);
  } else if (options.severity === 'info') {
    // --warn-only / --severity info: never block
    process.exit(0);
  } else if (options.severity === 'warn') {
    // --severity warn: exit 2 on warnings or errors
    process.exit((hasErrors || hasWarnings) ? 2 : 0);
  } else {
    // --severity error (default): only exit 2 on errors
    process.exit(hasErrors ? 2 : 0);
  }
}

module.exports = { hookCommand };
