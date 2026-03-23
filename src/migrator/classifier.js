const SECTION_PATTERNS = {
  persona: [
    { regex: /^you are /i, weight: 0.95 },
    { regex: /^as (a|an) /i, weight: 0.85 },
    { regex: /^your (role|name|job|purpose) /i, weight: 0.9 },
    { regex: /^act as /i, weight: 0.9 },
  ],
  constraints: [
    { regex: /^never /i, weight: 0.9 },
    { regex: /^always /i, weight: 0.85 },
    { regex: /^do not /i, weight: 0.9 },
    { regex: /^don't /i, weight: 0.9 },
    { regex: /^must /i, weight: 0.85 },
    { regex: /^only /i, weight: 0.8 },
    { regex: /^keep /i, weight: 0.7 },
    { regex: /^avoid /i, weight: 0.8 },
    { regex: /^ensure /i, weight: 0.7 },
    { regex: /^limit /i, weight: 0.75 },
  ],
  examples: [
    { regex: /\u2192/, weight: 0.9 },
    { regex: /->/, weight: 0.85 },
    { regex: /^user:/i, weight: 0.9 },
    { regex: /^input:/i, weight: 0.9 },
    { regex: /^assistant:/i, weight: 0.85 },
    { regex: /^output:/i, weight: 0.85 },
    { regex: /^example:/i, weight: 0.95 },
    { regex: /^e\.g\./i, weight: 0.8 },
    { regex: /^for example/i, weight: 0.85 },
    { regex: /^q:/i, weight: 0.8 },
    { regex: /^a:/i, weight: 0.7 },
  ],
  format: [
    { regex: /respond in/i, weight: 0.9 },
    { regex: /output as/i, weight: 0.9 },
    { regex: /use markdown/i, weight: 0.9 },
    { regex: /no bullet/i, weight: 0.85 },
    { regex: /sign off/i, weight: 0.8 },
    { regex: /format (your|the|each)/i, weight: 0.85 },
    { regex: /reply (in|with|using)/i, weight: 0.8 },
    { regex: /response should (be|include|contain|start|end)/i, weight: 0.85 },
    { regex: /use (json|xml|html|csv|yaml|plain text)/i, weight: 0.9 },
    { regex: /^(start|end|begin) (with|each|every|your)/i, weight: 0.75 },
    { regex: /bullet point/i, weight: 0.8 },
    { regex: /numbered list/i, weight: 0.8 },
    { regex: /keep (it |responses? )?(short|brief|concise)/i, weight: 0.8 },
  ],
  guardrails: [
    { regex: /ignore (previous |prior |all )?instructions/i, weight: 0.95 },
    { regex: /do not execute/i, weight: 0.9 },
    { regex: /never share/i, weight: 0.9 },
    { regex: /never reveal/i, weight: 0.9 },
    { regex: /do not (disclose|reveal|leak|expose)/i, weight: 0.9 },
    { regex: /if (the |a )?(user|someone) (tries|attempts|asks) to/i, weight: 0.85 },
    { regex: /refuse to/i, weight: 0.8 },
    { regex: /safety/i, weight: 0.7 },
    { regex: /harmful/i, weight: 0.75 },
    { regex: /malicious/i, weight: 0.8 },
    { regex: /injection/i, weight: 0.85 },
    { regex: /jailbreak/i, weight: 0.85 },
  ],
  context: [
    { regex: /^the (codebase|system|project|app|application|platform|company|team|product) (is|has|uses|was|runs)/i, weight: 0.9 },
    { regex: /^you have access to/i, weight: 0.9 },
    { regex: /^the user (is|will|has|wants|needs)/i, weight: 0.85 },
    { regex: /^(we|our) (use|have|are|run|deploy|build)/i, weight: 0.8 },
    { regex: /^(this|the) (is a|project|repo|repository|service|api)/i, weight: 0.8 },
    { regex: /^background:/i, weight: 0.95 },
    { regex: /^context:/i, weight: 0.95 },
    { regex: /^note:/i, weight: 0.7 },
    { regex: /^important:/i, weight: 0.7 },
  ],
};

function classifyLine(line) {
  const trimmed = line.trim();
  if (trimmed === '') {
    return { section: 'unknown', confidence: 0 };
  }

  let bestSection = 'unknown';
  let bestConfidence = 0;

  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const { regex, weight } of patterns) {
      if (regex.test(trimmed)) {
        if (weight > bestConfidence) {
          bestSection = section;
          bestConfidence = weight;
        }
      }
    }
  }

  return { section: bestSection, confidence: bestConfidence };
}

function classifyLines(lines) {
  return lines.map(line => {
    const { section, confidence } = classifyLine(line);
    return { line, section, confidence };
  });
}

function groupIntoSections(classified) {
  const sections = [];
  let current = null;
  let lastKnownSection = 'constraints'; // fallback

  for (const item of classified) {
    const trimmed = item.line.trim();

    // Skip blank lines between sections but preserve them within
    if (trimmed === '') {
      if (current && current.lines.length > 0) {
        current.lines.push(item.line);
      }
      continue;
    }

    let effectiveSection = item.section;
    if (effectiveSection === 'unknown') {
      effectiveSection = lastKnownSection;
    } else {
      lastKnownSection = effectiveSection;
    }

    if (current && current.type === effectiveSection) {
      current.lines.push(item.line);
    } else {
      // Trim trailing blank lines from previous section
      if (current) {
        while (current.lines.length > 0 && current.lines[current.lines.length - 1].trim() === '') {
          current.lines.pop();
        }
        sections.push(current);
      }
      current = {
        type: effectiveSection,
        label: sectionLabel(effectiveSection),
        lines: [item.line],
      };
    }
  }

  if (current) {
    while (current.lines.length > 0 && current.lines[current.lines.length - 1].trim() === '') {
      current.lines.pop();
    }
    if (current.lines.length > 0) {
      sections.push(current);
    }
  }

  return sections;
}

function sectionLabel(type) {
  const labels = {
    persona: 'PERSONA',
    constraints: 'CONSTRAINTS',
    examples: 'EXAMPLES',
    format: 'OUTPUT FORMAT',
    guardrails: 'GUARDRAILS',
    context: 'CONTEXT',
    unknown: 'OTHER',
  };
  return labels[type] || type.toUpperCase();
}

module.exports = { classifyLine, classifyLines, groupIntoSections, SECTION_PATTERNS };
