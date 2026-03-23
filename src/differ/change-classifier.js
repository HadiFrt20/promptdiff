function tokenize(text) {
  return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
}

function tokenOverlap(a, b) {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 && tokensB.length === 0) return 1;
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let overlap = 0;
  for (const t of setA) {
    if (setB.has(t)) overlap++;
  }
  return overlap / Math.max(setA.size, setB.size);
}

const NUMERIC_PATTERN = /(\d+)\s*(words?|characters?|sentences?|items?|examples?|minutes?|seconds?)/i;

function extractNumeric(line) {
  const match = line.match(NUMERIC_PATTERN);
  if (!match) return null;
  return { value: parseInt(match[1], 10), unit: match[2].toLowerCase() };
}

function classifyChange(leftLine, rightLine, sectionType) {
  // Addition
  if (!leftLine && rightLine) {
    return {
      type: 'added',
      impact: getAddImpact(sectionType),
    };
  }

  // Removal
  if (leftLine && !rightLine) {
    return {
      type: 'removed',
      impact: getRemoveImpact(sectionType),
    };
  }

  // Both exist — compare
  const overlap = tokenOverlap(leftLine, rightLine);

  // Check for numeric tightening/relaxing
  const leftNum = extractNumeric(leftLine);
  const rightNum = extractNumeric(rightLine);
  if (leftNum && rightNum && leftNum.unit === rightNum.unit) {
    if (rightNum.value < leftNum.value) {
      return { type: 'tightened', impact: 'high' };
    }
    if (rightNum.value > leftNum.value) {
      return { type: 'relaxed', impact: 'high' };
    }
  }

  if (overlap >= 0.6) {
    return {
      type: 'modified',
      impact: getModifyImpact(sectionType),
    };
  }

  if (overlap < 0.3) {
    return {
      type: 'replaced',
      impact: getReplaceImpact(sectionType),
    };
  }

  return {
    type: 'modified',
    impact: getModifyImpact(sectionType),
  };
}

function getAddImpact(sectionType) {
  if (sectionType === 'constraints' || sectionType === 'guardrails') return 'medium';
  if (sectionType === 'format') return 'medium';
  return 'low';
}

function getRemoveImpact(sectionType) {
  if (sectionType === 'examples') return 'high';
  if (sectionType === 'constraints' || sectionType === 'guardrails') return 'high';
  return 'medium';
}

function getModifyImpact(sectionType) {
  if (sectionType === 'constraints' || sectionType === 'guardrails') return 'medium';
  if (sectionType === 'persona') return 'low';
  if (sectionType === 'format') return 'low';
  return 'low';
}

function getReplaceImpact(sectionType) {
  if (sectionType === 'constraints' || sectionType === 'guardrails') return 'high';
  if (sectionType === 'examples') return 'high';
  return 'medium';
}

function classifyExampleCountChange(leftCount, rightCount) {
  const diff = rightCount - leftCount;
  if (diff === 0) return null;
  if (rightCount === 0) return { type: 'removed', impact: 'high' };
  if (leftCount - rightCount >= 2) return { type: 'removed', impact: 'high' };
  if (leftCount - rightCount === 1) return { type: 'removed', impact: 'medium' };
  return { type: 'added', impact: 'medium' };
}

module.exports = {
  classifyChange,
  classifyExampleCountChange,
  tokenOverlap,
  extractNumeric,
};
