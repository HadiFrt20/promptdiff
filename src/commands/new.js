const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const terminal = require('../formatter/terminal');

const templates = {
  support: require('../templates/support'),
  coding: require('../templates/coding'),
  writing: require('../templates/writing'),
  generic: require('../templates/generic'),
};

function newCommand(name, options = {}) {
  const templateName = options.template || 'generic';

  console.log('');
  console.log(terminal.header('new'));
  console.log('');

  const template = templates[templateName];
  if (!template) {
    console.log(`  ${terminal.errorSymbol()} Unknown template: ${chalk.bold(templateName)}`);
    console.log('');
    console.log(terminal.sectionHeader('Available templates'));
    for (const [key, t] of Object.entries(templates)) {
      console.log(`    ${chalk.bold(key)}  ${chalk.dim('—')}  ${t.description}`);
    }
    console.log('');
    process.exit(1);
  }

  const fileName = name.endsWith('.prompt') ? name : `${name}.prompt`;
  const filePath = path.resolve(process.cwd(), fileName);

  if (fs.existsSync(filePath)) {
    console.log(`  ${terminal.errorSymbol()} File already exists: ${chalk.bold(terminal.relativePath(filePath))}`);
    console.log('');
    process.exit(1);
  }

  const content = template.content(name.replace(/\.prompt$/, ''));
  fs.writeFileSync(filePath, content);

  console.log(`  ${terminal.passSymbol()} ${chalk.green('Created')} ${chalk.bold(terminal.relativePath(filePath))}`);
  console.log('');
  console.log(terminal.sectionHeader('Template'));
  console.log(`    ${chalk.bold(template.name)}  ${chalk.dim('—')}  ${template.description}`);
  console.log('');
  console.log(terminal.divider());
  console.log(`  Edit your prompt: ${chalk.bold(terminal.relativePath(filePath))}`);
  console.log(`  Lint it:          ${chalk.bold(`promptdiff lint ${fileName}`)}`);
  console.log('');

  return { filePath, template: templateName };
}

module.exports = { newCommand };
