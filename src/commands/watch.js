const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const terminal = require('../formatter/terminal');
const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const { renderLint } = require('../formatter/lint-renderer');

function watchCommand(dir) {
  const watchDir = path.resolve(dir || process.cwd());

  if (!fs.existsSync(watchDir)) {
    console.error(chalk.red(`Error: Directory not found: ${watchDir}`));
    process.exit(1);
  }

  console.log('');
  console.log(terminal.header('watch'));
  console.log('');

  // Count existing .prompt files
  const promptFiles = findPromptFiles(watchDir);
  console.log(`  ${terminal.passSymbol()} Watching ${chalk.bold(promptFiles.length)} .prompt file${promptFiles.length !== 1 ? 's' : ''} in ${chalk.dim(terminal.relativePath(watchDir))}`);
  console.log(`  ${chalk.dim('Press Ctrl+C to stop')}`);
  console.log('');
  console.log(terminal.divider());
  console.log('');

  // Debounce tracking
  const pending = new Map();

  const watcher = fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.prompt')) return;

    const filePath = path.join(watchDir, filename);

    // Debounce: clear previous timer for this file
    if (pending.has(filePath)) {
      clearTimeout(pending.get(filePath));
    }

    pending.set(filePath, setTimeout(() => {
      pending.delete(filePath);
      lintFile(filePath);
    }, 500));
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    watcher.close();
    console.log('');
    console.log(`  ${chalk.dim('Stopped watching.')}`);
    console.log('');
    process.exit(0);
  });
}

function lintFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const timestamp = new Date().toLocaleTimeString();

  // Clear screen
  process.stdout.write('\x1Bc');

  console.log('');
  console.log(terminal.header('watch'));
  console.log('');
  console.log(`  ${chalk.dim(timestamp)}  ${chalk.bold(terminal.relativePath(filePath))}`);
  console.log('');

  try {
    const parsed = parsePromptFile(filePath);
    const result = lint(parsed);
    const output = renderLint(result, { showFixes: false });
    console.log(output);
  } catch (e) {
    console.log(`  ${terminal.errorSymbol()} Failed to parse: ${e.message}`);
    console.log('');
  }
}

function findPromptFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        results.push(...findPromptFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.prompt')) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    // ignore permission errors etc.
  }
  return results;
}

module.exports = { watchCommand };
