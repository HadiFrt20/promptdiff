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
  .option('--model <alias>', 'Model to use (claude, gpt4o, ollama, llama3)')
  .action(handle(async (fileA, fileB, options) => {
    const { compareCommand } = require('../src/commands/compare');
    await compareCommand(resolve(fileA), resolve(fileB), { ...options, json: program.opts().json });
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
  .command('migrate <input>')
  .description('Convert a plain text prompt into a structured .prompt file')
  .option('--output <file>', 'Output file path (use - for stdout)')
  .option('--name <name>', 'Prompt name for frontmatter')
  .action(handle((input, options) => {
    const { migrateCommand } = require('../src/commands/migrate');
    migrateCommand(resolve(input), options);
  }));

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

program
  .command('compose <file>')
  .description('Resolve all includes and extends, output the fully composed prompt')
  .option('--output <file>', 'Write composed result to a file instead of stdout')
  .action(handle((file, options) => {
    const { composeCommand } = require('../src/commands/compose');
    composeCommand(resolve(file), options);
  }));

program
  .command('log-to-mlflow <file>')
  .description('Log a prompt file to MLflow tracking')
  .option('--experiment <name>', 'MLflow experiment name', 'promptdiff')
  .option('--run-name <name>', 'MLflow run name')
  .option('--tracking-uri <uri>', 'MLflow tracking URI')
  .action(handle(async (file, options) => {
    const { mlflowLogCommand } = require('../src/commands/mlflow-log');
    await mlflowLogCommand(resolve(file), {
      experiment: options.experiment,
      runName: options.runName,
      trackingUri: options.trackingUri,
    });
  }));

program
  .command('diff-to-mlflow <fileA> <fileB>')
  .description('Log a prompt diff to MLflow tracking')
  .option('--experiment <name>', 'MLflow experiment name', 'promptdiff')
  .option('--tracking-uri <uri>', 'MLflow tracking URI')
  .action(handle(async (fileA, fileB, options) => {
    const { mlflowDiffCommand } = require('../src/commands/mlflow-diff');
    await mlflowDiffCommand(resolve(fileA), resolve(fileB), {
      experiment: options.experiment,
      trackingUri: options.trackingUri,
    });
  }));

program.parse();
