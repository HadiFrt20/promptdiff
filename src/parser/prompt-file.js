const fs = require('fs');
const path = require('path');
const { parseFrontmatter, hasFrontmatter } = require('./frontmatter');
const { detectSectionsFromText, autoDetectSections, isSectionHeader } = require('./section-detector');
const { computeHash } = require('../utils/hash');

function parsePromptFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    throw new Error(`Cannot read file: ${filePath} — ${e.message}`);
  }

  // Check for binary content
  if (/[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 1000))) {
    throw new Error(`File appears to be binary: ${filePath}`);
  }

  return parsePromptContent(content, filePath);
}

function parsePromptContent(content, filePath = '<inline>') {
  const hash = computeHash(content);
  const { meta, body } = parseFrontmatter(content);

  let sections;
  const hasHeaders = body.split('\n').some(line => isSectionHeader(line));

  if (hasHeaders) {
    sections = detectSectionsFromText(body);
  } else {
    sections = autoDetectSections(body);
  }

  return {
    meta,
    sections,
    raw: content,
    filePath: filePath,
    hash,
  };
}

module.exports = { parsePromptFile, parsePromptContent };
