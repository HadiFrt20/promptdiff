const SECTION_HEADER_REGEX = /^#\s+(.+?)\s*$/;

const TYPE_MAP = {
  'persona': 'persona',
  'role': 'persona',
  'identity': 'persona',
  'character': 'persona',
  'constraints': 'constraints',
  'rules': 'constraints',
  'guidelines': 'constraints',
  'boundaries': 'constraints',
  'examples': 'examples',
  'few-shot': 'examples',
  'demonstrations': 'examples',
  'output format': 'format',
  'format': 'format',
  'response format': 'format',
  'system': 'system',
  'system prompt': 'system',
  'context': 'context',
  'background': 'context',
  'tools': 'tools',
  'functions': 'tools',
  'capabilities': 'tools',
  'guardrails': 'guardrails',
  'safety': 'guardrails',
  'restrictions': 'guardrails',
};

function detectSectionType(label) {
  const normalized = label.trim().toLowerCase();
  return TYPE_MAP[normalized] || 'custom';
}

function isSectionHeader(line) {
  return SECTION_HEADER_REGEX.test(line);
}

function parseSectionHeader(line) {
  const match = line.match(SECTION_HEADER_REGEX);
  if (!match) return null;
  return match[1].trim();
}

function detectSectionsFromText(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    if (isSectionHeader(line)) {
      if (currentSection) {
        currentSection.lines = currentSection.lines.filter(l => l !== '');
        currentSection.raw = currentSection.lines.join('\n');
        sections.push(currentSection);
      }
      const label = parseSectionHeader(line);
      currentSection = {
        type: detectSectionType(label),
        label: label,
        lines: [],
        raw: '',
      };
    } else if (currentSection) {
      const trimmed = line.trimEnd();
      if (trimmed !== '' || currentSection.lines.length > 0) {
        currentSection.lines.push(trimmed);
      }
    }
  }

  if (currentSection) {
    currentSection.lines = currentSection.lines.filter(l => l !== '');
    currentSection.raw = currentSection.lines.join('\n');
    sections.push(currentSection);
  }

  return sections;
}

function autoDetectSections(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
  if (lines.length === 0) return [];

  const sections = [];
  let personaLines = [];
  let constraintLines = [];
  let otherLines = [];

  for (const line of lines) {
    if (/^you are /i.test(line)) {
      personaLines.push(line);
    } else if (/^(never|always|do not|don't|keep |must |only )/i.test(line)) {
      constraintLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  if (personaLines.length > 0) {
    sections.push({
      type: 'persona',
      label: 'PERSONA',
      lines: personaLines,
      raw: personaLines.join('\n'),
    });
  }

  if (constraintLines.length > 0) {
    sections.push({
      type: 'constraints',
      label: 'CONSTRAINTS',
      lines: constraintLines,
      raw: constraintLines.join('\n'),
    });
  }

  if (otherLines.length > 0 && personaLines.length === 0 && constraintLines.length === 0) {
    sections.push({
      type: 'custom',
      label: 'CONTENT',
      lines: otherLines,
      raw: otherLines.join('\n'),
    });
  } else if (otherLines.length > 0) {
    sections.push({
      type: 'custom',
      label: 'OTHER',
      lines: otherLines,
      raw: otherLines.join('\n'),
    });
  }

  return sections;
}

module.exports = {
  detectSectionType,
  isSectionHeader,
  parseSectionHeader,
  detectSectionsFromText,
  autoDetectSections,
  TYPE_MAP,
};
