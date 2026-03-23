const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const terminal = require('../formatter/terminal');
const { hasFrontmatter, parseFrontmatter } = require('../parser/frontmatter');
const { isSectionHeader } = require('../parser/section-detector');
const { classifyLines, groupIntoSections } = require('../migrator/classifier');

function generateFrontmatter(name, existingMeta) {
  const meta = {
    name: existingMeta.name || name,
    version: existingMeta.version || 1,
    created: existingMeta.created || new Date().toISOString().split('T')[0],
  };

  // Preserve any extra fields from existing meta
  for (const key of Object.keys(existingMeta)) {
    if (!(key in meta)) {
      meta[key] = existingMeta[key];
    }
  }

  const lines = ['---'];
  for (const [key, value] of Object.entries(meta)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: ${value.join(', ')}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function buildOutput(frontmatter, sections) {
  const parts = [frontmatter, ''];

  for (const section of sections) {
    parts.push(`# ${section.label}`);
    for (const line of section.lines) {
      parts.push(line);
    }
    parts.push('');
  }

  return parts.join('\n');
}

function migrateCommand(inputPath, options = {}) {
  console.log('');
  console.log(terminal.header('migrate'));
  console.log('');

  if (!fs.existsSync(inputPath)) {
    console.log(`  ${terminal.errorSymbol()} File not found: ${chalk.bold(inputPath)}`);
    console.log('');
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const totalLines = content.split('\n').filter(l => l.trim() !== '').length;

  // Determine prompt name
  const basename = path.basename(inputPath).replace(/\.(prompt|txt|md)$/, '');
  const name = options.name || basename;

  let frontmatter;
  let body;
  let existingMeta = {};

  // Step 1: handle frontmatter
  if (hasFrontmatter(content)) {
    const parsed = parseFrontmatter(content);
    existingMeta = parsed.meta;
    body = parsed.body;
    frontmatter = generateFrontmatter(name, existingMeta);
  } else {
    body = content;
    frontmatter = generateFrontmatter(name, {});
  }

  // Step 2: check if it already has section headers
  const bodyLines = body.split('\n');
  const hasHeaders = bodyLines.some(line => isSectionHeader(line));

  let sections;

  if (hasHeaders) {
    // Already has section headers — just wrap with frontmatter
    // Re-parse the sections to get a count
    const { detectSectionsFromText } = require('../parser/section-detector');
    sections = detectSectionsFromText(body);
    const output = buildOutput(frontmatter, sections);
    emitOutput(output, options, inputPath, totalLines, sections);
    return { output, sections };
  }

  // Step 3: plain text — classify each line
  const nonEmptyLines = bodyLines.filter(l => l.trim() !== '');
  const classified = classifyLines(nonEmptyLines);
  sections = groupIntoSections(classified);

  const output = buildOutput(frontmatter, sections);
  emitOutput(output, options, inputPath, totalLines, sections);
  return { output, sections };
}

function emitOutput(output, options, inputPath, totalLines, sections) {
  const outputPath = options.output;

  // Print section summary
  console.log(terminal.sectionHeader('Detected Sections'));
  console.log('');
  for (const section of sections) {
    const lineCount = section.lines.filter(l => l.trim() !== '').length;
    console.log(`    ${terminal.passSymbol()} ${chalk.bold(section.label)} ${chalk.dim(`(${lineCount} line${lineCount !== 1 ? 's' : ''})`)}`);
  }
  console.log('');
  console.log(terminal.divider());

  const sectionCount = sections.length;
  const summary = `  Migrated ${chalk.bold(totalLines)} lines into ${chalk.bold(sectionCount)} section${sectionCount !== 1 ? 's' : ''}`;

  if (outputPath && outputPath !== '-') {
    const resolvedOutput = path.resolve(process.cwd(), outputPath);
    fs.writeFileSync(resolvedOutput, output);
    console.log(`  ${terminal.passSymbol()} ${chalk.green('Written to')} ${chalk.bold(terminal.relativePath(resolvedOutput))}`);
    console.log(summary);
  } else {
    // stdout
    console.log('');
    console.log(terminal.sectionHeader('Output'));
    console.log('');
    for (const line of output.split('\n')) {
      console.log(`    ${line}`);
    }
    console.log('');
    console.log(terminal.divider());
    console.log(summary);
  }

  console.log('');
}

module.exports = { migrateCommand };
