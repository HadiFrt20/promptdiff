const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter');
const { detectSectionsFromText, autoDetectSections, isSectionHeader } = require('./section-detector');
const { computeHash } = require('../utils/hash');

/**
 * Parse a prompt file without composition (to avoid circular requires).
 */
function rawParse(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const hash = computeHash(content);
  const { meta, body } = parseFrontmatter(content);

  let sections;
  const hasHeaders = body.split('\n').some(line => isSectionHeader(line));
  if (hasHeaders) {
    sections = detectSectionsFromText(body);
  } else {
    sections = autoDetectSections(body);
  }

  return { meta, sections, raw: content, filePath, hash };
}

/**
 * Compose a parsed prompt by resolving extends and includes directives.
 *
 * @param {object} parsedPrompt - The parsed prompt object
 * @param {Set} [seen] - Set of already-seen file paths (for cycle detection)
 * @returns {object} A new parsedPrompt with composed sections
 */
function compose(parsedPrompt, seen) {
  const currentFile = path.resolve(parsedPrompt.filePath);
  if (!seen) {
    seen = new Set();
  }

  if (seen.has(currentFile)) {
    throw new Error(`Circular include detected: ${currentFile}`);
  }
  seen.add(currentFile);

  const baseDir = path.dirname(currentFile);
  const meta = parsedPrompt.meta || {};
  let composedSections = [];
  let didCompose = false;

  // 1. Handle extends: load base, compose it recursively, use as starting point
  if (meta.extends) {
    didCompose = true;
    const basePath = path.resolve(baseDir, meta.extends);
    const baseParsed = rawParse(basePath);
    const composedBase = compose(baseParsed, new Set(seen));
    composedSections = cloneSections(composedBase.sections);
  }

  // 2. Handle includes: merge each included file's sections
  if (meta.includes && Array.isArray(meta.includes)) {
    didCompose = true;
    for (const includePath of meta.includes) {
      const resolvedPath = path.resolve(baseDir, includePath);

      if (seen.has(resolvedPath)) {
        throw new Error(`Circular include detected: ${resolvedPath}`);
      }

      const includeParsed = rawParse(resolvedPath);
      const composedInclude = compose(includeParsed, new Set(seen));

      composedSections = mergeSections(composedSections, composedInclude.sections);
    }
  }

  // 3. Overlay the current prompt's own sections
  if (meta.extends) {
    // extends mode: child replaces parent sections by label
    composedSections = overlaySections(composedSections, parsedPrompt.sections);
  } else if (meta.includes) {
    // includes mode: concatenate (included lines first, then current)
    composedSections = mergeSections(composedSections, parsedPrompt.sections);
  } else {
    // No composition needed
    composedSections = parsedPrompt.sections;
  }

  if (!didCompose) {
    return parsedPrompt;
  }

  return {
    meta: parsedPrompt.meta,
    sections: composedSections,
    raw: parsedPrompt.raw,
    filePath: parsedPrompt.filePath,
    hash: parsedPrompt.hash,
    composed: true,
  };
}

/**
 * Deep-clone an array of sections.
 */
function cloneSections(sections) {
  return sections.map(s => ({
    type: s.type,
    label: s.label,
    lines: [...s.lines],
    raw: s.raw,
  }));
}

/**
 * Merge sections by concatenating lines for matching labels.
 * Sections from `incoming` that don't exist in `base` are appended.
 * For matching labels, incoming lines come first, then base lines.
 * Wait -- the spec says "included lines come first, then current file's lines".
 * Since we call mergeSections(composedSections, currentSections),
 * composedSections already has included content, and currentSections is the new file.
 * So for merge: existing lines come first, then incoming lines come after.
 * Actually let me re-read: we call mergeSections(composedSections, includeParsed.sections)
 * where composedSections starts empty for includes. Then we call
 * mergeSections(composedSections, parsedPrompt.sections) to add the current file on top.
 * So the order is: first call puts included lines in, second call puts current lines.
 * In the merge, for existing sections, we want `base` lines first then `incoming` lines.
 */
function mergeSections(base, incoming) {
  const result = cloneSections(base);
  const labelMap = new Map();
  for (let i = 0; i < result.length; i++) {
    labelMap.set(result[i].label, i);
  }

  for (const section of incoming) {
    if (labelMap.has(section.label)) {
      const idx = labelMap.get(section.label);
      const existing = result[idx];
      existing.lines = [...existing.lines, ...section.lines];
      existing.raw = existing.lines.join('\n');
    } else {
      labelMap.set(section.label, result.length);
      result.push({
        type: section.type,
        label: section.label,
        lines: [...section.lines],
        raw: section.raw,
      });
    }
  }

  return result;
}

/**
 * Overlay sections: child sections replace parent sections with matching labels.
 * Parent sections not in child are kept. Child sections not in parent are appended.
 */
function overlaySections(base, child) {
  const result = cloneSections(base);
  const labelMap = new Map();
  for (let i = 0; i < result.length; i++) {
    labelMap.set(result[i].label, i);
  }

  for (const section of child) {
    if (labelMap.has(section.label)) {
      const idx = labelMap.get(section.label);
      result[idx] = {
        type: section.type,
        label: section.label,
        lines: [...section.lines],
        raw: section.raw,
      };
    } else {
      labelMap.set(section.label, result.length);
      result.push({
        type: section.type,
        label: section.label,
        lines: [...section.lines],
        raw: section.raw,
      });
    }
  }

  return result;
}

module.exports = { compose };
