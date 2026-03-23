const VAGUE_PATTERNS = [
  /\bappropriate\b/i,
  /\bas needed\b/i,
  /\bif necessary\b/i,
  /\bgenerally\b/i,
  /\btry to\b/i,
  /\bwhen possible\b/i,
  /\bsomewhat\b/i,
  /\bfairly\b/i,
  /\bpretty much\b/i,
  /\bkind of\b/i,
  /\bsort of\b/i,
  /\bmaybe\b/i,
  /\bprobably\b/i,
  /\bmight\b/i,
  /\bcould\b/i,
  /\betc\.?\b/i,
  /\band so on\b/i,
];

const NUMERIC_CONSTRAINT_PATTERN = /\b\d+\b.*\b(max|min|limit|at most|at least|no more than|no fewer than|exactly|up to|between|tokens?|words?|sentences?|lines?|characters?|items?|steps?)\b/i;
const NUMERIC_CONSTRAINT_PATTERN_ALT = /\b(max|min|limit|at most|at least|no more than|no fewer than|exactly|up to|between)\b.*\b\d+\b/i;
const ABSOLUTE_CONSTRAINT_PATTERN = /\b(must|always|never|shall|required|forbidden|do not|don't|will not|won't|cannot|can't)\b/i;

const INJECTION_GUARD_PATTERNS = [
  /\bignore\b.*\b(previous|above|prior)\b.*\b(instructions?|prompts?)\b/i,
  /\bdo not\b.*\b(follow|obey|execute)\b.*\b(user|input)\b/i,
  /\binjection\b/i,
  /\bjailbreak\b/i,
  /\bprompt injection\b/i,
  /\bignore all\b/i,
  /\boverride\b.*\b(instructions?)\b/i,
  /\bdo not reveal\b/i,
  /\bdo not share\b.*\b(system|instructions?|prompt)\b/i,
  /\bnever reveal\b/i,
  /\bdo not disclose\b/i,
];

const LOGICAL_SECTION_ORDER = [
  'system',
  'persona',
  'context',
  'constraints',
  'format',
  'tools',
  'examples',
  'guardrails',
];

function scoreStructure(parsedPrompt) {
  let score = 0;
  const details = [];
  const meta = parsedPrompt.meta || {};
  const sections = parsedPrompt.sections || [];

  // Has frontmatter (+5)
  const hasFrontmatter = Object.keys(meta).length > 0;
  if (hasFrontmatter) {
    score += 5;
    details.push('Has frontmatter');
  } else {
    details.push('Missing frontmatter');
  }

  // Has named sections (+5)
  const hasNamedSections = sections.length > 0 && sections.some(s => s.label);
  if (hasNamedSections) {
    score += 5;
    details.push('Has named sections');
  } else {
    details.push('No named sections');
  }

  // Has 3+ sections (+5)
  if (sections.length >= 3) {
    score += 5;
    details.push(`${sections.length} sections`);
  } else {
    details.push(`Only ${sections.length} section${sections.length !== 1 ? 's' : ''} (need 3+)`);
  }

  // Sections are logically ordered (+5)
  if (sections.length >= 2) {
    const typeOrder = sections
      .map(s => LOGICAL_SECTION_ORDER.indexOf(s.type))
      .filter(i => i >= 0);
    const isOrdered = typeOrder.every((val, i) => i === 0 || val >= typeOrder[i - 1]);
    if (isOrdered) {
      score += 5;
      details.push('Sections logically ordered');
    } else {
      details.push('Sections not in logical order');
    }
  } else {
    details.push('Too few sections to evaluate order');
  }

  return { name: 'Structure', score, max: 20, details };
}

function scoreSpecificity(parsedPrompt) {
  let score = 0;
  const details = [];
  const rawText = parsedPrompt.raw || '';

  // No vague language (+8)
  const vagueFound = VAGUE_PATTERNS.filter(p => p.test(rawText));
  if (vagueFound.length === 0) {
    score += 8;
    details.push('No vague language');
  } else {
    details.push(`${vagueFound.length} vague term${vagueFound.length !== 1 ? 's' : ''} found`);
  }

  // Has numeric constraints (+6)
  const hasNumeric = NUMERIC_CONSTRAINT_PATTERN.test(rawText) || NUMERIC_CONSTRAINT_PATTERN_ALT.test(rawText);
  if (hasNumeric) {
    score += 6;
    details.push('Has numeric constraints');
  } else {
    details.push('No numeric constraints');
  }

  // Constraints are absolute (+6)
  const constraintSections = (parsedPrompt.sections || []).filter(s => s.type === 'constraints');
  const constraintText = constraintSections.map(s => s.raw).join('\n');
  if (constraintText.length > 0 && ABSOLUTE_CONSTRAINT_PATTERN.test(constraintText)) {
    score += 6;
    details.push('Constraints are absolute');
  } else if (constraintText.length === 0) {
    details.push('No constraints section');
  } else {
    details.push('Constraints lack absolute language');
  }

  return { name: 'Specificity', score, max: 20, details };
}

function scoreExamples(parsedPrompt) {
  let score = 0;
  const details = [];
  const sections = parsedPrompt.sections || [];

  const exampleSections = sections.filter(s => s.type === 'examples');

  // Has examples section (+5)
  if (exampleSections.length > 0) {
    score += 5;
    details.push('Has examples section');
  } else {
    details.push('No examples section');
    return { name: 'Examples', score, max: 20, details };
  }

  // Count individual examples (lines starting with - or numbered, or separated by blank lines)
  const exampleText = exampleSections.map(s => s.raw).join('\n');
  const exampleLines = exampleText.split('\n');
  const exampleCount = exampleLines.filter(l =>
    /^\s*[-*]\s/.test(l) ||
    /^\s*\d+[.)]\s/.test(l) ||
    /^(input|output|user|assistant|example|q:|a:)/i.test(l.trim())
  ).length;

  const effectiveCount = Math.max(exampleCount, exampleSections.length > 0 && exampleLines.length >= 4 ? 2 : exampleCount);

  // 2+ examples (+10)
  if (effectiveCount >= 2) {
    score += 10;
    details.push(`${effectiveCount} examples found`);
  } else {
    details.push(`Only ${effectiveCount} example${effectiveCount !== 1 ? 's' : ''} (need 2+)`);
  }

  // Consistent format (+5) — check if examples follow the same pattern
  if (effectiveCount >= 2) {
    const bulletExamples = exampleLines.filter(l => /^\s*[-*]\s/.test(l)).length;
    const numberedExamples = exampleLines.filter(l => /^\s*\d+[.)]\s/.test(l)).length;
    const isConsistent = (bulletExamples >= 2 && numberedExamples === 0) ||
                         (numberedExamples >= 2 && bulletExamples === 0) ||
                         (bulletExamples === 0 && numberedExamples === 0);
    if (isConsistent) {
      score += 5;
      details.push('Consistent example format');
    } else {
      details.push('Inconsistent example formatting');
    }
  }

  return { name: 'Examples', score, max: 20, details };
}

function scoreSafety(parsedPrompt) {
  let score = 0;
  const details = [];
  const rawText = parsedPrompt.raw || '';
  const sections = parsedPrompt.sections || [];

  // Has injection guard (+10)
  const hasInjectionGuard = INJECTION_GUARD_PATTERNS.some(p => p.test(rawText));
  if (hasInjectionGuard) {
    score += 10;
    details.push('Has injection guard');
  } else {
    details.push('No injection guard');
  }

  // Has guardrails or forbidden topics (+10)
  const hasGuardrails = sections.some(s => s.type === 'guardrails');
  const hasForbiddenTopics = /\b(forbidden|prohibited|off-limits|blacklist|blocklist|not allowed|refuse|decline)\b/i.test(rawText);
  if (hasGuardrails || hasForbiddenTopics) {
    score += 10;
    details.push(hasGuardrails ? 'Has guardrails section' : 'Has forbidden topics');
  } else {
    details.push('No guardrails or forbidden topics');
  }

  return { name: 'Safety', score, max: 20, details };
}

function scoreCompleteness(parsedPrompt) {
  let score = 0;
  const details = [];
  const sections = parsedPrompt.sections || [];
  const sectionTypes = new Set(sections.map(s => s.type));

  // Has persona (+5)
  if (sectionTypes.has('persona')) {
    score += 5;
    details.push('Has persona');
  } else {
    details.push('Missing persona');
  }

  // Has constraints (+5)
  if (sectionTypes.has('constraints')) {
    score += 5;
    details.push('Has constraints');
  } else {
    details.push('Missing constraints');
  }

  // Has format (+5)
  if (sectionTypes.has('format')) {
    score += 5;
    details.push('Has format');
  } else {
    details.push('Missing format');
  }

  // Has examples (+5)
  if (sectionTypes.has('examples')) {
    score += 5;
    details.push('Has examples');
  } else {
    details.push('Missing examples');
  }

  return { name: 'Completeness', score, max: 20, details };
}

function computeGrade(total) {
  if (total >= 90) return 'A';
  if (total >= 75) return 'B';
  if (total >= 60) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}

function computeQualityScore(parsedPrompt, lintResult) {
  const dimensions = [
    scoreStructure(parsedPrompt),
    scoreSpecificity(parsedPrompt),
    scoreExamples(parsedPrompt),
    scoreSafety(parsedPrompt),
    scoreCompleteness(parsedPrompt),
  ];

  const total = dimensions.reduce((sum, d) => sum + d.score, 0);
  const grade = computeGrade(total);

  return { total, dimensions, grade };
}

module.exports = { computeQualityScore };
