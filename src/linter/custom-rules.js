const fs = require('fs');
const path = require('path');

const RC_FILENAME = '.promptdiffrc';

function loadRcFile(dir) {
  const rcPath = path.join(dir, RC_FILENAME);

  if (!fs.existsSync(rcPath)) {
    return null;
  }

  const raw = fs.readFileSync(rcPath, 'utf-8');
  return JSON.parse(raw);
}

function buildSectionCountRule(def) {
  const max = def.pattern.max;
  return {
    id: def.id,
    severity: def.severity || 'warn',
    check(parsedPrompt) {
      const count = parsedPrompt.sections.length;
      if (count > max) {
        return [{
          severity: def.severity || 'warn',
          message: def.message || `Too many sections (${count}/${max}).`,
          section: null,
          line: null,
        }];
      }
      return [];
    },
    fix() { return null; },
  };
}

function buildRequireSectionRule(def) {
  const required = def.pattern.section.toLowerCase();
  return {
    id: def.id,
    severity: def.severity || 'error',
    check(parsedPrompt) {
      const found = parsedPrompt.sections.some(
        s => s.type === required || (s.label && s.label.toLowerCase() === required)
      );
      if (!found) {
        return [{
          severity: def.severity || 'error',
          message: def.message || `Required section "${required}" is missing.`,
          section: null,
          line: null,
        }];
      }
      return [];
    },
    fix() { return null; },
  };
}

function buildBannedWordsRule(def) {
  const words = def.pattern.words.map(w => w.toLowerCase());
  return {
    id: def.id,
    severity: def.severity || 'warn',
    check(parsedPrompt) {
      const issues = [];
      const allText = parsedPrompt.sections.map(s => s.raw).join('\n');
      for (const word of words) {
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
        if (regex.test(allText)) {
          issues.push({
            severity: def.severity || 'warn',
            message: def.message || `Contains banned word: "${word}".`,
            section: null,
            line: null,
          });
        }
      }
      return issues;
    },
    fix() { return null; },
  };
}

function buildMinExamplesRule(def) {
  const min = def.pattern.min;
  return {
    id: def.id,
    severity: def.severity || 'error',
    check(parsedPrompt) {
      const examplesSection = parsedPrompt.sections.find(s => s.type === 'examples');
      if (!examplesSection) {
        return [{
          severity: def.severity || 'error',
          message: def.message || `No EXAMPLES section found. At least ${min} examples required.`,
          section: null,
          line: null,
        }];
      }
      const count = examplesSection.lines.filter(l => l.trim().length > 0).length;
      if (count < min) {
        return [{
          severity: def.severity || 'error',
          message: def.message || `Only ${count} example(s) found. At least ${min} required.`,
          section: 'EXAMPLES',
          line: null,
        }];
      }
      return [];
    },
    fix() { return null; },
  };
}

function buildMaxWordCountRule(def) {
  const max = def.pattern.max;
  return {
    id: def.id,
    severity: def.severity || 'warn',
    check(parsedPrompt) {
      const allText = parsedPrompt.sections.map(s => s.raw).join('\n');
      const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount > max) {
        return [{
          severity: def.severity || 'warn',
          message: def.message || `Prompt has ${wordCount} words, exceeding the ${max} word limit.`,
          section: null,
          line: null,
        }];
      }
      return [];
    },
    fix() { return null; },
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PATTERN_BUILDERS = {
  'section-count': buildSectionCountRule,
  'require-section': buildRequireSectionRule,
  'banned-words': buildBannedWordsRule,
  'min-examples': buildMinExamplesRule,
  'max-word-count': buildMaxWordCountRule,
};

function loadCustomRules(dir) {
  dir = dir || process.cwd();

  const result = { customRules: [], disabledRules: [] };

  let rc;
  try {
    rc = loadRcFile(dir);
  } catch (e) {
    return result;
  }

  if (!rc || !rc.rules) {
    return result;
  }

  if (Array.isArray(rc.rules.disabled)) {
    result.disabledRules = rc.rules.disabled;
  }

  if (Array.isArray(rc.rules.custom)) {
    for (const def of rc.rules.custom) {
      const builder = PATTERN_BUILDERS[def.pattern?.type];
      if (builder) {
        result.customRules.push(builder(def));
      }
    }
  }

  return result;
}

module.exports = { loadCustomRules, loadRcFile, PATTERN_BUILDERS };
