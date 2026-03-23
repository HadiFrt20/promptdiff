const yaml = require('js-yaml');

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n?---\s*\n?/;

function parseFrontmatter(content) {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return { meta: {}, body: content };
  }

  const raw = match[1];
  let meta = {};

  try {
    meta = yaml.load(raw) || {};
  } catch (e) {
    meta = { _parseError: e.message };
  }

  // Normalize tags to array
  if (meta.tags && typeof meta.tags === 'string') {
    meta.tags = meta.tags.split(',').map(t => t.trim());
  }

  // Coerce version to number if possible
  if (meta.version !== undefined) {
    const num = Number(meta.version);
    if (!isNaN(num)) {
      meta.version = num;
    }
  }

  // Ensure created is a string
  if (meta.created instanceof Date) {
    meta.created = meta.created.toISOString().split('T')[0];
  }

  const body = content.slice(match[0].length);
  return { meta, body };
}

function hasFrontmatter(content) {
  return FRONTMATTER_REGEX.test(content);
}

module.exports = { parseFrontmatter, hasFrontmatter };
