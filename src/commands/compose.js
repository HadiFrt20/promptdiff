const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { parsePromptFile } = require('../parser/prompt-file');

function renderComposed(parsed) {
  const lines = [];

  // Render frontmatter (without extends/includes since they are resolved)
  const meta = { ...parsed.meta };
  delete meta.extends;
  delete meta.includes;

  if (Object.keys(meta).length > 0) {
    lines.push('---');
    for (const [key, value] of Object.entries(meta)) {
      if (Array.isArray(value)) {
        lines.push(`${key}: ${value.join(', ')}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
    lines.push('---');
    lines.push('');
  }

  // Render sections
  for (const section of parsed.sections) {
    lines.push(`# ${section.label}`);
    lines.push('');
    for (const line of section.lines) {
      lines.push(line);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function composeCommand(file, options = {}) {
  const parsed = parsePromptFile(file);
  const output = renderComposed(parsed);

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output);
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(chalk.green(`Composed prompt written to ${outputPath}`));
  } else {
    process.stdout.write(output);
  }

  return output;
}

module.exports = { composeCommand, renderComposed };
