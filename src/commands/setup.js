const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const terminal = require('../formatter/terminal');

const HOOK_ENTRY = {
  matcher: 'Edit|Write',
  hooks: [
    {
      type: 'command',
      command: 'promptdiff hook',
      timeout: 10,
    },
  ],
};

function buildHookEntry(options = {}) {
  let command = 'promptdiff hook';
  if (options.strict) {
    command += ' --strict';
  } else if (options.warnOnly) {
    command += ' --severity info';
  }
  return {
    matcher: 'Edit|Write',
    hooks: [
      {
        type: 'command',
        command,
        timeout: 10,
      },
    ],
  };
}

function setupCommand(options = {}) {
  const scope = options.scope || 'user';
  const remove = options.remove || false;
  const strict = options.strict || false;
  const warnOnly = options.warnOnly || false;

  console.log('');
  console.log(terminal.header('setup'));
  console.log('');

  let settingsPath;
  if (scope === 'project') {
    const projectDir = path.join(process.cwd(), '.claude');
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    settingsPath = path.join(projectDir, 'settings.json');
  } else {
    const homeDir = require('os').homedir();
    const claudeDir = path.join(homeDir, '.claude');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    settingsPath = path.join(claudeDir, 'settings.json');
  }

  // Load existing settings
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    } catch (e) {
      settings = {};
    }
  }

  if (remove) {
    return removeHook(settings, settingsPath, scope);
  }

  const hookEntry = buildHookEntry({ strict, warnOnly });
  return addHook(settings, settingsPath, scope, hookEntry);
}

function addHook(settings, settingsPath, scope, hookEntry) {
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.PostToolUse) {
    settings.hooks.PostToolUse = [];
  }

  // Check if already installed — remove old entry so we can update the command
  const existingIdx = settings.hooks.PostToolUse.findIndex(entry =>
    entry.hooks?.some(h => h.command && h.command.startsWith('promptdiff hook'))
  );

  if (existingIdx !== -1) {
    // Replace existing hook entry with updated one
    settings.hooks.PostToolUse[existingIdx] = hookEntry;
  } else {
    settings.hooks.PostToolUse.push(hookEntry);
  }
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

  console.log(`  ${terminal.passSymbol()} ${chalk.green('Hook installed')}`);
  console.log(`  ${chalk.dim(settingsPath)}`);
  console.log('');

  console.log(terminal.sectionHeader('What it does'));
  console.log(`    When Claude uses ${chalk.bold('Edit')} or ${chalk.bold('Write')} on a ${chalk.bold('.prompt')} file:`);
  console.log(`    ${chalk.red('✕')} Errors ${chalk.dim('→')} blocks the edit with feedback`);
  console.log(`    ${chalk.yellow('▲')} Warnings ${chalk.dim('→')} passes through, shown in verbose mode`);
  console.log(`    ${chalk.green('✓')} Clean ${chalk.dim('→')} silent`);
  console.log('');

  console.log(terminal.sectionHeader('Config added'));
  console.log(chalk.dim(`    PostToolUse → Edit|Write → promptdiff hook`));
  console.log('');

  console.log(terminal.divider());
  console.log(`  To remove: ${chalk.bold('promptdiff setup --remove')}`);
  console.log('');

  return { installed: true, alreadyExisted: false };
}

function removeHook(settings, settingsPath, scope) {
  if (!settings.hooks?.PostToolUse) {
    console.log(`  ${chalk.dim('No hook found in')} ${scope} ${chalk.dim('settings')}`);
    console.log('');
    return { removed: false };
  }

  const before = settings.hooks.PostToolUse.length;
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(entry =>
    !entry.hooks?.some(h => h.command && h.command.startsWith('promptdiff hook'))
  );
  const after = settings.hooks.PostToolUse.length;

  if (before === after) {
    console.log(`  ${chalk.dim('No promptdiff hook found in')} ${scope} ${chalk.dim('settings')}`);
    console.log('');
    return { removed: false };
  }

  // Clean up empty arrays
  if (settings.hooks.PostToolUse.length === 0) {
    delete settings.hooks.PostToolUse;
  }
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

  console.log(`  ${terminal.passSymbol()} ${chalk.green('Hook removed')}`);
  console.log(`  ${chalk.dim(settingsPath)}`);
  console.log('');

  return { removed: true };
}

module.exports = { setupCommand, buildHookEntry, HOOK_ENTRY };
