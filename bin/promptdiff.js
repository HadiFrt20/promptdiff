#!/usr/bin/env node

const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

function resolve(file) {
  return path.resolve(process.cwd(), file);
}

function handle(fn) {
  return (...args) => {
    try {
      const result = fn(...args);
      if (result && typeof result.catch === 'function') {
        result.catch(err => {
          console.error(chalk.red(`Error: ${err.message}`));
          process.exit(1);
        });
      }
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  };
}

const program = new Command();

program
  .name('promptdiff')
  .description('Semantic diff, lint, and A/B compare for LLM prompts')
  .version(pkg.version)
  .option('--json', 'Output as JSON');

program
  .command('diff <fileA> <fileB>')
  .description('Semantic diff between two prompt files')
  .option('--annotate', 'Include human-readable change descriptions and impact ratings')
  .option('--context <N>', 'Number of unchanged context lines to show around changes', '0')
  .action(handle((fileA, fileB, options) => {
    const { diffCommand } = require('../src/commands/diff');
    diffCommand(resolve(fileA), resolve(fileB), { ...options, context: parseInt(options.context, 10), json: program.opts().json });
  }));

program
  .command('lint <file>')
  .description('Run static analysis on a prompt file')
  .option('--fix', 'Show auto-fix suggestions')
  .option('--severity <level>', 'Minimum severity to show (error, warn, info)', 'warn')
  .action(handle((file, options) => {
    const { lintCommand } = require('../src/commands/lint');
    lintCommand(resolve(file), { ...options, json: program.opts().json });
  }));

program
  .command('compare <fileA> <fileB>')
  .description('Run both prompts against the same input and compare outputs')
  .requiredOption('--input <text>', 'Test input text (or @filepath)')
  .option('--model <alias>', 'Model to use')
  .action(handle(async (fileA, fileB, options) => {
    const { compareCommand } = require('../src/commands/compare');
    await compareCommand(resolve(fileA), resolve(fileB), options);
  }));

program
  .command('init')
  .description('Initialize .promptdiff/ tracking in current directory')
  .action(handle(() => {
    const { initCommand } = require('../src/commands/init');
    initCommand();
  }));

program
  .command('log <file>')
  .description('Show version history of a prompt file')
  .action(handle((file) => {
    const { logCommand } = require('../src/commands/log');
    logCommand(resolve(file), undefined, { json: program.opts().json });
  }));

program
  .command('fix <file>')
  .description('Show fixable lint issues and their fixes')
  .option('--apply', 'Apply fixes directly to the file')
  .action(handle((file, options) => {
    const { fixCommand } = require('../src/commands/fix');
    fixCommand(resolve(file), { ...options, json: program.opts().json });
  }));

program
  .command('new <name>')
  .description('Scaffold a new .prompt file from a template')
  .option('--template <type>', 'Template to use (support, coding, writing, generic)', 'generic')
  .action(handle((name, options) => {
    const { newCommand } = require('../src/commands/new');
    newCommand(name, options);
  }));

program
  .command('watch [dir]')
  .description('Watch .prompt files and lint on change')
  .action(handle((dir) => {
    const { watchCommand } = require('../src/commands/watch');
    watchCommand(dir);
  }));

program
  .command('setup')
  .description('Install Claude Code hook to auto-lint .prompt files')
  .option('--project', 'Install to project settings instead of user settings')
  .option('--remove', 'Remove the hook')
  .option('--strict', 'Block on warnings too (not just errors)')
  .option('--warn-only', 'Never block, just print feedback')
  .action(handle((options) => {
    const { setupCommand } = require('../src/commands/setup');
    setupCommand({
      scope: options.project ? 'project' : 'user',
      remove: options.remove,
      strict: options.strict,
      warnOnly: options.warnOnly,
    });
  }));

program
  .command('hook')
  .description('Hook entry point (called by Claude Code, not directly)')
  .action(() => {
    const { hookCommand } = require('../src/commands/hook');
    hookCommand();
  });

program
  .command('score <file>')
  .description('Compute quality score for a prompt file')
  .action(handle((file) => {
    const { scoreCommand } = require('../src/commands/score');
    scoreCommand(resolve(file));
  }));

program
  .command('stats <file>')
  .description('Show statistics for a prompt file')
  .action(handle((file) => {
    const { statsCommand } = require('../src/commands/stats');
    statsCommand(resolve(file));
  }));

program.parse();
