const { extractNumeric } = require('./change-classifier');

const NOISE_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'be', 'you', 'your', 'that', 'this', 'with', 'from', 'by']);

const BEHAVIORAL_IMPACTS = {
  'constraints:tightened': 'Output will be more constrained',
  'constraints:relaxed': 'Output may be less focused',
  'constraints:removed': 'Behavioral boundary removed',
  'constraints:added': 'New behavioral boundary',
  'examples:removed': 'Output consistency may decrease',
  'examples:added': 'Output consistency improves',
  'persona:modified': 'Tone/style will shift',
  'persona:removed': 'Identity partially lost',
  'format:modified': 'Output structure changes',
  'format:added': 'Output structure now defined',
  'guardrails:removed': 'Safety boundary removed — review carefully',
  'guardrails:added': 'Safety boundary added',
};

function lookupBehavioralNote(change) {
  const section = (change.section || '').toLowerCase();
  const changeType = change.type || '';
  const key = `${section}:${changeType}`;
  return BEHAVIORAL_IMPACTS[key] || null;
}

function annotateChange(change) {
  const desc = generateDescription(change);
  const behavioralNote = lookupBehavioralNote(change);
  const result = {
    ...change,
    description: desc,
  };
  if (behavioralNote) {
    result.behavioralNote = behavioralNote;
  }
  return result;
}

function generateDescription(change) {
  switch (change.type) {
    case 'added':
      return describeAdded(change);
    case 'removed':
      return describeRemoved(change);
    case 'modified':
      return describeModified(change);
    case 'tightened':
      return describeTightened(change);
    case 'relaxed':
      return describeRelaxed(change);
    case 'replaced':
      return describeReplaced(change);
    default:
      return `${change.type} change in ${change.section || 'unknown'}`;
  }
}

function cleanWords(line) {
  return line.toLowerCase().replace(/[.,!?;:'"()]/g, '').split(/\s+/).filter(w => w.length > 0);
}

function significantWords(words) {
  return words.filter(w => !NOISE_WORDS.has(w) && w.length > 1);
}

function describeAdded(change) {
  const line = change.right_line || '';
  if (line.length > 60) {
    return `New instruction added to ${change.section || 'section'}`;
  }
  return `Added "${truncate(line, 55)}"`;
}

function describeRemoved(change) {
  const line = change.left_line || '';
  const detail = change.detail || '';
  if (detail.includes('example') || detail.includes('Example')) {
    return detail;
  }
  if (line.length > 60) {
    return `Removed instruction from ${change.section || 'section'}`;
  }
  return `Removed "${truncate(line, 55)}"`;
}

function describeModified(change) {
  const leftLine = change.left_line || '';
  const rightLine = change.right_line || '';
  const section = change.section || 'section';

  const leftWords = significantWords(cleanWords(leftLine));
  const rightWords = significantWords(cleanWords(rightLine));

  const leftSet = new Set(leftWords);
  const rightSet = new Set(rightWords);

  const removed = leftWords.filter(w => !rightSet.has(w));
  const added = rightWords.filter(w => !leftSet.has(w));

  // Deduplicate
  const removedUnique = [...new Set(removed)];
  const addedUnique = [...new Set(added)];

  if (removedUnique.length > 0 && addedUnique.length === 0) {
    return `Removed "${removedUnique.slice(0, 3).join(', ')}" from ${section}`;
  }
  if (addedUnique.length > 0 && removedUnique.length === 0) {
    return `Added "${addedUnique.slice(0, 3).join(', ')}" to ${section}`;
  }
  if (removedUnique.length > 0 && addedUnique.length > 0) {
    return `"${removedUnique.slice(0, 2).join(', ')}" → "${addedUnique.slice(0, 2).join(', ')}" in ${section}`;
  }
  return `Wording changed in ${section}`;
}

function describeTightened(change) {
  const leftNum = extractNumeric(change.left_line || '');
  const rightNum = extractNumeric(change.right_line || '');
  if (leftNum && rightNum) {
    return `Word limit tightened: ${leftNum.value} → ${rightNum.value} ${rightNum.unit}`;
  }
  return 'Constraint tightened';
}

function describeRelaxed(change) {
  const leftNum = extractNumeric(change.left_line || '');
  const rightNum = extractNumeric(change.right_line || '');
  if (leftNum && rightNum) {
    return `Word limit relaxed: ${leftNum.value} → ${rightNum.value} ${rightNum.unit}`;
  }
  return 'Constraint relaxed';
}

function describeReplaced(change) {
  return `Replaced instruction in ${change.section || 'section'}`;
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

module.exports = { annotateChange, generateDescription };
